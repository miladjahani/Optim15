#!/usr/bin/env python3
"""
Cloudflare Clean IP Scanner Engine (Full-Scale High-Performance Python Implementation)
Ported directly from Cloudflare-Clean-IP-Scanner (task/tcping, task/httping, task/download, task/ip, utils/csv).
Capable of scanning hundreds/thousands of IPs across all official Cloudflare CIDRs with multi-threading.
"""

import socket
import ssl
import time
import random
import ipaddress
import urllib.request
import urllib.parse
import re
import concurrent.futures
import threading
import os

class CloudflareScanner:
    def __init__(self, port=443, max_threads=50, ping_trials=3, download_timeout=3.0):
        self.port = port
        self.max_threads = max_threads
        self.ping_trials = ping_trials
        self.download_timeout = download_timeout
        self.is_running = False
        self.progress = 0.0
        self.total_ips = 0
        self.tested_count = 0
        self.results = []
        self.current_ip = ""
        self._lock = threading.Lock()

    def generate_ips_from_cidrs(self, cidrs, count_per_cidr=25):
        """Generates random candidate IPs from a list of CIDR blocks."""
        candidate_ips = []
        for cidr_str in cidrs:
            cidr_str = cidr_str.strip()
            if not cidr_str or cidr_str.startswith("#"):
                continue
            try:
                # If single IP
                if "/" not in cidr_str:
                    candidate_ips.append(cidr_str)
                    continue

                net = ipaddress.ip_network(cidr_str)
                num_hosts = net.num_addresses
                if num_hosts <= 4:
                    candidate_ips.extend([str(ip) for ip in net.hosts()])
                    continue

                chosen = set()
                attempts = 0
                max_attempts = count_per_cidr * 6
                while len(chosen) < count_per_cidr and attempts < max_attempts:
                    rand_offset = random.randint(2, num_hosts - 3)
                    chosen.add(str(net[rand_offset]))
                    attempts += 1

                candidate_ips.extend(list(chosen))
            except Exception:
                continue
        return candidate_ips

    def tcping(self, ip, port, count=3, timeout=1.0):
        """Performs TCP ping trials on target IP (similar to task/tcping.go)."""
        latencies = []
        loss_count = 0
        
        for _ in range(count):
            t0 = time.perf_counter()
            try:
                s = socket.create_connection((ip, int(port)), timeout=timeout)
                dur_ms = (time.perf_counter() - t0) * 1000
                s.close()
                latencies.append(dur_ms)
            except Exception:
                loss_count += 1

        loss_rate = round((loss_count / count) * 100, 1)
        if latencies:
            avg_lat = round(sum(latencies) / len(latencies), 1)
            min_lat = round(min(latencies), 1)
            max_lat = round(max(latencies), 1)
            jitter = round(max_lat - min_lat, 1)
            return {
                "ok": True,
                "latency": avg_lat,
                "min": min_lat,
                "max": max_lat,
                "jitter": jitter,
                "lossRate": loss_rate
            }
        return {"ok": False, "latency": None, "lossRate": 100.0, "jitter": None}

    def httping(self, ip, port=443, host="speed.cloudflare.com", timeout=1.8):
        """Verifies TLS handshake & CDN edge datacenter (similar to task/httping.go)."""
        t0 = time.perf_counter()
        try:
            req = urllib.request.Request(
                f"https://{ip}:{port}/cdn-cgi/trace",
                headers={"Host": host, "User-Agent": "Cloudflare-Clean-IP-Scanner/5.0"}
            )
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                status = resp.status
                ttfb_ms = round((time.perf_counter() - t0) * 1000, 1)
                body = resp.read(256).decode("utf-8", errors="ignore")
                colo_match = re.search(r"colo=([A-Z]{3})", body)
                colo = colo_match.group(1) if colo_match else "Edge"
                return {"ok": status == 200, "ttfb": ttfb_ms, "colo": colo}
        except Exception:
            return {"ok": False, "ttfb": None, "colo": "Unknown"}

    def measure_download_speed(self, ip, port=443, host="speed.cloudflare.com", size_bytes=2000000):
        """Measures download throughput in MB/s and Mbps (similar to task/download.go)."""
        try:
            url = f"https://{ip}:{port}/__down?bytes={size_bytes}"
            req = urllib.request.Request(
                url,
                headers={"Host": host, "User-Agent": "Cloudflare-Clean-IP-Scanner/5.0"}
            )
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            t0 = time.perf_counter()
            with urllib.request.urlopen(req, timeout=self.download_timeout, context=ctx) as resp:
                chunk = resp.read()
                dur = time.perf_counter() - t0
                bytes_received = len(chunk)
                if dur > 0 and bytes_received > 0:
                    mbps = round((bytes_received * 8) / (dur * 1_000_000), 2)
                    mb_per_sec = round(bytes_received / (dur * 1_000_000), 2)
                    return {"mbps": mbps, "mb_per_sec": mb_per_sec}
        except Exception:
            pass
        return {"mbps": 0.0, "mb_per_sec": 0.0}

    def scan_single_ip(self, ip):
        """Phase 1 (TCPing) + Phase 2 (HTTPing) for a single IP."""
        if not self.is_running:
            return None

        with self._lock:
            self.current_ip = ip

        tcp_res = self.tcping(ip, self.port, count=self.ping_trials)
        if not tcp_res["ok"]:
            with self._lock:
                self.tested_count += 1
                if self.total_ips > 0:
                    self.progress = round((self.tested_count / self.total_ips) * 100, 1)
            return None

        http_res = self.httping(ip, self.port)

        # Operator labeling
        op = "global"
        if ip.startswith("104.16") or ip.startswith("104.19") or ip.startswith("104.26"):
            op = "mci"
        elif ip.startswith("104.17") or ip.startswith("172.67") or ip.startswith("104.21"):
            op = "mtn"
        elif ip.startswith("162.159") or ip.startswith("104.22") or ip.startswith("104.18"):
            op = "rtl"
        elif ip.startswith("172.64") or ip.startswith("198.41"):
            op = "shatel"

        item = {
            "ip": ip,
            "port": self.port,
            "operator": op,
            "label": f"⚡ [{op.upper()}] {ip} ({http_res.get('colo', 'Edge')})",
            "latency": tcp_res["latency"],
            "ttfb": http_res["ttfb"] or tcp_res["latency"],
            "jitter": tcp_res["jitter"],
            "lossRate": tcp_res["lossRate"],
            "colo": http_res.get("colo", "Edge"),
            "speedMbps": 0.0,
            "speedMBs": 0.0,
            "status": "success"
        }

        with self._lock:
            self.results.append(item)
            self.tested_count += 1
            if self.total_ips > 0:
                self.progress = round((self.tested_count / self.total_ips) * 100, 1)

        return item

    def start_full_scan(self, cidrs=None, count_per_cidr=25, custom_ips=None, run_speed_test=True):
        """Starts full multi-threaded 3-phase scan with unlimited IP scale."""
        self.is_running = True
        self.results = []
        self.tested_count = 0
        self.progress = 0.0

        candidate_ips = []

        # If user passed custom IPs list
        if custom_ips and len(custom_ips) > 0:
            candidate_ips.extend(custom_ips)
        else:
            if not cidrs:
                ip_file = os.path.join(os.path.dirname(__file__), "ip.txt")
                if os.path.exists(ip_file):
                    with open(ip_file, "r") as f:
                        cidrs = [line.strip() for line in f if line.strip() and not line.startswith("#")]
                else:
                    cidrs = [
                        "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
                        "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
                        "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
                        "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22"
                    ]

            candidate_ips = self.generate_ips_from_cidrs(cidrs, count_per_cidr=count_per_cidr)

        # Deduplicate
        candidate_ips = list(set(candidate_ips))
        random.shuffle(candidate_ips)
        self.total_ips = len(candidate_ips)

        # Phase 1 & 2: Concurrently scan all candidate IPs
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_threads) as executor:
            list(executor.map(self.scan_single_ip, candidate_ips))

        # Sort valid results by latency
        self.results.sort(key=lambda x: (x["latency"] if x["latency"] is not None else 9999))

        # Phase 3: Speed test on top 20 lowest-latency IPs
        if run_speed_test and self.results:
            top_to_speedtest = self.results[:20]
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as speed_exec:
                def speed_job(it):
                    spd = self.measure_download_speed(it["ip"], it["port"])
                    it["speedMbps"] = spd["mbps"]
                    it["speedMBs"] = spd["mb_per_sec"]
                list(speed_exec.map(speed_job, top_to_speedtest))

            # Re-sort by speed then latency
            self.results.sort(key=lambda x: (-x.get("speedMbps", 0), x.get("latency", 9999)))

        self.is_running = False
        self.progress = 100.0
        return self.results

    def generate_csv(self):
        """Generates CSV format string matching Cloudflare-Clean-IP-Scanner output."""
        lines = ["IP Address,Port,Loss Rate,Latency (ms),Jitter (ms),Speed (MB/s),Speed (Mbps),Colo,Operator"]
        for r in self.results:
            lines.append(
                f"{r['ip']},{r['port']},{r.get('lossRate', 0)}%,{r.get('latency', '')}ms,{r.get('jitter', '')}ms,{r.get('speedMBs', 0)} MB/s,{r.get('speedMbps', 0)} Mbps,{r.get('colo', 'Edge')},{r.get('operator', 'global')}"
            )
        return "\n".join(lines)

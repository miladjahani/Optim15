#!/usr/bin/env python3
"""
CF-Optimizor Pro — Enterprise Full-Stack Python Backend
Integrates Full-Scale Cloudflare-Clean-IP-Scanner (Hundreds/Thousands of IPs across all official CIDRs),
Multi-Repo GitHub Aggregators, TCP/TLS Benchmarkers, DoH In-Memory Cache, and Database Persistence.
"""

import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import socket
import ssl
import time
import concurrent.futures
import re
import os
import sys
import threading

from scanner import CloudflareScanner
import database

PORT = int(os.environ.get("PORT", 8080))
GLOBAL_SCANNER = CloudflareScanner(port=443, max_threads=50, ping_trials=3, download_timeout=3.0)

# Multi-Repo GitHub Sources
GITHUB_SOURCES = [
    {"name": "vfarid/v2ray-share", "url": "https://raw.githubusercontent.com/vfarid/v2ray-share/master/ip/clean.txt"},
    {"name": "bih-cf-ip/clean-ips", "url": "https://raw.githubusercontent.com/bih-cf-ip/clean-ips/master/clean-ips.txt"},
    {"name": "MortezaBashsiz/CFScanner", "url": "https://raw.githubusercontent.com/MortezaBashsiz/CFScanner/main/config/cf.local.iplist"},
    {"name": "ircfspace/cf-clean-ips", "url": "https://raw.githubusercontent.com/ircfspace/cf-clean-ips/main/list.json"},
    {"name": "Cloudflare Official Range", "url": "https://www.cloudflare.com/ips-v4"}
]

def fetch_github_source(src):
    url = src["url"]
    name = src["name"]
    res_ips = []
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CF-Optimizor/6.0"})
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, timeout=3.5, context=ctx) as r:
            text = r.read().decode("utf-8", errors="ignore")
            for line in text.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                match = re.search(r"(\d+\.\d+\.\d+\.\d+)", line)
                if match:
                    ip_str = match.group(1)
                    res_ips.append({
                        "ip": ip_str,
                        "port": 443,
                        "operator": "global",
                        "label": f"⚡ [{name.split('/')[0]}] {ip_str}"
                    })
    except Exception:
        pass
    return res_ips

class CFEnterpriseRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, User-Agent")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        # 1. API Status
        if parsed.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "online",
                "engine": "Cloudflare-Clean-IP-Scanner Python Full Engine",
                "version": "6.5.0",
                "scannerRunning": GLOBAL_SCANNER.is_running
            }).encode("utf-8"))
            return

        # 2. Run Full 3-Phase Scanner (Ported from Cloudflare-Clean-IP-Scanner)
        if parsed.path == "/api/scanner/run":
            port = int(params.get("port", [443])[0])
            threads = int(params.get("threads", [50])[0])
            count_per_cidr = int(params.get("count", [20])[0])  # 20 IPs per CIDR * 15 CIDRs = 300+ IPs
            with_speed = params.get("speed", ["1"])[0] == "1"

            GLOBAL_SCANNER.port = port
            GLOBAL_SCANNER.max_threads = threads
            results = GLOBAL_SCANNER.start_full_scan(count_per_cidr=count_per_cidr, run_speed_test=with_speed)

            # Auto-save top clean IPs to database
            if results:
                db = database.load_db()
                db["clean_ips"] = results[:50]
                database.save_db(db)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "results": results,
                "count": len(results),
                "totalTested": GLOBAL_SCANNER.total_ips,
                "source": "Cloudflare-Clean-IP-Scanner ip.txt (All Official CIDRs)"
            }).encode("utf-8"))
            return

        # 3. Scanner Status & Real-time Progress
        if parsed.path == "/api/scanner/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "isRunning": GLOBAL_SCANNER.is_running,
                "progress": GLOBAL_SCANNER.progress,
                "tested": GLOBAL_SCANNER.tested_count,
                "total": GLOBAL_SCANNER.total_ips,
                "foundCount": len(GLOBAL_SCANNER.results),
                "currentIp": GLOBAL_SCANNER.current_ip,
                "topResults": GLOBAL_SCANNER.results[:10]
            }).encode("utf-8"))
            return

        # 4. Stop Scanner
        if parsed.path == "/api/scanner/stop":
            GLOBAL_SCANNER.stop_scan()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"stopped": True}).encode("utf-8"))
            return

        # 5. Export CSV matching Cloudflare-Clean-IP-Scanner
        if parsed.path == "/api/scanner/export-csv":
            csv_data = GLOBAL_SCANNER.generate_csv()
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="result.csv"')
            self.end_headers()
            self.wfile.write(csv_data.encode("utf-8"))
            return

        # 6. Multi-Repo GitHub Live Aggregator
        if parsed.path == "/api/fetch-github-clean-ips":
            all_ips = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
                res_lists = list(ex.map(fetch_github_source, GITHUB_SOURCES))
                for l in res_lists:
                    all_ips.extend(l)

            seen = set()
            unique_ips = [it for it in all_ips if not (it["ip"] in seen or seen.add(it["ip"]))]

            def quick_test(it):
                tcp_res = GLOBAL_SCANNER.tcping(it["ip"], it["port"], count=2, timeout=1.2)
                if tcp_res["ok"]:
                    it["latency"] = tcp_res["latency"]
                    it["ttfb"] = round(tcp_res["latency"] * 0.8, 1)
                    it["jitter"] = tcp_res["jitter"]
                    it["status"] = "success"
                    return it
                it["status"] = "timeout"
                return it

            with concurrent.futures.ThreadPoolExecutor(max_workers=30) as ex:
                tested = list(ex.map(quick_test, unique_ips[:60]))

            valid_results = [t for t in tested if t.get("status") == "success"]
            valid_results.sort(key=lambda x: x.get("latency", 9999))

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"results": valid_results or tested, "totalFound": len(unique_ips)}).encode("utf-8"))
            return

        # 7. DoH Multi-Resolver
        if parsed.path == "/api/doh":
            domain = params.get("domain", ["speed.cloudflare.com"])[0]
            provider = params.get("provider", ["https://1.1.1.1/dns-query"])[0]
            t0 = time.perf_counter()
            try:
                q_url = f"{provider}?name={urllib.parse.quote(domain)}&type=A"
                req = urllib.request.Request(q_url, headers={"Accept": "application/dns-json", "User-Agent": "CF-DoH/6.0"})
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                with urllib.request.urlopen(req, timeout=3.0, context=ctx) as r:
                    d = json.loads(r.read().decode("utf-8"))
                    ips = [ans["data"] for ans in d.get("Answer", []) if ans.get("type") == 1]
                    dur = round((time.perf_counter() - t0) * 1000, 1)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"domain": domain, "provider": provider, "ips": ips or ["No A record"], "durationMs": dur, "ttl": 300}).encode("utf-8"))
                    return
            except Exception as e:
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"domain": domain, "provider": provider, "ips": [f"Error: {str(e)}"], "durationMs": round((time.perf_counter() - t0) * 1000, 1), "ttl": 0}).encode("utf-8"))
                return

        # 8. Database Endpoints
        if parsed.path == "/api/db/configs":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(database.get_configs()).encode("utf-8"))
            return

        if parsed.path == "/api/db/subscriptions":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(database.get_subscriptions()).encode("utf-8"))
            return

        if parsed.path == "/api/db/export":
            db_data = database.load_db()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="cf-optimizor-backup.json"')
            self.end_headers()
            self.wfile.write(json.dumps(db_data, indent=2).encode("utf-8"))
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        # 1. API: Scan Custom IP List / CIDRs
        if parsed.path == "/api/scanner/run-custom":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                data = json.loads(body)
                custom_ips = data.get("ips", [])
                cidrs = data.get("cidrs", None)
                threads = int(data.get("threads", 50))
                port = int(data.get("port", 443))
                with_speed = bool(data.get("speed", True))

                GLOBAL_SCANNER.port = port
                GLOBAL_SCANNER.max_threads = threads
                results = GLOBAL_SCANNER.start_full_scan(cidrs=cidrs, custom_ips=custom_ips, run_speed_test=with_speed)

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"results": results, "count": len(results)}).encode("utf-8"))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                return

        # 2. API: Test Active Configs Batch
        if parsed.path == "/api/test-configs":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                req_data = json.loads(body)
                configs = req_data.get("configs", [])

                def test_cfg(c):
                    srv = c.get("server", "")
                    prt = int(c.get("port", 443))
                    tcp_res = GLOBAL_SCANNER.tcping(srv, prt, count=3, timeout=1.8)
                    if tcp_res["ok"]:
                        spd = GLOBAL_SCANNER.measure_download_speed(srv, prt, host=c.get("sni", srv), size_bytes=500000)
                        return {
                            "id": c.get("id"),
                            "name": c.get("name"),
                            "server": srv,
                            "port": prt,
                            "protocol": c.get("protocol"),
                            "latency": tcp_res["latency"],
                            "jitter": tcp_res["jitter"],
                            "lossRate": tcp_res["lossRate"],
                            "speedMbps": spd["mbps"],
                            "speedMBs": spd["mb_per_sec"],
                            "status": "success"
                        }
                    return {"id": c.get("id"), "name": c.get("name"), "server": srv, "port": prt, "protocol": c.get("protocol"), "latency": None, "status": "timeout"}

                with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
                    results = list(executor.map(test_cfg, configs))

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"results": results, "tested": len(results)}).encode("utf-8"))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                return

        # 3. Database Save Endpoints
        if parsed.path == "/api/db/configs":
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            saved = database.save_config_item(data)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(saved).encode("utf-8"))
            return

        if parsed.path == "/api/db/subscriptions":
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            saved = database.save_subscription_item(data)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(saved).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

def run_server(port=PORT):
    os.chdir(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist" if os.path.exists(os.path.join(os.path.dirname(__file__), "..", "dist")) else "..", "public")))
    with socketserver.TCPServer(("", port), CFEnterpriseRequestHandler) as httpd:
        print(f"\033[92m[CF-Optimizor Full-Scale Python Backend]\033[0m Running on http://localhost:{port}")
        print(f"\033[94m-> Cloudflare-Clean-IP-Scanner Engine (15 Official CIDRs / Multi-Threaded) Active\033[0m")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")

if __name__ == "__main__":
    run_server()

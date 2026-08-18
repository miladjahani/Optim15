#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# CF-Optimizor Pro — Termux Setup & Local Development Script
# ==============================================================================
set -e

echo -e "\e[1;32m=====================================================\e[0m"
echo -e "\e[1;32m    CF-OPTIMIZOR PRO — TERMUX AUTOMATION ENGINE       \e[0m"
echo -e "\e[1;32m=====================================================\e[0m"

pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git openssl curl

echo -e "\e[1;36m[+] Installing project dependencies...\e[0m"
npm install

echo -e "\e[1;32m[+] Ready! To start local server, run: npm run dev\e[0m"
echo -e "\e[1;32m[+] To build for production / GitHub Pages, run: npm run build\e[0m"

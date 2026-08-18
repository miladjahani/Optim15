#!/usr/bin/env python3
import json
import os
import time

DB_FILE = os.path.join(os.path.dirname(__file__), "database.json")

def load_db():
    if not os.path.exists(DB_FILE):
        default_data = {
            "configs": [],
            "subscriptions": [],
            "clean_ips": [],
            "ping_logs": [],
            "settings": {}
        }
        save_db(default_data)
        return default_data
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"configs": [], "subscriptions": [], "clean_ips": [], "ping_logs": [], "settings": {}}

def save_db(data):
    temp_file = DB_FILE + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(temp_file, DB_FILE)

# Configs CRUD
def get_configs():
    db = load_db()
    return db.get("configs", [])

def save_config_item(config):
    db = load_db()
    configs = db.get("configs", [])
    cid = config.get("id") or str(int(time.time() * 1000))
    config["id"] = cid
    config["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")

    idx = next((i for i, c in enumerate(configs) if c.get("id") == cid), -1)
    if idx >= 0:
        configs[idx] = config
    else:
        config["createdAt"] = config.get("createdAt") or config["updatedAt"]
        configs.insert(0, config)

    db["configs"] = configs
    save_db(db)
    return config

def delete_config_item(cid):
    db = load_db()
    db["configs"] = [c for c in db.get("configs", []) if c.get("id") != cid]
    save_db(db)
    return True

# Subscriptions CRUD
def get_subscriptions():
    db = load_db()
    return db.get("subscriptions", [])

def save_subscription_item(sub):
    db = load_db()
    subs = db.get("subscriptions", [])
    sid = sub.get("id") or str(int(time.time() * 1000))
    sub["id"] = sid
    sub["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")

    idx = next((i for i, s in enumerate(subs) if s.get("id") == sid or s.get("url") == sub.get("url")), -1)
    if idx >= 0:
        subs[idx] = sub
    else:
        sub["createdAt"] = sub.get("createdAt") or sub["updatedAt"]
        subs.insert(0, sub)

    db["subscriptions"] = subs
    save_db(db)
    return sub

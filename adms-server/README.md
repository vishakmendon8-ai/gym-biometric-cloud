# GymPro Secureye / ZKTeco ADMS (iClock) HTTP Push Server

Production-ready Node.js backend service that receives real-time attendance punches directly from Secureye / ZKTeco ADMS biometric terminals over plain HTTP — **zero local PC or Raspberry Pi required**.

## Endpoints

### ADMS / iClock Hardware Push Protocol (Plain HTTP `text/plain`)
- `GET /iclock/cdata` — Device handshake & configuration (`GET OPTION FROM: <SN>\nStamp=9999...` or `OK`)
- `POST /iclock/cdata` — Real-time `table=ATTLOG` punch ingestion (tab-delimited raw `text/plain`) & `table=OPERLOG` handling; responds strictly with `OK` (HTTP 200)
- `GET /iclock/getrequest` — Heartbeat & command polling (`SN`); updates `devices.last_seen_at` and responds with `OK`
- `POST /iclock/devicecmd` — Command acknowledgment; responds with `OK`

### REST API & Live Monitor
- `GET /` — Live monitoring dashboard (Devices Online/Offline, Attendance Logs + Filters, Raw ADMS Request Debugger)
- `GET /api/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD&employee_code=101&device_sn=XXX` — Filtered attendance logs
- `GET /api/devices` — Registered devices with real-time `is_online` status
- `PATCH /api/devices/:sn` — Update device friendly `name` and `location`
- `GET /api/debug/raw` — Latest raw `/iclock/*` requests for pairing/debugging
- `GET /health` — Health & database status

## Quick Start

### Option 1: Docker Compose (PostgreSQL + ADMS Server)
```bash
cp .env.example .env
docker compose up -d --build
```
The server exposes plain HTTP on port **8080** (or place `nginx.conf` in front for plain HTTP port **80**).

### Option 2: Direct Node.js (PostgreSQL or Built-in SQLite)
```bash
cp .env.example .env
npm install
npm start
```

### Optional: Live Mirror into GymPro Firebase Firestore (`gym001-50a97`)
Set `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json` (or `FIREBASE_SERVICE_ACCOUNT_JSON`) in `.env` so every verified ADMS punch automatically validates member expiry and updates your Firebase-hosted GymPro dashboard in real time.

## Secureye Device Configuration (Cloud Server / ADMS Menu)
1. Confirm the device is connected to Wi-Fi / LAN with internet access (`TCP/IPv4` → DHCP ON, Gateway & DNS set).
2. Open **Menu → Comm. (Communication) → Cloud Server Setting** (or **ADMS / Web Server**).
3. Configure:
   - **Server Mode:** `ADMS` (if selectable)
   - **Enable Domain Name:** `ON` if entering a domain (e.g. `adms.yourdomain.com`), or `OFF` if entering a raw public IPv4 (e.g. `203.0.113.25`)
   - **Server Address:** Your server's public IPv4 or domain (do **not** include `http://` or `/iclock/cdata` — the device appends `/iclock/cdata` automatically)
   - **Server Port:** `80` (with Nginx) or `8080` (direct)
   - **Enable Proxy Server:** `OFF`
   - **HTTPS:** `OFF` (plain HTTP unless your firmware explicitly supports TLS/SNI)
4. Save and reboot the machine. Watch `GET /` → **Raw ADMS / iClock Debug Log** for the first `GET /iclock/cdata?SN=...` handshake.

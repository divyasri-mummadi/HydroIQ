import os
from pathlib import Path

from dotenv import load_dotenv
from influxdb_client import InfluxDBClient


# ============================================================
# LOAD .ENV FROM HYDROIQ ROOT
# ============================================================

# Current file:
# HydroIQ/backend/database/influxdb.py
#
# Project root:
# HydroIQ/
#
# .env:
# HydroIQ/.env

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


# ============================================================
# READ INFLUXDB SETTINGS
# ============================================================

INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")


# ============================================================
# VALIDATE SETTINGS
# ============================================================

missing = []

if not INFLUX_URL:
    missing.append("INFLUX_URL")

if not INFLUX_TOKEN:
    missing.append("INFLUX_TOKEN")

if not INFLUX_ORG:
    missing.append("INFLUX_ORG")

if not INFLUX_BUCKET:
    missing.append("INFLUX_BUCKET")


if missing:
    raise RuntimeError(
        "Missing InfluxDB environment variables: "
        + ", ".join(missing)
        + f"\nExpected .env file at: {ENV_PATH}"
    )


# ============================================================
# CREATE INFLUXDB CLIENT
# ============================================================

client = InfluxDBClient(
    url=str(INFLUX_URL),
    token=str(INFLUX_TOKEN),
    org=str(INFLUX_ORG),
)


# ============================================================
# API OBJECTS
# ============================================================

write_api = client.write_api()
query_api = client.query_api()
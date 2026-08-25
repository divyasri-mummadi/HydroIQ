import os

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS


# Load values from .env
load_dotenv()

INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")


app = FastAPI()


# Connect to InfluxDB
client = InfluxDBClient(
    url=INFLUX_URL,
    token=INFLUX_TOKEN,
    org=INFLUX_ORG
)

write_api = client.write_api(write_options=SYNCHRONOUS)


class SensorData(BaseModel):
    device_id: str
    zone: str
    pressure: float
    flow: float
    acoustic: float
    ph: float
    tds: float
    turbidity: float


@app.get("/")
def home():
    return {"message": "HydroIQ Backend Running"}


@app.get("/sensors/latest")
def latest_sensors():

    query_api = client.query_api()

    query = f'''
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "water_sensors")
      |> pivot(
          rowKey: ["_time"],
          columnKey: ["_field"],
          valueColumn: "_value"
      )
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)
    '''

    tables = query_api.query(query, org=INFLUX_ORG)

    for table in tables:
        for record in table.records:
            values = record.values

            return {
                "device_id": values.get("device_id"),
                "zone": values.get("zone"),
                "pressure": values.get("pressure"),
                "flow": values.get("flow"),
                "acoustic": values.get("acoustic"),
                "ph": values.get("ph"),
                "tds": values.get("tds"),
                "turbidity": values.get("turbidity")
            }

    return {"message": "No sensor data found"}
@app.get("/sensors/history")
def sensor_history():

    query_api = client.query_api()

    query = f'''
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -7d)
      |> filter(fn: (r) => r["_measurement"] == "water_sensors")
      |> pivot(
          rowKey: ["_time"],
          columnKey: ["_field"],
          valueColumn: "_value"
      )
      |> sort(columns: ["_time"])
    '''

    tables = query_api.query(query, org=INFLUX_ORG)

    history = []

    for table in tables:
        for record in table.records:
            values = record.values

            history.append({
                "time": str(values.get("_time")),
                "device_id": values.get("device_id"),
                "zone": values.get("zone"),
                "pressure": values.get("pressure"),
                "flow": values.get("flow"),
                "acoustic": values.get("acoustic"),
                "ph": values.get("ph"),
                "tds": values.get("tds"),
                "turbidity": values.get("turbidity")
            })

    return {"data": history}
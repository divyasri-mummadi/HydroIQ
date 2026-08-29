from filters import filter_sensor_data

sensor_data = {
    "pressure": 2.6,
    "flow": 118,
    "acoustic": 0.82,
    "ph": 7.2,
    "tds": 312,
    "turbidity": 4.8
}

clean_data = filter_sensor_data(sensor_data)

print(clean_data)

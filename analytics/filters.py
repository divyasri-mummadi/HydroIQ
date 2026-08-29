def filter_sensor_data(data):
    filtered_data = {}

    for key, value in data.items():
        if value is not None:
            filtered_data[key] = value

    return filtered_data

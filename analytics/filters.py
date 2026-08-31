class KalmanFilter:
    """
    Simple 1D Kalman filter for smoothing noisy sensor readings.
    """

    def __init__(self, process_variance=0.01, measurement_variance=0.5):
        self.process_variance = process_variance
        self.measurement_variance = measurement_variance

        self.estimate = None
        self.error = 1.0

    def update(self, measurement):
        # First measurement initializes the filter
        if self.estimate is None:
            self.estimate = measurement
            return measurement

        # Prediction step
        predicted_estimate = self.estimate
        predicted_error = self.error + self.process_variance

        # Kalman gain
        kalman_gain = (
            predicted_error
            / (predicted_error + self.measurement_variance)
        )

        # Update step
        self.estimate = predicted_estimate + (
            kalman_gain * (measurement - predicted_estimate)
        )

        self.error = (1 - kalman_gain) * predicted_error

        return self.estimate


# Separate Kalman filter for each sensor
kalman_filters = {
    "pressure": KalmanFilter(
        process_variance=0.01,
        measurement_variance=0.2
    ),
    "flow": KalmanFilter(
        process_variance=1.0,
        measurement_variance=20.0
    ),
    "acoustic": KalmanFilter(
        process_variance=0.005,
        measurement_variance=0.05
    ),
    "ph": KalmanFilter(
        process_variance=0.01,
        measurement_variance=0.1
    ),
    "tds": KalmanFilter(
        process_variance=1.0,
        measurement_variance=25.0
    ),
    "turbidity": KalmanFilter(
        process_variance=0.5,
        measurement_variance=5.0
    ),
}


def filter_sensor_data(data):
    """
    Remove invalid values and apply Kalman filtering
    to numeric sensor readings.
    """

    filtered_data = {}

    for key, value in data.items():

        # Ignore missing sensor readings
        if value is None:
            continue

        # Apply Kalman filtering to known sensors
        if key in kalman_filters and isinstance(value, (int, float)):
            filtered_data[key] = kalman_filters[key].update(value)

        else:
            # Keep other data unchanged
            filtered_data[key] = value

    return filtered_data


if __name__ == "__main__":
    # Simulated noisy pressure readings
    noisy_pressure = [
        2.6,
        3.4,
        2.1,
        3.0,
        2.4,
        3.2,
        2.7
    ]

    print("Kalman Filter Test")
    print("------------------")

    for reading in noisy_pressure:
        result = filter_sensor_data({
            "pressure": reading
        })

        print(
            f"Raw: {reading:.2f}  "
            f"Filtered: {result['pressure']:.2f}"
        )

class KalmanFilter:
    """
    Simple 1D Kalman filter for smoothing noisy sensor readings.
    """

    def __init__(
        self,
        process_variance=0.01,
        measurement_variance=0.5
    ):
        self.process_variance = process_variance
        self.measurement_variance = measurement_variance
        self.estimate = None
        self.error = 1.0

    def update(self, measurement):

        if self.estimate is None:
            self.estimate = measurement
            return measurement

        predicted_estimate = self.estimate
        predicted_error = (
            self.error +
            self.process_variance
        )

        kalman_gain = (
            predicted_error /
            (
                predicted_error +
                self.measurement_variance
            )
        )

        self.estimate = (
            predicted_estimate +
            kalman_gain *
            (
                measurement -
                predicted_estimate
            )
        )

        self.error = (
            (1 - kalman_gain) *
            predicted_error
        )

        return self.estimate


def create_kalman_filters():

    return {
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
        )
    }


kalman_filters = create_kalman_filters()


def is_critical_reading(key, value):
    """
    Critical incident readings should never be
    smoothed away by the Kalman filter.
    """

    if key == "pressure" and value < 2.0:
        return True

    if key == "flow" and value > 150:
        return True

    if key == "acoustic" and value > 0.85:
        return True

    if key == "ph" and (
        value < 6.0 or
        value > 9.0
    ):
        return True

    if key == "tds" and value > 500:
        return True

    if key == "turbidity" and value > 5.0:
        return True

    return False


def filter_sensor_data(data):
    """
    Remove invalid values and apply Kalman filtering
    to normal/noisy readings.

    Critical abnormal readings are preserved exactly
    so that leak and water-quality incidents are not
    hidden by smoothing.
    """

    filtered_data = {}

    for key, value in data.items():

        if value is None:
            continue

        if not isinstance(
            value,
            (int, float)
        ):
            filtered_data[key] = value
            continue

        if is_critical_reading(
            key,
            value
        ):
            filtered_data[key] = value
            continue

        if key in kalman_filters:

            filtered_data[key] = (
                kalman_filters[key].update(
                    value
                )
            )

        else:

            filtered_data[key] = value

    return filtered_data


if __name__ == "__main__":

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
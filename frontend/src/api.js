import axios from 'axios';

// Update this port to match your backend (e.g., FastAPI default is 8000)
const BASE_URL = 'http://localhost:8000';

export const fetchLatestSensorData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/sensors/latest`);
    return response.data;
  } catch (error) {
    console.error("Error fetching latest telemetry:", error);
    return null;
  }
};

export const fetchSensorHistory = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/sensors/history`);
    return response.data;
  } catch (error) {
    console.error("Error fetching history telemetry:", error);
    return [];
  }
};
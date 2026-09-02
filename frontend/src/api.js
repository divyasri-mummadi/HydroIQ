import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8001';

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


export const fetchLatestAnalytics = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/analytics/latest`);
    return response.data;
  } catch (error) {
    console.error("Error fetching latest analytics:", error);
    return null;
  }
};
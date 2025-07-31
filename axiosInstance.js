// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://blockchef.store", // 여기에 실제 API 서버 URL 입력
  headers: {
    "Content-Type": "application/json",
    Accept: "*/*",
  },
});

// axiosInstance.js 내에 추가
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export default axiosInstance;
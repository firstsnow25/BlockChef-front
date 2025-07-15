// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://blockchef.store/", // 여기에 실제 API 서버 URL 입력
  headers: {
    "Content-Type": "application/json",
    Accept: "*/*",
  },
});

export default axiosInstance;
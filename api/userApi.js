// src/api/userApi.js
import axiosInstance from "./axiosInstance";

// 1. 내 정보 조회
export const fetchMyInfo = async () => {
  const response = await axiosInstance.get("/users/me");
  return response.data;
};

// 2. 내 정보 수정
export const updateMyInfo = async ({ name, password, passwordCheck }) => {
  const response = await axiosInstance.put("/users/me", {
    name,
    password,
    passwordCheck,
  });
  return response.data;
};

// 3. 회원 탈퇴
export const deleteMyAccount = async ({ name, password, passwordCheck }) => {
  const response = await axiosInstance.delete("/users/me", {
    data: { name, password, passwordCheck },
  });
  return response.data;
};

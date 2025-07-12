// src/api/auth.js
import axiosInstance from "./axiosInstance";

// 1. 회원가입
export const signup = async ({ name, email, password, passwordCheck }) => {
  const response = await axiosInstance.post("/auth/signup", {
    name,
    email,
    password,
    passwordCheck,
  });
  return response.data;
};

// 2. 비밀번호 재설정
export const resetPassword = async ({ email, password, passwordCheck }) => {
  const response = await axiosInstance.post("/auth/reset-password", {
    email,
    password,
    passwordCheck,
  });
  return response.data;
};

// 3. 로그인
export const login = async ({ email, password }) => {
  const response = await axiosInstance.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};

// 4. 이메일 인증 (코드 확인)
export const verifyEmailCode = async ({ email, code }) => {
  const response = await axiosInstance.post("/auth/email/verify-code", {
    email,
    code,
  });
  return response.data;
};

// 5. 이메일 인증 코드 보내기
export const sendEmailCode = async ({ email }) => {
  const response = await axiosInstance.post("/auth/email/send-code", {
    email,
  });
  return response.data;
};

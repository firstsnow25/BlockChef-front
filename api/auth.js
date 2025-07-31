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

// ✅ 3. 로그인 - 토큰을 저장까지 하도록 수정
export const login = async ({ email, password }) => {
  const response = await axiosInstance.post("/auth/login", {
    email,
    password,
  });

  const token = response.data.token;
  if (token) {
    console.log("✅ 저장된 토큰:", token);
    localStorage.setItem("token", token); // 이 줄이 없으면 반드시 추가!
  } else {
    console.error("❌ 응답에 토큰이 없습니다.");
  }
  
};

// 4. 이메일 인증 (코드 확인)
export const verifyEmailCode = async ({ email, code }) => {
  const response = await axiosInstance.post("/auth/email/verify-code", {
    email,
    code,
  });
  return response.data;
};

// 5. 회원가입 인증코드 보내기
export const sendSignUpEmailCode = async ({ email }) => {
  const response = await axiosInstance.post("/auth/email/signup/send-code", {
    email,
  });
  return response.data;
};

// 6. 비밀번호 재설정 인증코드 보내기
export const sendResetPasswordEmailCode = async ({ email }) => {
  const response = await axiosInstance.post("/auth/email/reset-password/send-code", {
    email,
  });
  return response.data;
};


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

// ✅ 3. 로그인 - 토큰 저장 및 콘솔 디버깅 추가
export const login = async ({ email, password }) => {
  const response = await axiosInstance.post("/auth/login", {
    email,
    password,
  });

  // ✅ 응답 구조를 확인하기 위한 콘솔 로그
  console.log("🔥 전체 응답:", response);
  console.log("🔥 response.data:", response.data);
  console.log("🔥 response.data.token:", response.data.token); // 이게 undefined면 구조 확인 필요
  console.log("🔥 response.data.data:", response.data.data);   // 여기에 token 있을 가능성

  // ✅ 실제 토큰 저장 로직
  const token =
    response.data.token ||         // 일반 구조: { token: "..." }
    response.data.data?.token ||   // 혹시 nested 구조인 경우: { data: { token: "..." } }
    null;

  if (token) {
    localStorage.setItem("token", token);
    console.log("✅ 저장된 토큰:", token);
  } else {
    console.error("❌ JWT 토큰이 응답에 없습니다.");
  }

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


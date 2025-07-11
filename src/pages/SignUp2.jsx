// src/pages/SignUp2.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";

export default function SignUp2() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    alert("회원가입이 완료되었습니다.");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md border border-gray-200 shadow-lg rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center">회원가입 - 정보 입력</h2>

        <div className="space-y-4">
          <InputField
            type="email"
            value={email}
            disabled
          />

          <InputField
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <InputField
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <InputField
            type="password"
            placeholder="비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <LoginButton
            text="회원가입"
            onClick={handleSignUp}
            className="w-full mt-2"
          />
        </div>
      </div>
    </div>
  );
}
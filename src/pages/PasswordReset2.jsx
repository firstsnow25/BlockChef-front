// src/pages/PasswordReset2.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";

export default function PasswordReset2() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleReset = () => {
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    alert("비밀번호 재설정에 성공하였습니다.");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md border border-gray-200 shadow-lg rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center">비밀번호 재설정</h2>

        <div className="space-y-4">
          <InputField
            type="email"
            value={email}
            disabled
          />

          <InputField
            type="password"
            placeholder="새 비밀번호"
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
            text="재설정"
            onClick={handleReset}
            className="w-full mt-2"
          />
        </div>
      </div>
    </div>
  );
}
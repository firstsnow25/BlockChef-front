import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";
import ShadowBox from "../components/ShadowBox";
import { resetPassword } from "../api/auth";

export default function PasswordReset2() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const isTestMode = false;

  const handleReset = async () => {
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      if (isTestMode) {
        alert("비밀번호 재설정 완료 (테스트용)");
        navigate("/signin");
        return;
      }

      await resetPassword({
        email,
        password,
        passwordCheck: confirmPassword,
      });

      alert("비밀번호가 성공적으로 재설정되었습니다.");
      navigate("/signin");
    } catch {
      setError("비밀번호 재설정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white py-12">
      <ShadowBox>
        <h2 className="text-2xl font-semibold text-center mt-20 mb-20">비밀번호 재설정</h2>

        <div className="space-y-5">
          <InputField type="email" value={email} disabled />
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
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="flex justify-center">
                <LoginButton text="재설정" onClick={handleReset} className="w-[30%] mx-auto mt-4" />
            </div>
        </div>
      </ShadowBox>
    </div>
  );
}


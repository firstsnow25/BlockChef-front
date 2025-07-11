// src/pages/PasswordReset1.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";

export default function PasswordReset1() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer;
    if (sent && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sent, secondsLeft]);

  const handleSendCode = () => {
    if (!email) return;
    setSent(true);
    setSecondsLeft(180); // 3 minutes
    alert("인증번호가 이메일로 전송되었습니다.");
  };

  const handleVerify = () => {
    if (!code) {
      setError("인증번호를 입력해주세요.");
      return;
    }
    alert("인증이 완료되었습니다.");
    navigate("/password-reset2", { state: { email } });
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md border border-gray-200 shadow-lg rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center">비밀번호 재설정</h2>

        <div className="space-y-4">
          <InputField
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex justify-end">
            <LoginButton
              text="인증번호 보내기"
              onClick={handleSendCode}
              className={`text-sm px-3 py-1 ${sent && secondsLeft > 0 ? "bg-gray-300 cursor-not-allowed" : "bg-black text-white"}`}
              disabled={sent && secondsLeft > 0}
            />
          </div>

          <InputField
            type="text"
            placeholder="인증번호 입력"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          {sent && secondsLeft > 0 && (
            <p className="text-sm text-red-500 text-right">
              남은 시간: {formatTime(secondsLeft)}
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <LoginButton
            text="인증하기"
            onClick={handleVerify}
            className={`w-full ${!sent ? "bg-gray-300 cursor-not-allowed" : "bg-black text-white"}`}
            disabled={!sent}
          />
        </div>
      </div>
    </div>
  );
}

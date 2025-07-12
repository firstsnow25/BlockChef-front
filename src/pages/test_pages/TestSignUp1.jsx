// src/pages/SignUp1.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";

export default function SignUp1() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [timer, setTimer] = useState(180); // 3분
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(false);

  const correctCode = "123456"; // 테스트용 코드

  const handleSendCode = () => {
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setDisabled(true);
    setSent(true);
    setError("");
    setTimer(180);

    alert("인증번호가 이메일로 발송되었습니다.");

    setTimeout(() => {
      setDisabled(false);
    }, 3000);

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (code === correctCode) {
      alert("인증이 완료되었습니다.");
      navigate("/signup2", { state: { email } });
    } else {
      setError("인증번호가 일치하지 않습니다.");
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md border border-gray-200 shadow-lg rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center">회원가입 - 이메일 인증</h2>

        <div className="space-y-4">
          <InputField
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              disabled={disabled}
              onClick={handleSendCode}
              className={`text-sm px-4 py-2 rounded-md border ${
                disabled
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              인증번호 보내기
            </button>
          </div>

          <InputField
            type="text"
            placeholder="인증번호 입력"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          {sent && (
            <p className="text-xs text-red-500">남은 시간: {formatTime(timer)}</p>
          )}

          <LoginButton
            text="인증하기"
            onClick={handleVerify}
            className={`w-full ${!sent ? "bg-gray-300 cursor-not-allowed" : ""}`}
            disabled={!sent}
          />

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
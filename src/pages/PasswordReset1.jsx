import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import ShadowBox from "../components/ShadowBox";
import { sendResetPasswordEmailCode, verifyEmailCode } from "../api/auth";

export default function PasswordReset1() {
  const navigate = useNavigate();
  const useTestCode = false;

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [timer, setTimer] = useState(180);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [countdownId, setCountdownId] = useState(null);

  const testCode = "123456";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setError("");
    setDisabled(true);

    try {
      if (useTestCode) {
        alert("테스트용 인증번호가 발송되었습니다. (123456)");
      } else {
        await sendResetPasswordEmailCode({ email });
        alert("인증번호가 이메일로 발송되었습니다.");
      }

      setSent(true);
      setTimer(180);

      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setCountdownId(countdown);
    } catch (err) {
      setError("인증번호 전송 실패: " + (err.response?.data?.message || "오류 발생"));
    } finally {
      setTimeout(() => setDisabled(false), 1000);
    }
  };

  const handleVerify = async () => {
    if (useTestCode) {
      if (code === testCode) {
        alert("인증 완료 (테스트)");
        navigate("/password-reset2", { state: { email } });
      } else {
        setError("인증번호가 일치하지 않습니다.");
      }
      return;
    }

    try {
      await verifyEmailCode({ email, code });
      alert("인증이 완료되었습니다.");
      navigate("/password-reset2", { state: { email } });
    } catch (err) {
      setError("인증 실패: " + (err.response?.data?.message || "오류 발생"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <ShadowBox>
        <h2 className="text-2xl font-semibold text-center mt-20 mb-20">비밀번호 재설정</h2>

        <div className="space-y-5">
          <div className="w-full space-y-1">
            <InputField
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-[350px]"
            />
            {sent && timer > 0 && (
              <div className="mt-1 pl-5 ml-12">
                <p className="text-xs text-red-500 ml-12">남은 시간: {formatTime(timer)}</p>
            </div>
            )}
          </div>

          <InputField
            type="text"
            placeholder="인증번호"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!sent}
            className="w-[350px]"
          />

          <div className="flex justify-center gap-4 mt-2">
            <button
              disabled={disabled}
              onClick={handleSendCode}
              className={`w-[130px] py-3 text-sm rounded-[30px] mr-10 ${
                disabled
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              인증번호 보내기
            </button>
            <button
              onClick={handleVerify}
              disabled={!sent}
              className={`w-[130px] py-3 text-sm rounded-[30px] ml-10 ${
                !sent
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              인증하기
            </button>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
      </ShadowBox>
    </div>
  );
}





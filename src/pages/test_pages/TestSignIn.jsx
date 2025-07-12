// src/pages/SignIn.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import InputField from "../../components/InputField";
import LoginButton from "../../components/LoginButton";
import blockChefImage from "../assets/block_chef.png";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    // 백엔드 연동 전 테스트용
    if (!email || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    if (email !== "test@example.com" || password !== "1234") {
      setError("아이디와 비밀번호가 일치하지 않습니다.");
      return;
    }

    setError("");
    navigate("/start");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg space-y-6">
        <img
          src={blockChefImage}
          alt="BlockChef"
          className="w-24 h-24 mx-auto mb-4"
        />
        <h2 className="text-2xl font-semibold text-center">로그인</h2>

        <div className="space-y-4">
          <InputField
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputField
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <LoginButton text="로그인" onClick={handleLogin} className="w-full" />

          <p className="text-sm text-gray-600 text-center mt-4">
            <Link to="/password-reset1" className="text-blue-500 hover:underline">
              Forget ID or password?
            </Link>
          </p>

          <p className="text-sm text-center">
            아직 계정이 없으신가요?{" "}
            <Link to="/signup1" className="text-blue-500 hover:underline">
              Create ID
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


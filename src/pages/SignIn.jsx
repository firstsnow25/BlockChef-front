// src/pages/SignIn.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";
import ShadowBox from "../components/ShadowBox";
import blockChefImage from "../assets/block_chef.png";
import { login } from "../api/auth";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    if (!email.includes("@")) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    try {
      await login({ email, password });
      setError("");
      alert("로그인 성공!");
      navigate("/start");
    } catch (err) {
      console.error(err);
      setError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <ShadowBox>
        <img
          src={blockChefImage}
          alt="BlockChef"
          className="w-34 h-34 mx-auto mb-4"
        />
        <h2 className="text-2xl font-semibold text-center mb-6">로그인</h2>

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

        {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}

        <LoginButton
          text="로그인"
          onClick={handleLogin}
          className="w-[30%] mx-auto mt-4"
        />

        <p className="text-sm text-gray-600 text-center mt-4">
          <Link to="/password-reset1" className="text-blue-500 hover:underline">
            Forget ID or password?
          </Link>
        </p>

        <p className="text-sm text-center mt-1">
          아직 계정이 없으신가요?{" "}
          <Link to="/signup1" className="text-blue-500 hover:underline">
            Create ID
          </Link>
        </p>
      </ShadowBox>
    </div>
  );
}



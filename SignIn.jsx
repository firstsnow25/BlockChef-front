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

  const useTestLogin = false; // 실제시 이부분 false로 교체!!

  const handleLogin = async () => {
    if (!email || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    if (!email.includes("@")) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    if (useTestLogin) {
      if (email === "test@test.com" && password === "1234") {
        alert("테스트 로그인 성공!");
        // ✅ 테스트 모드일 때도 임시 토큰 저장
        localStorage.setItem("token", "test-token");
        navigate("/main");
        return;
      } else {
        setError("테스트 로그인 정보가 일치하지 않습니다.");
        return;
      }
    }

    try {
      const response = await login({ email, password });
      console.log("✅ 로그인 응답:", response);
      // ✅ 로그인 성공 시 토큰 저장
      localStorage.setItem("token", response.token); // <- 실제 백엔드 응답 구조에 맞게 조정 필요
      setError("");
      alert("로그인 성공!");
      navigate("/main");
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
          className="w-[300px]"
        />

        <InputField
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-[300px]"
        />

        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}

        <LoginButton
          text="로그인"
          onClick={handleLogin}
          className="w-[30%] mx-auto mt-4"
        />

        <p className="text-sm text-gray-600 text-center mt-4">
          <Link to="/password-reset1" className="text-blue-500 hover:underline">
            Forgot ID or password?
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





import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";
import ShadowBox from "../components/ShadowBox";
import { signup } from "../api/auth";

export default function SignUp2() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [error, setError] = useState("");

const handleSignUp = async () => {
  if (password !== passwordCheck) {
    setError("비밀번호가 일치하지 않습니다.");
    return;
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    setError("비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.");
    return;
  }

  try {
    await signup({ name, email, password, passwordCheck });
    alert("회원가입이 완료되었습니다.");
    navigate("/signin");
  } catch (err) {
    setError(err.response?.data?.message || "회원가입에 실패했습니다.");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <ShadowBox>
        <h2 className="text-2xl font-semibold text-center mt-20 mb-20">회원가입</h2>
        <div className="space-y-5">
          <InputField type="email" value={email} disabled />
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
            value={passwordCheck}
            onChange={(e) => setPasswordCheck(e.target.value)}
          />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="flex justify-center">
                <LoginButton text="회원가입" onClick={handleSignUp} className="w-full" />
            </div>
        </div>
      </ShadowBox>
    </div>
  );
}


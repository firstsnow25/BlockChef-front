// src/pages/InfoEdit.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyInfo, updateMyInfo } from "../api/userApi";
import TopNavbar from "../components/TopNavbar";

export default function InfoEdit() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isPasswordMatch = password === confirmPassword && password !== "";

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await fetchMyInfo();
        setName(data.name);
        setEmail(data.email);
      } catch (err) {
        alert("로그인이 필요합니다.");
        navigate("/signin");
      }
    };
    fetchUserInfo();
  }, [navigate]);

  const handleConfirm = async () => {
    if (!name && !password) return alert("수정할 내용을 입력해주세요.");
    if (password && !isPasswordMatch) return alert("비밀번호가 일치하지 않습니다.");
    if (!window.confirm("수정하시겠습니까?")) return;

    try {
      await updateMyInfo({
        name: name || undefined,
        password: password || undefined,
        passwordCheck: confirmPassword || undefined,
      });
      alert("수정이 완료되었습니다.");
      navigate("/my-info");
    } catch (err) {
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNavbar activeMenu="chef" />

      <div className="p-8">
        <h2 className="text-orange-400 font-semibold mb-6 text-lg">내 정보 수정</h2>
        <div className="space-y-4 w-full max-w-md">
          {/* 이름 */}
          <div className="flex items-center gap-4 border-b pb-2">
            <label className="w-32">이름:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border-b border-gray-300 focus:outline-none px-2 py-1"
            />
          </div>

          {/* 이메일 */}
          <div className="flex items-center gap-4 border-b pb-2">
            <label className="w-32">이메일:</label>
            <span className="flex-1 text-gray-400 italic">{email}</span>
          </div>

          {/* 비밀번호 */}
          <div className="flex items-center gap-4 border-b pb-2">
            <label className="w-32">비밀번호:</label>
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 border-b border-gray-300 focus:outline-none px-2 py-1"
            />
          </div>

          {/* 비밀번호 확인 */}
            <div className="flex items-center gap-4 border-b pb-2">
              <label className="w-32">비밀번호 확인:</label>
              <input
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex-1 border-b border-gray-300 focus:outline-none px-2 py-1"
              />
            </div>

            {/* 하단 메시지 + 버튼 (고정 배치) */}
            <div className="flex justify-end items-center mt-4 space-x-4 min-h-[24px]">
              <p className={`text-sm w-32 text-right ${isPasswordMatch ? "text-green-500" : "text-red-500"}`}>
                {confirmPassword ? (isPasswordMatch ? "비밀번호 일치" : "비밀번호 불일치") : ""}
              </p>
              <button
                onClick={handleConfirm}
                className="bg-orange-300 text-white px-6 py-2 rounded-full"
              >
                수정 확인
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}






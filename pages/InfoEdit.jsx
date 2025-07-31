// src/pages/InfoEdit.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import blockChefImage from "../assets/block_chef.png";
import { fetchMyInfo, updateMyInfo } from "../api/userApi";

export default function InfoEdit() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const isPasswordMatch = password === confirmPassword && password !== "";

  // 1. 유저 정보 불러오기
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

  // 2. 수정 요청
  const handleConfirm = async () => {
    if (!editingName && !editingPassword) {
      alert("수정할 내용을 입력해주세요.");
      return;
    }
    if (editingPassword && !isPasswordMatch) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    const confirm = window.confirm("수정하시겠습니까?");
    if (!confirm) return;

    try {
      await updateMyInfo({
        name: editingName ? name : undefined,
        password: editingPassword ? password : undefined,
        passwordCheck: editingPassword ? confirmPassword : undefined,
      });
      alert("수정이 완료되었습니다.");
      navigate("/my-info");
    } catch (err) {
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 상단바 생략 */}
      <div className="p-8">
        <h2 className="text-orange-400 font-semibold mb-6 text-lg">내 정보 수정</h2>
        <div className="space-y-4 w-full max-w-md">
          {/* 이름 */}
          <div className="flex justify-between items-center border-b pb-2">
            <label className="mr-4">이름:</label>
            {editingName ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-b border-gray-300 focus:outline-none px-2 py-1"
              />
            ) : (
              <span>{name}</span>
            )}
            <button
              onClick={() => setEditingName((prev) => !prev)}
              className="text-sm border border-orange-300 rounded-full px-3 py-1 text-orange-400"
            >
              수정하기
            </button>
          </div>

          {/* 이메일 (비활성화) */}
          <div className="flex justify-between items-center border-b pb-2">
            <label className="mr-4">이메일:</label>
            <span>{email}</span>
            <button disabled className="text-sm border border-gray-300 rounded-full px-3 py-1 text-gray-300">
              수정불가
            </button>
          </div>

          {/* 비밀번호 */}
          <div className="flex justify-between items-center border-b pb-2">
            <label className="mr-4">비밀번호:</label>
            <input
              type="password"
              onChange={(e) => {
                setPassword(e.target.value);
                setEditingPassword(true);
              }}
              className="border-b border-gray-300 focus:outline-none px-2 py-1"
            />
            <button
              onClick={() => setEditingPassword(true)}
              className="text-sm border border-orange-300 rounded-full px-3 py-1 text-orange-400"
            >
              수정하기
            </button>
          </div>

          {/* 비밀번호 확인 */}
          <div className="flex justify-between items-center border-b pb-2">
            <label className="mr-4">비밀번호 확인:</label>
            <input
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-b border-gray-300 focus:outline-none px-2 py-1"
            />
            <span
              className={`text-sm ml-4 min-w-[100px] text-right ${
                confirmPassword
                  ? isPasswordMatch
                    ? "text-green-500"
                    : "text-red-500"
                  : "text-transparent"
              }`}
            >
              {confirmPassword ? (isPasswordMatch ? "비밀번호 일치" : "비밀번호 불일치") : "확인 중"}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={handleConfirm} className="bg-orange-300 text-white px-6 py-2 rounded-full">
            수정 확인
          </button>
        </div>
      </div>
    </div>
  );
}

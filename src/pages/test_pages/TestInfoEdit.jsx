// src/pages/InfoEdit.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import blockChefImage from "../assets/block_chef.png";

export default function InfoEdit() {
  const navigate = useNavigate();
  const [name, setName] = useState("Chef");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const isPasswordMatch = password === confirmPassword && password !== "";

  const handleConfirm = () => {
    if (!editingName && !editingPassword) {
      alert("수정할 내용을 입력해주세요.");
      return;
    }

    if (editingPassword && !isPasswordMatch) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    const confirm = window.confirm("수정하시겠습니까?");
    if (confirm) {
      navigate("/my-info");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 상단바 */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <img src={blockChefImage} alt="BlockChef" className="w-8 h-8 mr-2" />
          <span className="text-xl font-semibold text-orange-500">BlockChef</span>
        </div>
        <div className="flex gap-6 text-sm items-center">
          <button onClick={() => navigate("/main")} className="text-black">
            레시피 만들기
          </button>
          <span>|</span>
          <button onClick={() => navigate("/my-recipe")} className="text-black">
            나의 레시피
          </button>
          <span>|</span>
          <button className="text-orange-500 font-semibold">Chef ▾</button>
        </div>
      </div>

      {/* 본문 */}
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

          {/* 이메일 - 수정불가 */}
          <div className="flex justify-between items-center border-b pb-2">
            <label className="mr-4">이메일:</label>
            <span>email@email.com</span>
            <button className="text-sm border border-gray-300 rounded-full px-3 py-1 text-gray-300" disabled>
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
          <div className="flex justify-between items-center border-b pb-2">
            <label className="mr-4">비밀번호:</label>
            <input
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-b border-gray-300 focus:outline-none px-2 py-1"
            />
            <span className={`text-sm ${isPasswordMatch ? "text-green-500" : "text-red-500"}`}>
              {confirmPassword && (isPasswordMatch ? "비밀번호 일치" : "비밀번호 불일치")}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleConfirm}
            className="bg-orange-300 text-white px-6 py-2 rounded-full"
          >
            수정 확인
          </button>
        </div>
      </div>
    </div>
  );
}

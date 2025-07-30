// src/pages/MyInfo.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import blockChefImage from "../assets/block_chef.png";

export default function MyInfo() {
  const navigate = useNavigate();

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
          <button onClick={() => navigate("/my-recipe")} className="text-orange-500 font-semibold">
            나의 레시피
          </button>
          <span>|</span>
          <button className="text-black">Chef ▾</button>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-8">
        <h2 className="text-orange-400 font-semibold mb-6 text-lg">내 정보</h2>
        <div className="space-y-4 w-full max-w-md">
          <div className="flex justify-between border-b pb-2">
            <span>이름:</span>
            <span>Chef</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>이메일:</span>
            <span>email@email.com</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>비밀번호:</span>
            <span>●●●●●●</span>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <button className="bg-red-300 text-white px-5 py-2 rounded-full">회원탈퇴</button>
          <button
            onClick={() => navigate("/info-edit")}
            className="bg-orange-300 text-white px-5 py-2 rounded-full"
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  );
}

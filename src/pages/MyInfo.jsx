// src/pages/MyInfo.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import blockChefImage from "../assets/block_chef.png";
import { fetchMyInfo, deleteMyAccount } from "../api/userApi";
import TopNavbar from "../components/TopNavbar";

export default function MyInfo() {
  const [activeMenu, setActiveMenu] = useState("chef");
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const data = await fetchMyInfo();
        setUserInfo(data);
      } catch (err) {
        console.error("내 정보 조회 실패", err);
        alert("정보를 불러오지 못했습니다.");
      }
    };
    getUserInfo();
  }, []);

  const handleDelete = async () => {
    const confirmed = window.confirm("정말 회원 탈퇴하시겠습니까?");
    if (!confirmed) return;

    const password = prompt("비밀번호를 입력하세요");
    const passwordCheck = prompt("비밀번호 확인을 입력하세요");

    if (!password || !passwordCheck) {
      alert("비밀번호를 모두 입력해야 합니다.");
      return;
    }

    try {
      await deleteMyAccount({
        name: userInfo.name,
        password,
        passwordCheck,
      });
      alert("회원 탈퇴가 완료되었습니다.");
      navigate("/");
    } catch (error) {
      console.error("회원 탈퇴 실패", error);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <TopNavbar activeMenu="chef" />

      {/* 본문 */}
      <div className="p-8">
        <h2 className="text-orange-400 font-semibold mb-6 text-lg">내 정보</h2>
        <div className="space-y-4 w-full max-w-md">
          <div className="flex justify-between border-b pb-2">
            <span>이름:</span>
            <span>{userInfo.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>이메일:</span>
            <span>{userInfo.email}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>비밀번호:</span>
            <span>●●●●●●</span>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-start gap-3">
          <button
            onClick={handleDelete}
            className="bg-red-300 text-white px-5 py-2 rounded-full"
          >
            회원탈퇴
          </button>
          <button
            onClick={() => navigate("/info-edit")}
            className="bg-orange-300 text-white px-5 py-2 rounded-full ml-4"
          >
            수정하기
          </button>
        </div>  
      </div>
    </div>
  );
}






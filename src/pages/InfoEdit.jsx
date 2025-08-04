// src/pages/InfoEdit.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import blockChefImage from "../assets/block_chef.png";
import { fetchMyInfo, updateMyInfo } from "../api/userApi";

export default function InfoEdit() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isPasswordMatch = password === confirmPassword && password !== "";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const [userId, setUserId] = useState("");

  // 유저 정보 불러오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await fetchMyInfo();
        setName(data.name);
        setEmail(data.email);
        setUserId(data.email.split("@")[0]);
      } catch (err) {
        alert("로그인이 필요합니다.");
        navigate("/signin");
      }
    };
    fetchUserInfo();
  }, [navigate]);

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirm = async () => {
    if (!name && !password) {
      alert("수정할 내용을 입력해주세요.");
      return;
    }
    if (password && !isPasswordMatch) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    const confirm = window.confirm("수정하시겠습니까?");
    if (!confirm) return;

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

  const handleTopNav = (target) => {
    if (target === "main") navigate("/main");
    else if (target === "my") navigate("/my-recipe");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 상단 내비게이션 */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200 relative">
        <div className="flex items-center">
          <img src={blockChefImage} alt="BlockChef" className="w-8 h-8 mr-2" />
          <span className="text-xl font-semibold text-orange-500">BlockChef</span>
        </div>
        <div className="flex gap-6 text-sm items-center">
          <button onClick={() => handleTopNav("main")} className="text-black">레시피 만들기</button>
          <span>|</span>
          <button onClick={() => handleTopNav("my")} className="text-black">나의 레시피</button>
          <span>|</span>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowProfileMenu((prev) => !prev)} className="text-black">
              {userId || "Chef"} ▾
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md z-10 py-4">
                <div className="absolute top-[-8px] right-6 w-4 h-4 bg-white border-l border-t border-gray-300 rotate-45"></div>
                <p className="text-center font-semibold mb-4">Chef</p>
                <div className="flex justify-around">
                  <button onClick={() => { setShowProfileMenu(false); navigate("/my-info"); }} className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm">내 정보</button>
                  <button className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm">로그아웃</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
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

            {/* 일치 여부 메시지 */}
            {confirmPassword && (
              <p className={`text-sm mt-1 ${isPasswordMatch ? "text-green-500" : "text-red-500"}`}>
                {isPasswordMatch ? "비밀번호 일치" : "비밀번호 불일치"}
              </p>
            )}

            {/* 수정 버튼 - 오른쪽 아래 정렬 */}
            <div className="w-full flex justify-end mt-6">
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









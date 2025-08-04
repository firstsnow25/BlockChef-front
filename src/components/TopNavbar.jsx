import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import blockChefImage from "../assets/block_chef.png";
import { fetchMyInfo } from "../api/userApi";

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userId, setUserId] = useState("");
  const [activeMenu, setActiveMenu] = useState("chef");

  // 유저 정보 불러오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await fetchMyInfo();
        setUserId(data.email.split("@")[0]); // 이메일 앞부분만
      } catch (err) {
        alert("로그인이 필요합니다.");
        navigate("/signin");
      }
    };
    fetchUser();
  }, [navigate]);

  // 현재 경로에 따라 메뉴 상태 설정
  useEffect(() => {
    if (location.pathname.includes("/main")) setActiveMenu("main");
    else if (location.pathname.includes("/my-recipe")) setActiveMenu("my");
    else if (location.pathname.includes("/my-info")) setActiveMenu("chef");
  }, [location]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 메뉴 이동 핸들러
  const handleTopNav = (target) => {
    setActiveMenu(target);
    if (target === "main") navigate("/main");
    else if (target === "my") navigate("/my-recipe");
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem("token"); // JWT 제거
    alert("로그아웃되었습니다.");
    navigate("/signin");
  };

  return (
    <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200 relative bg-white">
      <div className="flex items-center">
        <img src={blockChefImage} alt="BlockChef" className="w-8 h-8 mr-2" />
        <span className="text-xl font-semibold text-orange-500">BlockChef</span>
      </div>
      <div className="flex gap-6 text-sm items-center">
        <button
          onClick={() => handleTopNav("main")}
          className={`${activeMenu === "main" ? "text-orange-500 font-semibold" : "text-black"}`}
        >
          레시피 만들기
        </button>
        <span>|</span>
        <button
          onClick={() => handleTopNav("my")}
          className={`${activeMenu === "my" ? "text-orange-500 font-semibold" : "text-black"}`}
        >
          나의 레시피
        </button>
        <span>|</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setActiveMenu("chef");
              setShowProfileMenu((prev) => !prev);
            }}
            className={`${activeMenu === "chef" ? "text-orange-500 font-semibold" : "text-black"}`}
          >
            {userId || "Chef"} ▾
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md z-10 py-4">
              <div className="absolute top-[-8px] right-6 w-4 h-4 bg-white border-l border-t border-gray-300 rotate-45"></div>
              <p className="text-center font-semibold mb-4">{userId || "Chef"}</p>
              <div className="flex justify-around">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/my-info");
                  }}
                  className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm"
                >
                  내 정보
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

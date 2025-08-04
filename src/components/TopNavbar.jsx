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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await fetchMyInfo();
        setUserId(data.email.split("@")[0]);
      } catch (err) {
        alert("로그인이 필요합니다.");
        navigate("/signin");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (location.pathname.includes("/main")) setActiveMenu("main");
    else if (location.pathname.includes("/my-recipe")) setActiveMenu("my");
    else if (location.pathname.includes("/my-info")) setActiveMenu("chef");
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTopNav = (target) => {
    setActiveMenu(target);
    if (target === "main") navigate("/main");
    else if (target === "my") navigate("/my-recipe");
  };

  const executeLogout = () => {
    localStorage.removeItem("token");
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
                  onClick={() => setShowLogoutConfirm(true)}
                  className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}

          {/* 로그아웃 확인 팝업 */}
          {showLogoutConfirm && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-300 shadow-lg rounded-md z-20 py-4 px-4">
              <p className="text-center text-sm mb-3 font-medium">로그아웃하시겠습니까?</p>
              <div className="flex justify-between">
                <button
                  onClick={executeLogout}
                  className="bg-red-400 text-white px-4 py-1 rounded-full text-sm"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-gray-300 text-black px-4 py-1 rounded-full text-sm"
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


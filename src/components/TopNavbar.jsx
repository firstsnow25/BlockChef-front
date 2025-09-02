// src/components/TopNavbar.jsx
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

  // ✅ 이동 전 확인: /main에서 작업중(블록 존재)일 때만 경고
  const confirmLeaveIfDirty = () => {
    const isMain = location.pathname.includes("/main");
    const dirty = sessionStorage.getItem("blockchef:dirty") === "1";
    if (isMain && dirty) {
      return window.confirm(
        "현재 작업중인 블록이 저장되지 않을 수 있습니다. 페이지를 이동하시겠습니까?"
      );
    }
    return true;
  };

  // ✅ 상단 메뉴 핸들러
  const handleTopNav = (target) => {
    setActiveMenu(target);

    // 레시피 만들기: 메인에서 작업 중이면 경고 → 확인 시 작업영역 완전 초기화
    if (target === "main") {
      if (!confirmLeaveIfDirty()) return;

      // ▶ MainPage가 듣는 커스텀 이벤트. 메인에 있을 때 즉시 블록/폼 초기화.
      window.dispatchEvent(new CustomEvent("blockchef:new-recipe"));
      // 안전하게 dirty 리셋 (MainPage도 다시 0으로 세팅함)
      sessionStorage.setItem("blockchef:dirty", "0");

      setShowProfileMenu(false);
      setShowLogoutConfirm(false);
      navigate("/main");
      return;
    }

    // 나의 레시피는 기존 로직 유지
    if (target === "my") {
      if (!confirmLeaveIfDirty()) return;
      setShowProfileMenu(false);
      setShowLogoutConfirm(false);
      navigate("/my-recipe");
    }
  };

  const executeLogout = () => {
    if (!confirmLeaveIfDirty()) return; // ✅ 로그아웃도 동일 정책
    localStorage.removeItem("token");
    alert("로그아웃되었습니다.");
    navigate("/signin");
  };

  return (
    <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200 relative bg-white z-30">
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
            내정보 ▾
          </button>

          {/* 프로필 드롭다운 */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md z-[60] py-4">
              <div className="absolute top-[-8px] right-6 w-4 h-4 bg-white border-l border-t border-gray-300 rotate-45"></div>
              <p className="text-center font-semibold mb-4">{userId}</p>
              <div className="flex justify-around">
                <button
                  onClick={() => {
                    if (!confirmLeaveIfDirty()) return;
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
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-300 shadow-lg rounded-md z-[70] py-4 px-4">
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




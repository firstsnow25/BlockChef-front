import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import LoginButton from "../components/LoginButton";
import GeneralButton from "../components/GeneralButton";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Play,
  Save,
} from "lucide-react";
import blockChefImage from "../assets/block_chef.png";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState("재료");
  const [ingredients, setIngredients] = useState(["당근", "브로콜리"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState("main");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleTopNav = (menu) => {
    setActiveMenu(menu);
    setShowProfileMenu(false);
    if (menu === "my") navigate("/my-recipe");
  };

  const renderBlocks = () => {
    switch (activeTab) {
      case "재료":
        return (
          <>
            <InputField 
              type="text"
              placeholder="재료 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2 mb-2 mt-2">
              <GeneralButton
                text="+ 재료 추가"
                onClick={() => {}}
                className="text-orange-500 border-orange-300"
              />

              <GeneralButton
                text="⚙ 재료 수정"
                onClick={() => {}}
                className="text-orange-500 border-orange-300"
              />
            </div>
            {ingredients
              .filter((item) => item.includes(searchTerm))
              .map((item, index) => (
                <div
                  key={index}
                  className="bg-yellow-200 text-gray-800 my-1 px-3 py-1 rounded"
                  style={{ width: `${item.length * 16 + 40}px` }}
                >
                  {item}
                </div>
              ))}
          </>
        );
      case "동작":
        return (
          <>
            <div className="bg-rose-300 my-1 w-full py-1 px-2 rounded">굽는다 (일자형)</div>
            <div className="bg-rose-400 my-1 w-full py-2 px-2 rounded">굽는다 (ㄷ자형)</div>
            <div className="bg-rose-300 my-1 w-full py-1 px-2 rounded">삶는다 (일자형)</div>
            <div className="bg-rose-400 my-1 w-full py-2 px-2 rounded">삶는다 (ㄷ자형)</div>
          </>
        );
      case "흐름":
        return (
          <>
            <div className="bg-blue-300 text-white my-1 w-full py-2 px-2 rounded">
              반복하기 (예시 블록)
            </div>
          </>
        );
      default:
        return null;
    }
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
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu("chef");
                setShowProfileMenu((prev) => !prev);
              }}
              className={`${activeMenu === "chef" ? "text-orange-500 font-semibold" : "text-black"}`}
            >
              Chef ▾
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md z-10 py-4">
                {/* 꼬리 */}
                <div className="absolute top-[-8px] right-6 w-4 h-4 bg-white border-l border-t border-gray-300 rotate-45"></div>
                <p className="text-center font-semibold mb-4">Chef</p>
                <div className="flex justify-around">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false); // 말풍선 닫고
                      navigate("/my-info");      // 내 정보 페이지로 이동
                    }}
                    className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm"
                  >
                    내 정보
                  </button>
                  <button className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm">
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex flex-row flex-1">
        {/* 좌측 탭 */}
        <div className="w-[120px] border-r border-gray-200 p-2">
          {[
            ["재료", "bg-orange-400"],
            ["동작", "bg-orange-400"],
            ["흐름", "bg-orange-400"],
          ].map(([tab, color]) => (
            <LoginButton
              key={tab}
              text={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full my-1 ${activeTab === tab ? color : ""}`}
            />
          ))}
        </div>

        {/* 블록 목록 영역 */}
        <div className="w-[260px] border-r border-gray-200 p-4">
          {renderBlocks()}
        </div>

        {/* 중앙 작업 영역 */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl">
            {/* 여기에 Blockly 삽입 예정 */}
          </div>

          {/* 우측 하단 조작 버튼 */}
          <div className="absolute bottom-4 right-4 flex gap-4 items-center">
            <ChevronLeft className="text-orange-400 cursor-pointer" />
            <ChevronRight className="text-orange-400 cursor-pointer" />
            <Trash2 className="text-orange-400 cursor-pointer" />
            <Play className="text-orange-400 cursor-pointer" />
            <Save className="text-orange-400 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}



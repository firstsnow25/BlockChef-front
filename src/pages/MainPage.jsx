// src/pages/MainPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { saveRecipe, fetchRecipeDetail } from "../api/recipeApi";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState("재료");
  const [ingredients, setIngredients] = useState(["당근", "브로콜리"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState("main");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeTags, setRecipeTags] = useState("");
  const [recipeXml, setRecipeXml] = useState(""); // XML 저장

  const navigate = useNavigate();
  const location = useLocation();

  // 상세 조회 시 쿼리스트링에서 id 확인
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const recipeId = params.get("id");
    if (recipeId) {
      loadRecipeDetail(recipeId);
    }
  }, [location.search]);

  const loadRecipeDetail = async (id) => {
    try {
      const data = await fetchRecipeDetail(id);
      setRecipeTitle(data.title);
      setRecipeDescription(data.description);
      setRecipeTags(data.tags.join(", "));
      setRecipeXml(data.xml || "");

      // TODO: Blockly workspace 복원 필요 시 여기에 삽입
      // Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(data.xml), workspace);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
    }
  };

  const handleTopNav = (menu) => {
    setActiveMenu(menu);
    setShowProfileMenu(false);
    if (menu === "my") navigate("/my-recipe");
  };

  const handleSave = async () => {
    try {
      // TODO: Blockly 워크스페이스에서 xml 가져오기
      // const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
      const xml = recipeXml; // 임시 대체 (실제 구현 시 위 라인으로 교체)

      await saveRecipe({
        title: recipeTitle,
        description: recipeDescription,
        tags: recipeTags.split(",").map((tag) => tag.trim()),
        xml,
      });
      alert("레시피가 저장되었습니다!");
      setShowSavePopup(false);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("레시피 저장 중 오류가 발생했습니다.");
    }
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
          <div className="bg-blue-300 text-white my-1 w-full py-2 px-2 rounded">
            반복하기 (예시 블록)
          </div>
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
          <button onClick={() => handleTopNav("main")} className={`${activeMenu === "main" ? "text-orange-500 font-semibold" : "text-black"}`}>레시피 만들기</button>
          <span>|</span>
          <button onClick={() => handleTopNav("my")} className={`${activeMenu === "my" ? "text-orange-500 font-semibold" : "text-black"}`}>나의 레시피</button>
          <span>|</span>
          <div className="relative">
            <button onClick={() => { setActiveMenu("chef"); setShowProfileMenu((prev) => !prev); }} className={`${activeMenu === "chef" ? "text-orange-500 font-semibold" : "text-black"}`}>Chef ▾</button>
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
      <div className="flex flex-row flex-1">
        <div className="w-[120px] border-r border-gray-200 p-2">
          {["재료", "동작", "흐름"].map((tab) => (
            <LoginButton key={tab} text={tab} onClick={() => setActiveTab(tab)} className={`w-full my-1 ${activeTab === tab ? "bg-orange-400" : ""}`} />
          ))}
        </div>

        <div className="w-[260px] border-r border-gray-200 p-4">
          {renderBlocks()}
        </div>

        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl">
            {/* Blockly 삽입 예정 */}
          </div>

          <div className="absolute bottom-4 right-4 flex gap-4 items-center">
            <ChevronLeft className="text-orange-400 cursor-pointer" />
            <ChevronRight className="text-orange-400 cursor-pointer" />
            <Trash2 className="text-orange-400 cursor-pointer" />
            <Play className="text-orange-400 cursor-pointer" />
            <Save className="text-orange-400 cursor-pointer" onClick={() => setShowSavePopup(true)} />
          </div>
        </div>
      </div>

      {/* 레시피 저장 팝업 */}
      {showSavePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">레시피 저장</h2>
            <input type="text" placeholder="제목" value={recipeTitle} onChange={(e) => setRecipeTitle(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded mb-2" />
            <textarea placeholder="설명" value={recipeDescription} onChange={(e) => setRecipeDescription(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded mb-2 resize-none" />
            <input type="text" placeholder="태그 (예: 찌개, 볶음)" value={recipeTags} onChange={(e) => setRecipeTags(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSavePopup(false)} className="text-gray-500">취소</button>
              <button onClick={handleSave} className="bg-orange-400 text-white px-4 py-1 rounded">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






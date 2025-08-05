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
  Save,
} from "lucide-react";
import TopNavbar from "../components/TopNavbar"; // ✅ 상단 내비게이션 컴포넌트
import { saveRecipe, fetchRecipeDetail } from "../api/recipeApi";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState("재료");
  const [ingredients, setIngredients] = useState(["당근", "브로콜리"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeTags, setRecipeTags] = useState("");
  const [recipeXml, setRecipeXml] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
    }
  };

  const handleSave = async () => {
    setTitleError(false);
    setTagsError(false);

    const parsedTags = recipeTags
      .split("#")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    if (!recipeTitle.trim()) {
      setTitleError(true);
    }
    if (parsedTags.length === 0) {
      setTagsError(true);
    }

    if (!recipeTitle.trim() || parsedTags.length === 0) return;

    try {
      const xml = recipeXml;
      await saveRecipe({
        title: recipeTitle,
        description: recipeDescription,
        tags: parsedTags,
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
            {/* ✅ 재료 추가/수정 버튼 제거됨 */}
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
      <TopNavbar />

      {/* 본문 */}
      <div className="flex flex-row flex-1">
        <div className="w-[120px] border-r border-gray-200 p-2">
          {["재료", "동작", "흐름"].map((tab) => (
            <LoginButton
              key={tab}
              text={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full my-1 ${activeTab === tab ? "bg-orange-400" : ""}`}
            />
          ))}
        </div>

        <div className="w-[260px] border-r border-gray-200 p-4">{renderBlocks()}</div>

        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl">
            {/* Blockly 삽입 예정 */}
          </div>

          <div className="absolute top-4 left-4 flex gap-4 items-center">
            <div className="group relative">
              <ChevronLeft className="text-orange-400 cursor-pointer" />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100">되돌리기</span>
            </div>
            <div className="group relative">
              <ChevronRight className="text-orange-400 cursor-pointer" />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100">다시 실행</span>
            </div>
            <div className="group relative">
              <Trash2 className="text-orange-400 cursor-pointer" />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100">삭제</span>
            </div>
            <div className="group relative">
              <Save
                className="text-orange-400 cursor-pointer"
                onClick={() => setShowSavePopup(true)}
              />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-0.5 opacity-0 group-hover:opacity-100">저장</span>
            </div>
          </div>
        </div>
      </div>

      {/* 레시피 저장 팝업 */}
      {showSavePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">레시피 저장</h2>
            <input
              type="text"
              placeholder="제목"
              value={recipeTitle}
              onChange={(e) => setRecipeTitle(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-1"
            />
            {titleError && <p className="text-red-500 text-sm mb-1">제목을 입력해주세요.</p>}

            <textarea
              placeholder="설명"
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-1 resize-none"
            />

            <input
              type="text"
              placeholder="#찌개 #볶음"
              value={recipeTags}
              onChange={(e) => setRecipeTags(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-1"
            />
            {tagsError && <p className="text-red-500 text-sm mb-1">태그를 하나 이상 입력해주세요.</p>}

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setShowSavePopup(false)} className="text-gray-500">
                취소
              </button>
              <button
                onClick={handleSave}
                className="bg-orange-400 text-white px-4 py-1 rounded"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









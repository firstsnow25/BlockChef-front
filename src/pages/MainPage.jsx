// src/pages/MainPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginButton from "../components/LoginButton";
import TagInput from "../components/TagInput";
import { ChevronLeft, ChevronRight, Trash2, Save } from "lucide-react";
import TopNavbar from "../components/TopNavbar";
import { saveRecipe, fetchRecipeDetail } from "../api/recipeApi";
import BlocklyArea from "../components/BlocklyArea";
import { CATEGORY_ORDER } from "../blockly/catalog";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState(CATEGORY_ORDER[0]);

  const [showSavePopup, setShowSavePopup] = useState(false);
  const [recipeId, setRecipeId] = useState(null);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [recipeXml, setRecipeXml] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const blocklyRef = useRef(null);

  // ✅ 레시피 상세 로드
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadRecipeDetail(id);
    if (!id) sessionStorage.setItem("blockchef:dirty", "0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadRecipeDetail = async (id) => {
    try {
      const data = await fetchRecipeDetail(id); // {_id,title,description,xml,tags}
      setRecipeId(data._id || null);
      setRecipeTitle(data.title || "");
      setRecipeDescription(data.description || "");
      setTags((data.tags || []).map((t) => `#${t}`));
      const xml = data.xml || "";
      setRecipeXml(xml);
      sessionStorage.setItem("blockchef:dirty", "0");
      blocklyRef.current?.loadXml(xml);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
      console.error("서버 응답 바디:", err.response?.data);
      alert("레시피 불러오기에 실패했습니다.");
    }
  };

  // ✅ 저장
  const handleSave = async () => {
    setTitleError(!recipeTitle.trim());
    setTagsError(tags.length === 0);
    if (!recipeTitle.trim() || tags.length === 0) return;
    try {
      const xml = blocklyRef.current?.getXml() || recipeXml;
      const cleanedTags = tags.map((tag) => tag.replace(/^#/, ""));
      await saveRecipe({
        _id: recipeId,
        title: recipeTitle,
        description: recipeDescription,
        tags: cleanedTags,
        xml,
      });
      alert("레시피가 저장되었습니다!");
      setShowSavePopup(false);
      sessionStorage.setItem("blockchef:dirty", "0");
    } catch (err) {
      console.error("저장 실패:", err);
      console.error("서버 응답 바디:", err.response?.data);
      alert("레시피 저장 중 오류가 발생했습니다.");
    }
  };

  // ✅ XML 변경 → dirty 플래그
  const handleXmlChange = (xml) => {
    setRecipeXml(xml);
    const hasBlock = typeof xml === "string" && xml.includes("<block");
    sessionStorage.setItem("blockchef:dirty", hasBlock ? "1" : "0");
  };

  // ✅ [추가] TopNavbar가 쏘는 "새 레시피 시작" 이벤트를 받으면 작업영역/폼을 완전 초기화
  useEffect(() => {
    const onNewRecipe = () => {
      // 작업영역 싹 지우기
      try { blocklyRef.current?.clear(); } catch {}
      // 폼/상태 초기화
      setRecipeId(null);
      setRecipeTitle("");
      setRecipeDescription("");
      setTags([]);
      setRecipeXml("");
      setActiveTab(CATEGORY_ORDER[0]);
      sessionStorage.setItem("blockchef:dirty", "0");
    };
    window.addEventListener("blockchef:new-recipe", onNewRecipe);
    return () => window.removeEventListener("blockchef:new-recipe", onNewRecipe);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNavbar />

      {/* ✅ 메인 컨텐츠 아무 곳이나 클릭하면 드롭다운 닫힘 */}
      <div
        className="flex flex-row flex-1"
        onMouseDown={() => window.dispatchEvent(new CustomEvent("blockchef:ui-blur"))}
      >
        {/* 좌측 카테고리 버튼 */}
        <div className="w-[120px] border-r border-gray-200 p-2">
          {CATEGORY_ORDER.map((tab) => (
            <LoginButton
              key={tab}
              text={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full my-1 ${activeTab === tab ? "bg-orange-400" : ""} text-[13px] leading-[1.1] whitespace-nowrap`}
            />
          ))}
        </div>

        {/* Blockly 영역 */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl overflow-hidden">
            {/* 우측 상단 툴바 (z-10 그대로 유지) */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-4">
              <ChevronLeft
                className="text-orange-400 cursor-pointer"
                title="되돌리기"
                onClick={() => blocklyRef.current?.undo()}
              />
              <ChevronRight
                className="text-orange-400 cursor-pointer"
                title="다시하기"
                onClick={() => blocklyRef.current?.redo()}
              />
              <Trash2
                className="text-orange-400 cursor-pointer"
                title="전체 삭제"
                onClick={() => {
                  if (window.confirm("현재 레시피 블록을 모두 지울까요?")) {
                    blocklyRef.current?.clear();
                    sessionStorage.setItem("blockchef:dirty", "0");
                  }
                }}
              />
              <Save
                className="text-orange-400 cursor-pointer"
                title="저장"
                onClick={() => setShowSavePopup(true)}
              />
            </div>

            <BlocklyArea
              ref={blocklyRef}
              initialXml={recipeXml}
              onXmlChange={handleXmlChange}
              activeCategory={activeTab}
            />
          </div>
        </div>
      </div>

      {/* 저장 팝업 */}
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
            {titleError && <p className="text-red-500 text-sm mb-2">제목을 입력해주세요.</p>}
            <textarea
              placeholder="설명"
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-2 resize-none"
            />
            <TagInput tags={tags} setTags={setTags} />
            {tagsError && <p className="text-red-500 text-sm mt-2">태그를 하나 이상 입력해주세요.</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowSavePopup(false)} className="text-gray-500">
                취소
              </button>
              <button onClick={handleSave} className="bg-orange-400 text-white px-4 py-1 rounded">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






















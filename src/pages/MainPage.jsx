// src/pages/MainPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginButton from "../components/LoginButton";
import TagInput from "../components/TagInput";
import { ChevronLeft, ChevronRight, Trash2, Save } from "lucide-react";
import TopNavbar from "../components/TopNavbar";
import { saveRecipe, fetchRecipeDetail } from "../api/recipeApi";
import BlocklyArea from "../components/BlocklyArea";

export default function MainPage() {
  // ✅ Scratch처럼: 기본 카테고리는 "재료"
  const [activeTab, setActiveTab] = useState("재료");

  const [showSavePopup, setShowSavePopup] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [recipeXml, setRecipeXml] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const blocklyRef = useRef(null); // 워크스페이스 제어

  // 상세 진입 시 XML/메타 로드
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const recipeId = params.get("id");
    if (recipeId) loadRecipeDetail(recipeId);
  }, [location.search]);

  const loadRecipeDetail = async (id) => {
    try {
      const data = await fetchRecipeDetail(id);
      setRecipeTitle(data.title);
      setRecipeDescription(data.description);
      setTags(data.tags.map((tag) => `#${tag}`));
      const xml = data.xml || "";
      setRecipeXml(xml);
      // 워크스페이스가 이미 떠있다면 즉시 로드
      blocklyRef.current?.loadXml(xml);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
    }
  };

  const handleSave = async () => {
    if (!recipeTitle.trim()) setTitleError(true);
    else setTitleError(false);
    if (tags.length === 0) setTagsError(true);
    else setTagsError(false);
    if (!recipeTitle.trim() || tags.length === 0) return;

    try {
      // ✅ 현재 워크스페이스 XML 우선 저장
      const xml = blocklyRef.current?.getXml() || recipeXml;
      const cleanedTags = tags.map((tag) => tag.replace(/^#/, ""));
      await saveRecipe({
        title: recipeTitle,
        description: recipeDescription,
        tags: cleanedTags,
        xml,
      });
      alert("레시피가 저장되었습니다!");
      setShowSavePopup(false);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("레시피 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNavbar />

      <div className="flex flex-row flex-1">
        {/* ⬅️ 카테고리 버튼 (Scratch의 왼쪽 메뉴) */}
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

        {/* ➡️ Blockly 워크스페이스 (툴박스/플라이아웃 + 작업영역) */}
        {/* 중간의 '검은 패널'은 제거: Scratch처럼 워크스페이스 왼쪽에 플라이아웃이 뜸 */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl overflow-hidden">
            <BlocklyArea
              ref={blocklyRef}
              initialXml={recipeXml}
              onXmlChange={(xml) => setRecipeXml(xml)}
              activeCategory={activeTab} // 버튼 누르면 해당 카테고리 툴박스/플라이아웃 표시
            />
          </div>

          {/* 우하단 툴 버튼 */}
          <div className="absolute bottom-[20px] right-[20px] flex gap-4 items-center">
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
                }
              }}
            />
            <Save
              className="text-orange-400 cursor-pointer"
              onClick={() => setShowSavePopup(true)}
              title="저장"
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











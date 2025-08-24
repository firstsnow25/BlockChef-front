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
  // 왼쪽 카테고리 버튼(팔레트 전환)
  const [activeTab, setActiveTab] = useState(CATEGORY_ORDER[0]);

  // 저장 팝업/메타
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [recipeId, setRecipeId] = useState(null);        // ✅ 기존 레시피 수정용 id (_id)
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [recipeXml, setRecipeXml] = useState("");        // 현재 워크스페이스 XML 스냅샷
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const blocklyRef = useRef(null);

  // 상세 진입 시(id 존재) 레시피 로드
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadRecipeDetail(id);
  }, [location.search]);

  const loadRecipeDetail = async (id) => {
    try {
      // api/recipeApi.js 에서 형식 정규화해서 반환: { _id, title, description, xml, tags }
      const data = await fetchRecipeDetail(id);
      setRecipeId(data._id || null);
      setRecipeTitle(data.title || "");
      setRecipeDescription(data.description || "");
      setTags((data.tags || []).map((t) => `#${t}`));
      const xml = data.xml || "";
      setRecipeXml(xml);
      blocklyRef.current?.loadXml(xml);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
      console.error("서버 응답 바디:", err.response?.data);
      alert("레시피 불러오기에 실패했습니다.");
    }
  };

  const handleSave = async () => {
    // 간단 검증
    setTitleError(!recipeTitle.trim());
    setTagsError(tags.length === 0);
    if (!recipeTitle.trim() || tags.length === 0) return;

    try {
      // 워크스페이스에서 최신 XML 추출 (없으면 스냅샷 사용)
      const xml = blocklyRef.current?.getXml() || recipeXml;
      const cleanedTags = tags.map((tag) => tag.replace(/^#/, ""));

      await saveRecipe({
        _id: recipeId,                      // ✅ 있으면 수정, 없으면 신규
        title: recipeTitle,
        description: recipeDescription,
        tags: cleanedTags,
        xml,                                // api 레이어에서 blockStructure로 매핑됨
      });

      alert("레시피가 저장되었습니다!");
      setShowSavePopup(false);
      // 원하면 저장 후 목록으로 이동:
      // navigate("/my");
    } catch (err) {
      console.error("저장 실패:", err);
      console.error("서버 응답 바디:", err.response?.data); // 400 원인 확인용
      alert("레시피 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNavbar />

      <div className="flex flex-row flex-1">
        {/* ⬅️ 카테고리 버튼 (팔레트 전환 전용) */}
        <div className="w-[120px] border-r border-gray-200 p-2">
          {CATEGORY_ORDER.map((tab) => (
            <LoginButton
              key={tab}
              text={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full my-1 ${activeTab === tab ? "bg-orange-400" : ""}`}
            />
          ))}
        </div>

        {/* ➡️ Blockly 워크스페이스 (팔레트 + 작업영역) */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl overflow-hidden">
            <BlocklyArea
              ref={blocklyRef}
              initialXml={recipeXml}
              onXmlChange={(xml) => setRecipeXml(xml)}
              activeCategory={activeTab}
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














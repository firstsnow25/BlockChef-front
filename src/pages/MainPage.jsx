// src/pages/MainPage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginButton from "../components/LoginButton";
import TagInput from "../components/TagInput";
import { ChevronLeft, ChevronRight, Trash2, Save } from "lucide-react";
import TopNavbar from "../components/TopNavbar";
import { saveRecipe, fetchRecipeDetail } from "../api/recipeApi";
import BlocklyArea from "../components/BlocklyArea";
import { CATEGORY_ORDER } from "../blockly/catalog";

export default function MainPage() {
  // 기본 카테고리
  const [activeTab, setActiveTab] = useState(CATEGORY_ORDER[0]);

  // 저장 팝업/메타
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [recipeId, setRecipeId] = useState(null);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [recipeXml, setRecipeXml] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);

  // 변경 감지
  const lastSavedXmlRef = useRef("");
  const [isDirty, setIsDirty] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const blocklyRef = useRef(null);

  // 상세 진입 시 로드
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadRecipeDetail(id);
    if (!id) {
      lastSavedXmlRef.current = "";
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadRecipeDetail = async (id) => {
    try {
      const data = await fetchRecipeDetail(id); // { _id, title, description, xml, tags }
      setRecipeId(data._id || null);
      setRecipeTitle(data.title || "");
      setRecipeDescription(data.description || "");
      setTags((data.tags || []).map((t) => `#${t}`));
      const xml = data.xml || "";
      setRecipeXml(xml);
      blocklyRef.current?.loadXml(xml);
      lastSavedXmlRef.current = xml;
      setIsDirty(false);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
      console.error("서버 응답 바디:", err?.response?.data);
      alert("레시피 불러오기에 실패했습니다.");
    }
  };

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
      lastSavedXmlRef.current = xml;
      setIsDirty(false);
      alert("레시피가 저장되었습니다!");
      setShowSavePopup(false);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("레시피 저장 중 오류가 발생했습니다.");
    }
  };

  const handleXmlChange = (xml) => {
    setRecipeXml(xml);
    setIsDirty(xml !== lastSavedXmlRef.current);
  };

  // 새로고침/창닫기 가드
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // 내부 라우팅/뒤로가기 가드
  useEffect(() => {
    const onDocumentClick = (e) => {
      if (!isDirty) return;
      const anchor = e.target.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (/^https?:\/\//i.test(href)) return; // 외부 링크는 패스

      e.preventDefault();
      const ok = window.confirm(
        "이 페이지를 벗어나면 현재 구성 중인 블록이 저장되지 않을 수 있어요. 이동하시겠습니까?"
      );
      if (ok) navigate(href);
    };

    const onPopState = () => {
      if (!isDirty) return;
      const ok = window.confirm(
        "이 페이지를 벗어나면 현재 구성 중인 블록이 저장되지 않을 수 있어요. 이동하시겠습니까?"
      );
      if (!ok) {
        // 🔧 ESLint 회피: 전역 history 대신 window.history 사용
        window.history.go(1);
        // 또는 navigate(1);
      }
    };

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [isDirty, navigate]);

  // 휴지통 왼쪽 세로 버튼 스택
  const buttonStackStyle = useMemo(
    () => ({
      position: "absolute",
      right: "70px",
      bottom: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      alignItems: "center",
      zIndex: 3,
    }),
    []
  );

  const iconButtonClass =
    "p-2 rounded-lg bg-white shadow border border-gray-200 hover:shadow-md hover:border-gray-300 cursor-pointer";

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNavbar />

      <div className="flex flex-row flex-1">
        {/* 왼쪽 카테고리 버튼 */}
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

        {/* Blockly 영역 */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl overflow-hidden">
            <BlocklyArea
              ref={blocklyRef}
              initialXml={recipeXml}
              onXmlChange={handleXmlChange}
              activeCategory={activeTab}
              horizontalScroll={false}
            />
          </div>

          {/* 휴지통 왼쪽 버튼들: Undo / Redo / Delete / Save */}
          <div style={buttonStackStyle}>
            <ChevronLeft
              className={`${iconButtonClass} text-orange-400`}
              title="되돌리기"
              onClick={() => blocklyRef.current?.undo()}
            />
            <ChevronRight
              className={`${iconButtonClass} text-orange-400`}
              title="다시하기"
              onClick={() => blocklyRef.current?.redo()}
            />
            <Trash2
              className={`${iconButtonClass} text-orange-400`}
              title="전체 삭제"
              onClick={() => {
                if (window.confirm("현재 레시피 블록을 모두 지울까요?")) {
                  blocklyRef.current?.clear();
                  setIsDirty(true);
                }
              }}
            />
            <Save
              className={`${iconButtonClass} text-orange-400`}
              title="저장"
              onClick={() => setShowSavePopup(true)}
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
            {titleError && (
              <p className="text-red-500 text-sm mb-2">제목을 입력해주세요.</p>
            )}
            <textarea
              placeholder="설명"
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-2 resize-none"
            />
            <TagInput tags={tags} setTags={setTags} />
            {tagsError && (
              <p className="text-red-500 text-sm mt-2">태그를 하나 이상 입력해주세요.</p>
            )}
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

















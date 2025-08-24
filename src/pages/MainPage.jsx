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
  // 기본 카테고리: catalog의 첫 항목
  const [activeTab, setActiveTab] = useState(CATEGORY_ORDER[0]);

  const [showSavePopup, setShowSavePopup] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [recipeXml, setRecipeXml] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);

  // ✅ 상세/수정 모드 지원
  const [recipeId, setRecipeId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const blocklyRef = useRef(null);

  // ✅ “변경됨 감지”를 위한 원본 XML 기억 + 더티 플래그
  const lastSavedXmlRef = useRef("");
  const [isDirty, setIsDirty] = useState(false);

  // 상세 진입 시 XML/메타 로드
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadRecipeDetail(id);
    // 새 레시피면 초기 상태이므로 더티 X
    if (!id) {
      lastSavedXmlRef.current = "";
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadRecipeDetail = async (id) => {
    try {
      const data = await fetchRecipeDetail(id); // { _id, title, description, xml, tags, ... }
      setRecipeId(data._id || null);
      setRecipeTitle(data.title || "");
      setRecipeDescription(data.description || "");
      setTags((data.tags || []).map((t) => `#${t}`));
      const xml = data.xml || "";
      setRecipeXml(xml);

      // 워크스페이스 로드
      blocklyRef.current?.loadXml(xml);

      // 현재 불러온 상태를 "저장본"으로 기억 → 더티 OFF
      lastSavedXmlRef.current = xml;
      setIsDirty(false);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
      console.error("서버 응답 바디:", err?.response?.data);
      alert("레시피 불러오기에 실패했습니다.");
    }
  };

  // 저장
  const handleSave = async () => {
    if (!recipeTitle.trim()) setTitleError(true);
    else setTitleError(false);
    if (tags.length === 0) setTagsError(true);
    else setTagsError(false);
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

      // ✅ 저장 성공 → 저장본 기준 업데이트 + 더티 OFF
      lastSavedXmlRef.current = xml;
      setIsDirty(false);

      alert("레시피가 저장되었습니다!");
      setShowSavePopup(false);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("레시피 저장 중 오류가 발생했습니다.");
    }
  };

  // ✅ XML이 바뀌면 더티 상태로
  const handleXmlChange = (xml) => {
    setRecipeXml(xml);
    setIsDirty(xml !== lastSavedXmlRef.current);
  };

  // ✅ 1) 새로고침/창 닫기 가드
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      // Chrome 요구사항: returnValue 설정
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ✅ 2) 내부 네비게이션 가드 (a 태그 클릭 / router 링크 클릭)
  useEffect(() => {
    const onDocumentClick = (e) => {
      if (!isDirty) return;
      // a[href]를 찾는다
      const anchor = e.target.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // 외부 링크면 패스
      if (/^https?:\/\//i.test(href)) return;

      // SPA 내부 라우팅 → 중단하고 확인창
      e.preventDefault();
      const ok = window.confirm(
        "이 페이지를 벗어나면 현재 구성 중인 블록이 저장되지 않을 수 있어요. 이동하시겠습니까?"
      );
      if (ok) navigate(href);
    };

    const onPopState = (e) => {
      if (!isDirty) return;
      const ok = window.confirm(
        "이 페이지를 벗어나면 현재 구성 중인 블록이 저장되지 않을 수 있어요. 이동하시겠습니까?"
      );
      if (!ok) {
        // 사용자가 취소하면 앞으로 다시 이동(되돌림)
        history.go(1);
      }
    };

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [isDirty, navigate]);

  // ✅ 우하단 버튼 묶음: “휴지통 왼쪽” 세로 배치
  const buttonStackStyle = useMemo(
    () => ({
      position: "absolute",
      right: "70px", // 휴지통이 보통 12px 여백 → 살짝 왼쪽에 버튼 군 배치
      bottom: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      alignItems: "center",
      zIndex: 3,
    }),
    []
  );

  // 공용 아이콘 버튼 스타일(클릭 영역 명확)
  const iconButtonClass =
    "p-2 rounded-lg bg-white shadow border border-gray-200 hover:shadow-md hover:border-gray-300 cursor-pointer";

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
              onXmlChange={handleXmlChange}
              activeCategory={activeTab}
              // ✅ 가로 스크롤 숨김 유지(이전 요구사항 반영 상태)
              horizontalScroll={false}
            />
          </div>

          {/* ✅ 휴지통 왼쪽에 세로 버튼 스택 (Undo / Redo / Delete / Save) */}
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
                  // 삭제 후 현재 상태는 저장 안됨 → 더티 ON
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















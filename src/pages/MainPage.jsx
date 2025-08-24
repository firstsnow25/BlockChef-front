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
  const [recipeId, setRecipeId] = useState(null);        // 기존 레시피 수정용 id (_id)
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [recipeXml, setRecipeXml] = useState("");        // 현재 워크스페이스 XML
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);

  // ✅ 블럭이 1개 이상 있으면 true (저장 여부와 무관)
  const [isDirty, setIsDirty] = useState(false);

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

      // 불러온 직후엔 작업영역 상태 기준으로 dirty 계산 (일단 xml에 블럭 있으면 true)
      try {
        const doc = new DOMParser().parseFromString(xml || "<xml/>", "text/xml");
        const hasBlocks = doc.getElementsByTagName("block").length > 0;
        setIsDirty(hasBlocks);
      } catch {
        setIsDirty(false);
      }
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
      console.error("서버 응답 바디:", err?.response?.data);
      alert("레시피 불러오기에 실패했습니다.");
    }
  };

  // ✅ XML 변경 시: 블럭이 하나라도 있으면 무조건 dirty = true
  const handleXmlChange = (xml) => {
    setRecipeXml(xml);
    try {
      const doc = new DOMParser().parseFromString(xml || "<xml/>", "text/xml");
      const hasBlocks = doc.getElementsByTagName("block").length > 0;
      setIsDirty(hasBlocks);
    } catch {
      setIsDirty(false);
    }
  };

  // 새로고침/탭 닫기 방지
  useEffect(() => {
    const beforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  // 라우팅 이동 전에 확인 (내부 네비게이션 버튼 등에서 호출)
  const confirmLeaveIfDirty = async (to) => {
    if (!isDirty) {
      navigate(to);
      return;
    }
    const ok = window.confirm(
      "현재 작업 중인 블럭이 있습니다. 저장하지 않고 이동하면 작업이 초기화됩니다.\n정말 이동하시겠습니까?"
    );
    if (ok) navigate(to);
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
        _id: recipeId,                      // 있으면 수정, 없으면 신규
        title: recipeTitle,
        description: recipeDescription,
        tags: cleanedTags,
        xml,                                // api 레이어에서 blockStructure로 매핑됨
      });

      alert("레시피가 저장되었습니다!");
      setShowSavePopup(false);
      // 저장 이후에도 “블럭이 존재하면” 여전히 dirty 기준은 true가 될 수 있음
      // 여기서는 저장 직후에도 블럭 존재 여부 기준을 유지
      try {
        const doc = new DOMParser().parseFromString(xml || "<xml/>", "text/xml");
        const hasBlocks = doc.getElementsByTagName("block").length > 0;
        setIsDirty(hasBlocks);
      } catch {
        setIsDirty(false);
      }
    } catch (err) {
      console.error("저장 실패:", err);
      console.error("서버 응답 바디:", err?.response?.data);
      alert("레시피 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* TopNavbar의 메뉴로 이동할 때도 dirty 확인을 거치고 싶다면
          TopNavbar에 콜백을 내려보내서 사용하면 됩니다.
          여기서는 기본 컴포넌트 그대로 사용하고,
          사용자분이 좌측 버튼이나 자체 내비를 누르기 전에 저장 안내를 받도록
          별도의 '나의 레시피로' 같은 버튼을 추가하고 confirmLeaveIfDirty를 호출해도 됩니다. */}
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

          {/* 예시: 내부 네비를 dirty 확인과 함께 이동시키고 싶다면 */}
          <div className="mt-6">
            <LoginButton
              text="나의 레시피"
              onClick={() => confirmLeaveIfDirty("/my")}
              className="w-full my-1"
            />
          </div>
        </div>

        {/* ➡️ Blockly 워크스페이스 (팔레트 + 작업영역) */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl overflow-hidden">
            <BlocklyArea
              ref={blocklyRef}
              initialXml={recipeXml}
              onXmlChange={handleXmlChange}     // ✅ 블럭 존재 여부로 dirty 관리
              activeCategory={activeTab}
            />
          </div>

          {/* 우하단 툴 버튼 (디자인/아이콘은 기존 그대로, 좌우 배치 유지) */}
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
                  // 모두 지우면 dirty도 false가 되도록 동기화
                  setRecipeXml("");
                  setIsDirty(false);
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


















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

  // ✅ 블록이 1개라도 있으면 true (저장 여부와 무관)
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
      const data = await fetchRecipeDetail(id); // { _id, title, description, xml, tags }
      setRecipeId(data._id || null);
      setRecipeTitle(data.title || "");
      setRecipeDescription(data.description || "");
      setTags((data.tags || []).map((t) => `#${t}`));
      const xml = data.xml || "";
      setRecipeXml(xml);
      blocklyRef.current?.loadXml(xml);

      // 불러온 XML에도 블록이 있으면 dirty
      try {
        const doc = new DOMParser().parseFromString(xml || "<xml/>", "text/xml");
        setIsDirty(doc.getElementsByTagName("block").length > 0);
      } catch {
        setIsDirty(false);
      }
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
      console.error("서버 응답 바디:", err?.response?.data);
      alert("레시피 불러오기에 실패했습니다.");
    }
  };

  // ✅ XML 변경 들어올 때마다 “블록 존재 여부”로 dirty 갱신
  const handleXmlChange = (xml) => {
    setRecipeXml(xml);
    try {
      const doc = new DOMParser().parseFromString(xml || "<xml/>", "text/xml");
      setIsDirty(doc.getElementsByTagName("block").length > 0);
    } catch {
      setIsDirty(false);
    }
  };

  // ✅ (1) 새로고침/탭닫기 방지
  useEffect(() => {
    const beforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = ""; // 크롬 요구
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  // ✅ (1) 내부 링크/라우팅 방지 (Link/anchor, 뒤로가기 포함)
  useEffect(() => {
    const msg =
      "현재 작업 중인 블럭이 있습니다. 저장하지 않고 이동하면 작업이 초기화됩니다.\n정말 이동하시겠습니까?";

    // a 링크 클릭 가로채기 (캡처 단계)
    const onLinkClickCapture = (e) => {
      if (!isDirty) return;
      let el = e.target;
      while (el && el !== document.body) {
        if (el.tagName === "A" && el.href) {
          const url = new URL(el.href);
          const sameOrigin = url.origin === window.location.origin;
          const changingPath = url.pathname !== window.location.pathname;
          if (sameOrigin && changingPath) {
            const ok = window.confirm(msg);
            if (!ok) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation?.();
            }
          }
          break;
        }
        el = el.parentElement;
      }
    };
    document.addEventListener("click", onLinkClickCapture, true);

    // 뒤로가기/앞으로가기
    const onPopState = () => {
      if (!isDirty) return;
      const ok = window.confirm(msg);
      if (!ok) {
        // 되돌리기 취소
        window.history.go(1);
      }
    };
    window.addEventListener("popstate", onPopState);

    // pushState/replaceState 패치 (TopNavbar가 programmatic navigate일 때 대비)
    /* eslint-disable no-restricted-globals */
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);
    window.history.pushState = function (state, title, url) {
      if (!isDirty || window.confirm(msg)) return origPush(state, title, url);
      return null;
    };
    window.history.replaceState = function (state, title, url) {
      if (!isDirty || window.confirm(msg)) return origReplace(state, title, url);
      return null;
    };
    /* eslint-enable no-restricted-globals */

    return () => {
      document.removeEventListener("click", onLinkClickCapture, true);
      window.removeEventListener("popstate", onPopState);
      /* eslint-disable no-restricted-globals */
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      /* eslint-enable no-restricted-globals */
    };
  }, [isDirty]);

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

      // 저장 후에도 “블록이 있으면” 여전히 dirty 유지
      try {
        const doc = new DOMParser().parseFromString(xml || "<xml/>", "text/xml");
        setIsDirty(doc.getElementsByTagName("block").length > 0);
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
      <TopNavbar />

      <div className="flex flex-row flex-1">
        {/* ⬅️ 카테고리 버튼 */}
        <div className="w-[120px] border-r border-gray-200 p-2">
          {CATEGORY_ORDER.map((tab) => (
            <LoginButton
              key={tab}
              text={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full my-1 ${activeTab === tab ? "bg-orange-400" : ""}`}
            />
          ))}
          {/* 내부 네비 버튼 예시 (확인 후 이동) */}
          <div className="mt-6">
            <LoginButton
              text="나의 레시피"
              onClick={() => navigate("/my")}
              className="w-full my-1"
            />
          </div>
        </div>

        {/* ➡️ Blockly 영역 */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4 border-2 border-gray-300 bg-white rounded-xl overflow-hidden">
            <BlocklyArea
              ref={blocklyRef}
              initialXml={recipeXml}
              onXmlChange={handleXmlChange}
              activeCategory={activeTab}
            />
          </div>

          {/* ✅ 우하단 아이콘: 기존 디자인 유지 + 가로정렬 + 쓰레기통 왼쪽으로 이동 */}
          {/* 쓰레기통이 우하단에 있으므로 여유를 두고 오른쪽을 96px 띄움 */}
          <div className="absolute bottom-[20px] right-[96px] flex flex-row gap-4 items-center z-10 pointer-events-auto">
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






















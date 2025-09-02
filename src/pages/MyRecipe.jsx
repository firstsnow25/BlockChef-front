// src/pages/MyRecipe.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import GeneralButton from "../components/GeneralButton";
import { fetchMyRecipes, deleteRecipe } from "../api/recipeApi";
import TopNavbar from "../components/TopNavbar";

export default function MyRecipe() {
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // ✅ 초기: 아무것도 선택 안 함
  const [allTags, setAllTags] = useState([]);
  const [recipeData, setRecipeData] = useState([]);
  const navigate = useNavigate();

  const TestMode = false;

  // ✅ 태그 재계산 (선택 자동설정 제거)
  const recomputeTags = useCallback((recipes) => {
    const tagSet = new Set();
    recipes.forEach((r) => (r.tags || []).forEach((t) => tagSet.add(t)));
    const newAll = Array.from(tagSet);
    setAllTags(newAll);

    // 이미 선택돼있던 것 중 사라진 태그만 제거 (추가 선택/자동 선택 없음)
    setSelectedTags((prev) => prev.filter((t) => newAll.includes(t)));
  }, []);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        let data;
        if (TestMode) {
          data = [
            { _id: "1", title: "김치찌개", tags: ["찌개", "매운맛"] },
            { _id: "2", title: "된장찌개", tags: ["찌개"] },
            { _id: "3", title: "감자튀김", tags: ["튀김"] },
          ];
        } else {
          data = await fetchMyRecipes();
        }
        setRecipeData(data);
        recomputeTags(data);
      } catch (error) {
        console.error("레시피 불러오기 실패:", error);
      }
    };
    loadRecipes();
  }, [recomputeTags]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const handleDelete = async (_id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      if (!TestMode) await deleteRecipe(_id);
      const next = recipeData.filter((r) => r._id !== _id);
      setRecipeData(next);
      recomputeTags(next);
      alert("삭제되었습니다.");
    } catch (err) {
      alert("삭제 실패");
    }
  };

  // ✅ 선택된 태그가 없을 때는 제목 가나다(ko-KR) 정렬
  const visibleRecipes = useMemo(() => {
    const base = recipeData.filter((recipe) =>
      selectedTags.length === 0
        ? true
        : recipe.tags?.some((tag) => selectedTags.includes(tag))
    );
    if (selectedTags.length === 0) {
      return [...base].sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "ko-KR")
      );
    }
    return base;
  }, [recipeData, selectedTags]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNavbar activeMenu="my" />

      {/* 본문 */}
      <div className="flex px-6 py-8 gap-6">
        {/* 태그 사이드바 */}
        <aside className="w-[260px] bg-white rounded-xl shadow p-4 flex flex-col">
          <h2 className="text-[#f4b062] text-xl font-semibold mb-4"># 태그</h2>
          <InputField
            placeholder="태그 검색"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            className="mb-2"
          />
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[200px] mb-3">
            {filteredTags.map((tag) => (
              <GeneralButton
                key={tag}
                text={tag}
                active={selectedTags.includes(tag)} // ✅ 활성화 시 오렌지색(컴포넌트 스타일 유지)
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
          <button
            onClick={() => setSelectedTags([...allTags])}
            className="text-[#ff951c] text-sm mt-2 text-left"
          >
            전체 선택하기
          </button>
          <button
            onClick={() => setSelectedTags([])}
            className="text-[#ff951c] text-sm text-left"
          >
            전체 해제하기
          </button>
        </aside>

        {/* 레시피 영역 */}
        <section className="flex-1 bg-white rounded-xl shadow px-6 py-4">
          <div className="mb-4">
            <h3 className="text-[#ff951c] text-sm mb-2">선택된 태그 :</h3>
            <div className="flex gap-3 flex-wrap">
              {selectedTags.map((tag) => (
                <span key={tag} className="text-[#f4b062] font-semibold">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {visibleRecipes.map((recipe) => (
              <div key={recipe._id}>
                <h4 className="text-[#ff951c] text-sm mb-2">제목: {recipe.title}</h4>
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded">
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/main?id=${recipe._id}`)}
                  >
                    <p className="text-[17px] font-semibold">{recipe.title}</p>
                    <p className="text-sm text-[#ff951c]">
                      {(recipe.tags || []).map((tag) => `#${tag}`).join(" ")}
                    </p>
                  </div>
                  <button
                    className="text-sm text-red-400 border border-red-300 px-2 py-1 rounded"
                    onClick={() => handleDelete(recipe._id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}









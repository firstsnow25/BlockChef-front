// src/pages/MyRecipe.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import blockChefImage from "../assets/block_chef.png";
import InputField from "../components/InputField";
import GeneralButton from "../components/GeneralButton";
import { fetchMyRecipes, deleteRecipe } from "../api/recipeApi";

export default function MyRecipe() {
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [recipeData, setRecipeData] = useState([]);
  const [activeMenu, setActiveMenu] = useState("my");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  // 레시피 목록 불러오기
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await fetchMyRecipes();
        setRecipeData(data);

        // 태그 추출
        const tagSet = new Set();
        data.forEach((recipe) => {
          recipe.tags.forEach((tag) => tagSet.add(tag));
        });
        setAllTags(Array.from(tagSet));
        setSelectedTags(Array.from(tagSet)); // 기본 전체 선택
      } catch (error) {
        console.error("레시피 불러오기 실패:", error);
      }
    };
    loadRecipes();
  }, []);

  // 태그 토글
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 상단 내비게이션 핸들링
  const handleTopNav = (menu) => {
    setActiveMenu(menu);
    setShowProfileMenu(false);
    if (menu === "main") navigate("/main");
  };

  // 삭제 핸들러
  const handleDelete = async (id) => {
    const confirmed = window.confirm("이 레시피를 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await deleteRecipe(id);
      setRecipeData((prev) => prev.filter((r) => r.id !== id));
      alert("레시피가 삭제되었습니다.");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("레시피 삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 상단 내비게이션 */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200 relative bg-white">
        <div className="flex items-center">
          <img src={blockChefImage} alt="BlockChef" className="w-8 h-8 mr-2" />
          <span className="text-xl font-semibold text-orange-500">BlockChef</span>
        </div>
        <div className="flex gap-6 text-sm items-center">
          <button
            onClick={() => handleTopNav("main")}
            className={`${activeMenu === "main" ? "text-orange-500 font-semibold" : "text-black"}`}
          >
            레시피 만들기
          </button>
          <span>|</span>
          <button
            onClick={() => handleTopNav("my")}
            className={`${activeMenu === "my" ? "text-orange-500 font-semibold" : "text-black"}`}
          >
            나의 레시피
          </button>
          <span>|</span>
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu("chef");
                setShowProfileMenu((prev) => !prev);
              }}
              className={`${activeMenu === "chef" ? "text-orange-500 font-semibold" : "text-black"}`}
            >
              Chef ▾
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md z-10 py-4">
                <div className="absolute top-[-8px] right-6 w-4 h-4 bg-white border-l border-t border-gray-300 rotate-45"></div>
                <p className="text-center font-semibold mb-4">Chef</p>
                <div className="flex justify-around">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/my-info");
                    }}
                    className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm"
                  >
                    내 정보
                  </button>
                  <button className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm">로그아웃</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                active={selectedTags.includes(tag)}
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

          {/* 레시피 목록 */}
          <div className="flex flex-col gap-8">
            {recipeData
              .filter((recipe) => recipe.tags.some((tag) => selectedTags.includes(tag)))
              .map((recipe, idx) => (
                <div key={idx}>
                  <h4 className="text-[#ff951c] text-sm mb-2">제목: {recipe.title}</h4>
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded">
                    <div onClick={() => navigate(`/main?id=${recipe.id}`)} className="cursor-pointer">
                      <p className="text-[17px] font-semibold">{recipe.title}</p>
                      <p className="text-sm text-[#ff951c]">
                        {recipe.tags.map((tag) => `#${tag}`).join(" ")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      className="text-red-500 text-sm border border-red-300 rounded px-2 py-1"
                    >
                      삭제하기
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




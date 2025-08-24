// src/api/recipeApi.js
import axiosInstance from "./axiosInstance";


// 내 레시피 목록
export const fetchMyRecipes = async () => {
  const { data } = await axiosInstance.get("/recipes/my");
  return (Array.isArray(data) ? data : []).map((r) => ({
    _id: r.id,
    title: r.title,
    description: r.description,
    tags: r.tags || [],
    updatedAt: r.updatedAt,
  }));
};

// 저장/수정 (항상 PUT /recipes)
export const saveRecipe = async ({ _id, title, description, xml, tags }) => {
  const payload = {
    // id가 있으면 수정, 없으면 생성(서버가 같은 엔드포인트에서 처리)
    ...(!!_id ? { id: _id } : {}),
    title,
    description,
    blockStructure: xml || "",
    tags: tags || [],
  };

  try {
    const { data } = await axiosInstance.put("/recipes", payload);
    return data; // string
  } catch (err) {
    // 서버가 내려준 상세 메시지를 콘솔에 그대로 보여주기
    // (Netlify 빌드 영향 없음)
    // eslint-disable-next-line no-console
    console.error(
      "❌ saveRecipe 400/에러 상세:",
      err.response?.status,
      err.response?.data
    );
    throw err;
  }
};

// 상세
export const fetchRecipeDetail = async (id) => {
  const { data } = await axiosInstance.get(`/recipes/${id}`);
  return {
    _id: data.id,
    title: data.title,
    description: data.description,
    xml: data.blockStructure || "",
    tags: data.tags || [],
    updatedAt: data.updatedAt,
  };
};

// 삭제
export const deleteRecipe = async (id) => {
  const { data } = await axiosInstance.delete(`/recipes/${id}`);
  return data; // string
};


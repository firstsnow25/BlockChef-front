// src/api/recipeApi.js
import axiosInstance from "./axiosInstance";

// 1. 내 레시피 목록 조회
export const fetchMyRecipes = async () => {
  const response = await axiosInstance.get("/recipes/my");
  return response.data;
};

// 2. 레시피 저장/수정
export const saveRecipe = async (recipeData) => {
  const response = await axiosInstance.put("/recipes", recipeData);
  return response.data;
};

// 3. 레시피 상세 조회
export const fetchRecipeDetail = async (id) => {
  const response = await axiosInstance.get(`/recipes/${id}`);
  return response.data;
};

// 4. 레시피 삭제
export const deleteRecipe = async (id) => {
  const response = await axiosInstance.delete(`/recipes/${id}`);
  return response.data;
};

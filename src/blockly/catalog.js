// src/blockly/catalog.js
// blocks.js에 정의된 타입 이름과 1:1로 "정확히" 맞춘다.

export const CATALOG = {
  // 1) 재료이름: blocks.js에서 동적 생성한 타입들 (ingredient_name_감자 등)
  "재료이름": [
    { type: "ingredient_name_감자", label: "감자" },
    { type: "ingredient_name_당근", label: "당근" },
    { type: "ingredient_name_양파", label: "양파" },
    { type: "ingredient_name_달걀", label: "달걀" },
    { type: "ingredient_name_소금", label: "소금" },
    { type: "ingredient_name_물", label: "물" },
    { type: "ingredient_name_라면사리", label: "라면사리" },
    { type: "ingredient_name_라면스프", label: "라면스프" },
    { type: "ingredient_name_대파", label: "대파" },
    { type: "ingredient_name_고추", label: "고추" },
  ],

  // 2) 재료: 이름(value) + 양/단위가 있는 value 블록 (NAME 슬롯에 위 이름 블록을 꽂아 써)
  "재료": [
    { type: "ingredient_block", label: "재료(이름+양/단위)", fields: { QUANTITY: 1, UNIT: "개" } },
  ],

  // 3) 조리단계: statement 블록 (시간 있는 동작 + 단순 동작)
  "조리단계": [
    { type: "boil_block", label: "끓이기", fields: { TIME: 5, UNIT: "분" } },
    { type: "fry_block", label: "볶기", fields: { TIME: 5, UNIT: "분" } },
    { type: "grill_block", label: "굽기", fields: { TIME: 10, UNIT: "분" } },
    { type: "deepfry_block", label: "튀기기", fields: { TIME: 3, UNIT: "분" } },
    { type: "slice_block", label: "썰기" },
    { type: "put_block", label: "넣기" },
    { type: "peel_block", label: "껍질 벗기기" },
    { type: "crack_block", label: "깨기" },
    { type: "remove_seed_block", label: "씨 제거" },
  ],

  // 4) 흐름: statement 블록
  "흐름": [
    { type: "start_block", label: "시작" },
    { type: "repeat_n_times", label: "반복", fields: { COUNT: 3 } },
    { type: "if_condition_block", label: "만약", fields: { CONDITION: "예: 물이 끓으면" } },
    { type: "repeat_until_true", label: "~까지 반복", fields: { CONDITION: "예: 면이 익을" } },
    { type: "continue_block", label: "다음으로" },
    { type: "break_block", label: "중단" },
    { type: "finish_block", label: "끝" },
  ],

  // 5) 합치기: 뮤테이터 적용된 statement 블록
  "합치기": [
    { type: "combine_block", label: "합치기" }, // 버튼 눌러 입력 수 +/-
  ],
};

// 버튼 순서
export const CATEGORY_ORDER = ["재료이름", "재료", "조리단계", "흐름", "합치기"];







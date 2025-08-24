// src/blockly/catalog.js

export const CATEGORY_ORDER = [
  "재료 이름",
  "조리 단계",
  "조리 값",
  "흐름 제어",
  "합치기",
];

const ING_NAMES = ["감자", "당근", "양파", "달걀", "소금", "물", "라면사리", "라면스프", "대파", "고추"];

export const CATALOG = {
  "재료 이름": [
    { type: "ingredient", label: "재료", template: "ingredient_block", fields: { QUANTITY: 1, UNIT: "개" } },
    ...ING_NAMES.map((n) => ({
      type: `ing_name_${n}`,
      label: n,
      template: `ingredient_name_${n}`,
      fields: {},
    })),
  ],

  "조리 단계": [
    { type: "boil_stmt", label: "끓이기", template: "boil_block", fields: { TIME: 5, UNIT: "분" } },
    { type: "fry_stmt", label: "볶기", template: "fry_block", fields: { TIME: 5, UNIT: "분" } },
    { type: "grill_stmt", label: "굽기", template: "grill_block", fields: { TIME: 10, UNIT: "분" } },
    { type: "deepfry_stmt", label: "튀기기", template: "deepfry_block", fields: { TIME: 3, UNIT: "분" } },
    { type: "slice_stmt", label: "썰기", template: "slice_block", fields: {} },
    { type: "put_stmt", label: "넣기", template: "put_block", fields: {} },
    { type: "peel_stmt", label: "껍질 벗기기", template: "peel_block", fields: {} },
    { type: "crack_stmt", label: "깨기", template: "crack_block", fields: {} },
    { type: "remove_seed_stmt", label: "씨 제거", template: "remove_seed_block", fields: {} },
  ],

  "조리 값": [
    { type: "boil_val", label: "끓이기(값)", template: "boil_value_block", fields: { TIME: 5, UNIT: "분" } },
    { type: "fry_val", label: "볶기(값)", template: "fry_value_block", fields: { TIME: 5, UNIT: "분" } },
    { type: "grill_val", label: "굽기(값)", template: "grill_value_block", fields: { TIME: 10, UNIT: "분" } },
    { type: "deepfry_val", label: "튀기기(값)", template: "deepfry_value_block", fields: { TIME: 3, UNIT: "분" } },
    { type: "slice_val", label: "썰기(값)", template: "slice_value_block", fields: {} },
    { type: "put_val", label: "넣기(값)", template: "put_value_block", fields: {} },
    { type: "peel_val", label: "껍질 벗기기(값)", template: "peel_value_block", fields: {} },
    { type: "crack_val", label: "깨기(값)", template: "crack_value_block", fields: {} },
    { type: "remove_seed_val", label: "씨 제거(값)", template: "remove_seed_value_block", fields: {} },
  ],

  "흐름 제어": [
    { type: "start", label: "시작", template: "start_block", fields: {} },
    { type: "repeat_n", label: "반복 N회", template: "repeat_n_times", fields: { COUNT: 3 } },
    { type: "repeat_until", label: "~까지 반복", template: "repeat_until_true", fields: { CONDITION: "예: 면이 익을" } },
    { type: "if_simple", label: "만약/그러면", template: "if_condition_block", fields: { CONDITION: "예: 물이 끓으면" } },
    { type: "continue", label: "다음으로", template: "continue_block", fields: {} },
    { type: "break", label: "중단", template: "break_block", fields: {} },
    { type: "finish", label: "끝", template: "finish_block", fields: {} },
  ],

  "합치기": [
    { type: "combine", label: "합치기", template: "combine_block", fields: {} },
  ],
};





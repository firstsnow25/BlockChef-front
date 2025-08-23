// src/blockly/catalog.js

export const CATEGORY_ORDER = [
  "재료 이름",
  "조리 단계",
  "조리 값",
  "흐름 제어",
  "합치기",
];

/** 재료 이름들 */
const ING_NAMES = [
  "감자", "당근", "양파", "달걀", "소금", "물",
  "라면사리", "라면스프", "대파", "고추",
];

export const CATALOG = {
  /** 1) 재료 이름 */
  "재료 이름": [
    // 재료 구성 블록(이름+양+단위)
    { type: "ingredient", label: "재료", template: "ingredient_block", fields: { QUANTITY: 1, UNIT: "개" } },
    // 개별 이름 블록들
    ...ING_NAMES.map((n) => ({
      type: `ing_name_${n}`,
      label: n,
      template: `ingredient_name_${n}`,
      fields: {},
    })),
  ],

  /** 2) 조리 단계(Statement) */
  "조리 단계": [
    // 시간 있는 단계
    ...["mix","steam","fry","boil","grill","deepfry"].map((k) => ({
      type: `${k}_stmt`, template: `${k}_block`, fields: { TIME: 5, UNIT: "분" },
    })),
    // 시간 없는 단계
    ...["slice","put","peel","crack","remove_seed"].map((k) => ({
      type: `${k}_stmt`, template: `${k}_block`, fields: {},
    })),
    // 기다리기(시간만)
    { type: "wait_stmt", template: "wait_block", fields: { TIME: 5, UNIT: "분" } },
  ],

  /** 3) 조리 값(Value) */
  "조리 값": [
    ...["mix","steam","fry","boil","grill","deepfry"].map((k) => ({
      type: `${k}_val`, template: `${k}_value_block`, fields: { TIME: 5, UNIT: "분" },
    })),
    ...["slice","put","peel","crack","remove_seed"].map((k) => ({
      type: `${k}_val`, template: `${k}_value_block`, fields: {},
    })),
  ],

  /** 4) 흐름 제어 */
  "흐름 제어": [
    { type: "start", template: "start_block", fields: {} },
    { type: "repeat_n", template: "repeat_n_times", fields: { COUNT: 3 } },
    { type: "repeat_until", template: "repeat_until_true", fields: { CONDITION: "예: 면이 익을" } },
    { type: "if_simple", template: "if_condition_block", fields: { CONDITION: "예: 물이 끓으면" } },
    { type: "continue", template: "continue_block", fields: {} },
    { type: "break", template: "break_block", fields: {} },
    { type: "finish", template: "finish_block", fields: {} },
  ],

  /** 5) 합치기 */
  "합치기": [
    { type: "combine", template: "combine_block", fields: {} },
  ],
};



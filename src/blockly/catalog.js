// src/blockly/catalog.js

export const CATEGORY_ORDER = ["재료", "조리", "조리값", "흐름"];

/** 재료 이름들 (가나다 정렬) */
const ING_NAMES_RAW = [
  "감자", "당근", "양파", "달걀", "소금", "물",
  "라면사리", "라면스프", "대파", "고추",
];
const ING_NAMES = [...ING_NAMES_RAW].sort((a, b) => a.localeCompare(b, "ko"));

/** 동작 한글 라벨 */
const KO_LABELS = {
  mix: "섞기",
  steam: "찌기",
  fry: "볶기",
  boil: "끓이기",
  grill: "굽기",
  deepfry: "튀기기",
  slice: "썰기",
  put: "넣기",
  peel: "껍질 벗기기",
  crack: "깨기",
  remove_seed: "씨 제거하기",
  wait: "기다리기",
};

export const CATALOG = {
  /** 1) 재료 */
  "재료": [
    { type: "ingredient", label: "재료", template: "ingredient_block", fields: { QUANTITY: 1, UNIT: "개" } },
    ...ING_NAMES.map((n) => ({
      type: `ing_name_${n}`,
      label: n,
      template: `ingredient_name_${n}`,
      fields: {},
    })),
  ],

  /** 2) 조리(Statement) */
  "조리": [
    ...["mix","steam","fry","boil","grill","deepfry"].map((k) => ({
      type: `${k}_stmt`,
      label: KO_LABELS[k],
      template: `${k}_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),
    ...["slice","put","peel","crack","remove_seed"].map((k) => ({
      type: `${k}_stmt`,
      label: KO_LABELS[k],
      template: `${k}_block`,
      fields: {},
    })),
    { type: "wait_stmt", label: KO_LABELS.wait, template: "wait_block", fields: { TIME: 5, UNIT: "분" } },
  ],

  /** 3) 조리값(Value) */
  "조리값": [
    ...["mix","steam","fry","boil","grill","deepfry"].map((k) => ({
      type: `${k}_val`,
      label: KO_LABELS[k],
      template: `${k}_value_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),
    ...["slice","put","peel","crack","remove_seed"].map((k) => ({
      type: `${k}_val`,
      label: KO_LABELS[k],
      template: `${k}_value_block`,
      fields: {},
    })),
  ],

  /** 4) 흐름 */
  "흐름": [
    { type: "start", label: "시작", template: "start_block", fields: {} },
    { type: "repeat_n", label: "반복 (N회)", template: "repeat_n_times", fields: { COUNT: 3 } },
    { type: "repeat_until", label: "반복 (조건까지)", template: "repeat_until_true", fields: { CONDITION: "예: 면이 익을" } },
    { type: "if_simple", label: "만약 ~ 라면", template: "if_condition_block", fields: { CONDITION: "예: 물이 끓으면" } },
    { type: "continue", label: "계속하기", template: "continue_block", fields: {} },
    { type: "break", label: "종료하기", template: "break_block", fields: {} },
    { type: "finish", label: "완료", template: "finish_block", fields: {} },
  ],
};







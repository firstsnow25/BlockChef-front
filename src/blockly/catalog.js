export const CATEGORY_ORDER = ["재료", "조리", "조리값", "흐름"];

// 재료 이름 (가나다)
const ING_NAMES = [
  "김치",
  "식용유",
  "밥",
  "간장",
  "버터",
  "라면사리",
  "라면스프",
  "물",
  "소금",
  "김가루",
  "김밥용 단무지",
].sort((a, b) => a.localeCompare(b, "ko-KR"));

// 동작
const ACTIONS_WITH_TIME = ["mix", "fry", "boil", "simmer"];
const ACTIONS_WITHOUT_TIME = ["slice", "put", "grind"];

export const CATALOG = {
  "재료": [
    { type: "ingredient", label: "재료", template: "ingredient_block", fields: { QUANTITY: 1, UNIT: "개" } },
    ...ING_NAMES.map((n) => ({
      type: `ing_name_${n}`,
      label: n,
      template: `ingredient_name_${n}`,
      fields: {},
    })),
    { type: "combine_val", label: "합치기", template: "combine_block", fields: {} },
  ],

  "조리": [
    ...ACTIONS_WITH_TIME.map((k) => ({
      type: `${k}_stmt`,
      label: k,
      template: `${k}_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),
    ...ACTIONS_WITHOUT_TIME.map((k) => ({
      type: `${k}_stmt`,
      label: k,
      template: `${k}_block`,
      fields: {},
    })),
    { type: "wait_stmt", label: "wait", template: "wait_block", fields: { TIME: 5, UNIT: "분" } },
    // 동작 합치기 블록 추가
    { type: "action_combine", label: "동작 합치기", template: "action_combine_block", fields: {} },
  ],

  "조리값": [
    ...ACTIONS_WITH_TIME.map((k) => ({
      type: `${k}_val`,
      label: k,
      template: `${k}_value_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),
    ...ACTIONS_WITHOUT_TIME.map((k) => ({
      type: `${k}_val`,
      label: k,
      template: `${k}_value_block`,
      fields: {},
    })),
  ],

  "흐름": [
    { type: "start", template: "start_block", fields: {} },
    { type: "repeat_n", template: "repeat_n_times", fields: { COUNT: 3 } },
    { type: "repeat_until", template: "repeat_until_true", fields: { CONDITION: "예: 면이 익을" } },
    { type: "if_simple", template: "if_condition_block", fields: { CONDITION: "예: 물이 끓으면" } },
    { type: "continue", template: "continue_block", fields: {} },
    { type: "break", template: "break_block", fields: {} },
    { type: "finish", template: "finish_block", fields: {} },
  ],
};












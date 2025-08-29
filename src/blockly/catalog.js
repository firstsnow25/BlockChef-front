export const CATEGORY_ORDER = ["재료", "조리", "조리값", "흐름"];

// 가나다 정렬된 재료 이름 (현재 사양 반영)
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

// 시간 있는 동작 (정의된 것만!)
const ACTIONS_WITH_TIME = ["mix", "fry", "boil", "simmer"];
// 시간 없는 동작 (정의된 것만!)
const ACTIONS_WITHOUT_TIME = ["slice", "put", "grind"];

export const CATALOG = {
  "재료": [
    // 재료 계량 블록 (ING)
    { type: "ingredient", label: "재료", template: "ingredient_block", fields: { QUANTITY: 1, UNIT: "개" } },
    // 재료 이름들 (ING_NAME)
    ...ING_NAMES.map((n) => ({
      type: `ing_name_${n}`,
      label: n,
      template: `ingredient_name_${n}`,
      fields: {},
    })),
    // 합치기 (ING)
    { type: "combine_val", label: "합치기", template: "combine_block", fields: {} },
  ],

  "조리": [
    // 시간 있는 동작: statement 버전
    ...ACTIONS_WITH_TIME.map((k) => ({
      type: `${k}_stmt`,
      label: k,
      template: `${k}_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),
    // 시간 없는 동작: statement 버전
    ...ACTIONS_WITHOUT_TIME.map((k) => ({
      type: `${k}_stmt`,
      label: k,
      template: `${k}_block`,
      fields: {},
    })),
    // wait는 statement만 존재 (value 버전 절대 추가 X)
    { type: "wait_stmt", label: "wait", template: "wait_block", fields: { TIME: 5, UNIT: "분" } },
  ],

  "조리값": [
    // 시간 있는 동작: value 버전
    ...ACTIONS_WITH_TIME.map((k) => ({
      type: `${k}_val`,
      label: k,
      template: `${k}_value_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),
    // 시간 없는 동작: value 버전
    ...ACTIONS_WITHOUT_TIME.map((k) => ({
      type: `${k}_val`,
      label: k,
      template: `${k}_value_block`,
      fields: {},
    })),
    // 합치기 값 블록은 "재료" 카테고리에 넣었으니 여기선 중복 안 넣음
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










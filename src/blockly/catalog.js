// src/blockly/catalog.js
export const CATEGORY_ORDER = ["재료", "조리", "조리값", "흐름"];

/** =========================
 * 재료 이름(ING_NAME) 목록 — 가나다 정렬
 * 분류는 blocks.js/semantics.js에서 처리 (solid/liquid/oil/powder)
 * ========================= */
const ING_NAMES = [
  "간장",
  "김가루",
  "김밥용 단무지",
  "김치",
  "물",
  "밥",
  "버터",
  "소금",
  "식용유",
  "라면사리",
  "라면스프",
].sort((a, b) => a.localeCompare(b, "ko-KR"));

export const CATALOG = {
  /** =========================
   * 재료
   *  - '재료' 계량 블록
   *  - 각 재료 이름(ING_NAME)
   *  - 재료 여러 개를 하나로 만드는 '합치기'
   * ========================= */
  "재료": [
    { type: "ingredient", label: "재료", template: "ingredient_block", fields: { QUANTITY: 1, UNIT: "개" } },
    ...ING_NAMES.map((n) => ({
      type: `ing_name_${n}`,
      label: n,
      template: `ingredient_name_${n}`,
      fields: {},
    })),
    { type: "combine", label: "합치기", template: "combine_block", fields: {} },
  ],

  /** =========================
   * 조리(Statement)
   *  - 시간 있는 동작: 볶기(fry), 끓이기(boil), 삶기(simmer), 섞기(mix)
   *  - 시간 없는 동작: 자르기(slice), 넣기(put), 갈기(grind)
   *  - 대기(wait)
   * ========================= */
  "조리": [
    // 시간 있는 동작
    ...[
      { key: "fry", label: "볶기" },
      { key: "boil", label: "끓이기" },
      { key: "simmer", label: "삶기" },
      { key: "mix", label: "섞기" },
    ].map(({ key, label }) => ({
      type: `${key}_stmt`,
      label,
      template: `${key}_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),

    // 시간 없는 동작
    ...[
      { key: "slice", label: "자르기" },
      { key: "put", label: "넣기" },
      { key: "grind", label: "갈기" },
    ].map(({ key, label }) => ({
      type: `${key}_stmt`,
      label,
      template: `${key}_block`,
      fields: {},
    })),

    // 기다리기
    { type: "wait_stmt", label: "기다리기", template: "wait_block", fields: { TIME: 5, UNIT: "분" } },
  ],

  /** =========================
   * 조리값(Value)
   *  - 위와 동일한 동작들의 value 버전
   * ========================= */
  "조리값": [
    // 시간 있는 동작 (value)
    ...[
      { key: "fry", label: "볶기" },
      { key: "boil", label: "끓이기" },
      { key: "simmer", label: "삶기" },
      { key: "mix", label: "섞기" },
    ].map(({ key, label }) => ({
      type: `${key}_val`,
      label,
      template: `${key}_value_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),

    // 시간 없는 동작 (value)
    ...[
      { key: "slice", label: "자르기" },
      { key: "put", label: "넣기" },
      { key: "grind", label: "갈기" },
    ].map(({ key, label }) => ({
      type: `${key}_val`,
      label,
      template: `${key}_value_block`,
      fields: {},
    })),
  ],

  /** =========================
   * 흐름 (기존 그대로)
   * ========================= */
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









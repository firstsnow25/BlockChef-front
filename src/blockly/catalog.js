// src/blockly/catalog.js
// HTML 데모와 동일한 타입을 사용하도록 매핑
export const CATALOG = {
  재료: [
    // 재료 이름 값 블록들
    ...["감자","당근","양파","달걀","소금","물","라면사리","라면스프","대파","고추"].map((n) => ({
      type: `ing_name_${n}`,           // 내부 관리용 별칭 (UI엔 영향 없음)
      label: n,
      template: `ingredient_name_${n}`, // 실제 블록 타입
      fields: {},
    })),
    // 재료 구성 블록 (이름 + 양 + 단위)
    {
      type: "ingredient",
      label: "재료",
      template: "ingredient_block",
      fields: { QUANTITY: 1, UNIT: "개" },
    },
  ],

  동작: [
    // 시간 있는 동작 (statement)
    ...["mix","steam","fry","boil","grill","deepfry"].map((k) => ({
      type: `${k}_stmt`,
      label: k,
      template: `${k}_block`,
      fields: { TIME: 5, UNIT: "분" },
    })),
    // 시간 없는 동작 (statement)
    ...["slice","put","peel","crack","remove_seed"].map((k) => ({
      type: `${k}_stmt`,
      label: k,
      template: `${k}_block`,
      fields: {},
    })),
    // 기다리기
    { type: "wait_stmt", label: "기다리기", template: "wait_block", fields: { TIME: 5, UNIT: "분" } },

    // 합치기(value, 뮤테이터)
    { type: "combine", label: "합치기", template: "combine_block", fields: {} },
  ],

  흐름: [
    { type: "start",  label: "시작", template: "start_block", fields: {} },
    { type: "repeat_n", label: "반복 N회", template: "repeat_n_times", fields: { COUNT: 3 } },
    { type: "repeat_until", label: "조건까지 반복", template: "repeat_until_true", fields: { CONDITION: "예: 면이 익을" } },
    { type: "if_simple", label: "만약", template: "if_condition_block", fields: { CONDITION: "예: 물이 끓으면" } },
    { type: "continue", label: "계속", template: "continue_block", fields: {} },
    { type: "break", label: "종료", template: "break_block", fields: {} },
    { type: "finish", label: "완료", template: "finish_block", fields: {} },
  ],
};

export const CATEGORY_ORDER = ["재료", "동작", "흐름"];


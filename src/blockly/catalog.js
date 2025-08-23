// src/blockly/catalog.js
export const CATALOG = {
  "재료": [
    {
      type: "ing_kimchi",
      label: "김치",
      template: "ingredient_value",
      fields: { PROP: "SOLID", TAG: "KIMCHI", AMOUNT: 100, UNIT: "G" },
      lockFields: ["PROP", "TAG"],
    },
    {
      type: "ing_salt",
      label: "소금",
      template: "ingredient_value",
      fields: { PROP: "POWDER", TAG: "SALT", AMOUNT: 5, UNIT: "G" },
      lockFields: ["PROP", "TAG"],
    },
    {
      type: "ing_pork",
      label: "돼지고기",
      template: "ingredient_value",
      fields: { PROP: "SOLID", TAG: "PORK", AMOUNT: 200, UNIT: "G" },
      lockFields: ["PROP", "TAG"],
    },
    {
      type: "ing_beef",
      label: "소고기",
      template: "ingredient_value",
      fields: { PROP: "SOLID", TAG: "BEEF", AMOUNT: 200, UNIT: "G" },
      lockFields: ["PROP", "TAG"],
    },
  ],
  "동작": [
    {
      type: "act_boil",
      label: "삶는다(5분)",
      template: "action_cook",
      fields: { METHOD: "BOIL", TIME: 5 },
      lockFields: ["METHOD"],
    },
    {
      type: "act_bake",
      label: "굽는다(10분)",
      template: "action_cook",
      fields: { METHOD: "BAKE", TIME: 10 },
      lockFields: ["METHOD"],
    },
  ],
  "흐름": [
    { type: "flow_repeat_basic", label: "반복", template: "flow_repeat", fields: {} },
    { type: "flow_if_else_basic", label: "조건", template: "flow_if_else", fields: {} },
  ],
};

// 버튼/카테고리 순서
export const CATEGORY_ORDER = ["재료", "동작", "흐름"];

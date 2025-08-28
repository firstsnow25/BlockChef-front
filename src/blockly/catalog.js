// src/blockly/catalog.js
export const CATEGORY_ORDER = ["재료","조리","조리값","흐름"];

// 가나다 정렬
const ING_NAMES = [
  "감자","고추","대파","당근","라면사리","라면스프","달걀","물","소금","양파"
].sort((a,b)=>a.localeCompare(b,"ko-KR"));

export const CATALOG = {
  "재료": [
    { type:"ingredient", label:"재료", template:"ingredient_block", fields:{ QUANTITY:1, UNIT:"개" } },
    ...ING_NAMES.map((n)=>({ type:`ing_name_${n}`, label:n, template:`ingredient_name_${n}`, fields:{} })),
  ],
  "조리": [
    ...["mix","steam","fry","boil","grill","deepfry"].map((k)=>({ type:`${k}_stmt`, label:k, template:`${k}_block`, fields:{ TIME:5, UNIT:"분" } })),
    ...["slice","put","peel","crack","remove_seed"].map((k)=>({ type:`${k}_stmt`, label:k, template:`${k}_block`, fields:{} })),
    { type:"wait_stmt", label:"wait", template:"wait_block", fields:{ TIME:5, UNIT:"분" } },
  ],
  "조리값": [
    ...["mix","steam","fry","boil","grill","deepfry"].map((k)=>({ type:`${k}_val`, label:k, template:`${k}_value_block`, fields:{ TIME:5, UNIT:"분" } })),
    ...["slice","put","peel","crack","remove_seed"].map((k)=>({ type:`${k}_val`, label:k, template:`${k}_value_block`, fields:{} })),
  ],
  "흐름": [
    { type:"start", template:"start_block", fields:{} },
    { type:"repeat_n", template:"repeat_n_times", fields:{ COUNT:3 } },
    { type:"repeat_until", template:"repeat_until_true", fields:{ CONDITION:"예: 면이 익을" } },
    { type:"if_simple", template:"if_condition_block", fields:{ CONDITION:"예: 물이 끓으면" } },
    { type:"continue", template:"continue_block", fields:{} },
    { type:"break", template:"break_block", fields:{} },
    { type:"finish", template:"finish_block", fields:{} },
  ],
};








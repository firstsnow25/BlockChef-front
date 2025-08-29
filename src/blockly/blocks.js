// src/blockly/blocks.js
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/ko";

const CONNECTION_SHAPE_SQUARE = 1; // 0=round, 1=square, 2=hex

/** ===== 공통 상수 ===== */
const INGREDIENT_NAMES = [
  "감자","고추","대파","당근","라면사리","라면스프","달걀","물","소금","양파",
].sort((a,b)=>a.localeCompare(b,"ko-KR"));

const FEATURE_BY_ING = {
  감자:["solid"], 고추:["solid"], 대파:["solid","leafy"], 당근:["solid"],
  라면사리:["solid","noodle"], 라면스프:["powder"], 달걀:["solid","egg"],
  물:["liquid"], 소금:["powder"], 양파:["solid"]
};

const ACTION_LABELS = {
  slice:"썰기", put:"넣기", mix:"섞기", steam:"찌기", fry:"볶기",
  boil:"끓이기", grill:"굽기", deepfry:"튀기기", wait:"기다리기",
  peel:"껍질 벗기기", crack:"깨기", remove_seed:"씨 제거하기",
};

const ACTIONS_WITH_TIME = ["mix","steam","fry","boil","grill","deepfry"];
const ACTIONS_WITHOUT_TIME = ["slice","put","peel","crack","remove_seed"];

/** ===== 흐름 ===== */
Blockly.Blocks["start_block"] = {
  init() {
    this.appendDummyInput().appendField("요리 시작");
    this.setNextStatement(true);
    this.setStyle("flow_blocks");
  },
};
Blockly.Blocks["finish_block"] = {
  init() {
    this.appendDummyInput().appendField("요리 완료");
    this.setPreviousStatement(true);
    this.setStyle("flow_blocks");
  },
};

/** =========================================
 * 재료 이름 블록
 *  - ING_NAME 타입
 *  - 커스텀 렌더러에서 사각형 이음새 적용됨
 * ========================================= */
INGREDIENT_NAMES.forEach((name) => {
  Blockly.Blocks[`ingredient_name_${name}`] = {
    init() {
      this.appendDummyInput().appendField(name);
      this.setOutput(true, "ING_NAME");
      this.setStyle("ingredient_blocks");
      this.data = JSON.stringify({
        name,
        features: FEATURE_BY_ING[name] || ["solid"],
      });
      this.setTooltip("재료 이름 (계량 블록에만 연결)");
    },
  };
});

/** =========================================
 * 재료 계량 블록
 *  - NAME 입력: ING_NAME만
 *  - 출력: ING
 * ========================================= */
Blockly.Blocks["ingredient_block"] = {
  init() {
    this.appendValueInput("NAME")
      .appendField("재료")
      .setCheck("ING_NAME");
    this.appendDummyInput()
      .appendField("양")
      .appendField(new Blockly.FieldNumber(1, 1), "QUANTITY")
      .appendField(
        new Blockly.FieldDropdown([
          ["개", "개"], ["컵", "컵"], ["리터", "리터"], ["그램", "그램"],
        ]),"UNIT"
      );
    this.setOutput(true, "ING");
    this.setStyle("ingredient_blocks");
    this.setTooltip("재료를 구성합니다.");
  },
}


/** ===== 동작 블록 ===== */
Blockly.Blocks["wait_block"] = {
  init() {
    this.appendDummyInput()
      .appendField(ACTION_LABELS.wait).appendField("시간")
      .appendField(new Blockly.FieldNumber(5, 1), "TIME")
      .appendField(new Blockly.FieldDropdown([["초","초"],["분","분"],["시간","시간"]]),"UNIT");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("action_blocks");
  },
};

// 시간 있는 동작
ACTIONS_WITH_TIME.forEach((key) => {
  const label = ACTION_LABELS[key];
  Blockly.Blocks[`${key}_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label).setCheck("ING");
      this.appendDummyInput()
        .appendField("시간")
        .appendField(new Blockly.FieldNumber(5, 1), "TIME")
        .appendField(new Blockly.FieldDropdown([["초","초"],["분","분"],["시간","시간"]]),"UNIT");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle("action_blocks");
    },
  };
  Blockly.Blocks[`${key}_value_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label).setCheck("ING");
      this.appendDummyInput()
        .appendField("시간")
        .appendField(new Blockly.FieldNumber(5, 1), "TIME")
        .appendField(new Blockly.FieldDropdown([["초","초"],["분","분"],["시간","시간"]]),"UNIT");
      this.setOutput(true, "ING");
      this.setStyle("action_blocks");
    },
  };
});

// 시간 없는 동작
ACTIONS_WITHOUT_TIME.forEach((key) => {
  const label = ACTION_LABELS[key];
  Blockly.Blocks[`${key}_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label).setCheck("ING");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle("action_blocks");
    },
  };
  Blockly.Blocks[`${key}_value_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label).setCheck("ING");
      this.setOutput(true, "ING");
      this.setStyle("action_blocks");
    },
  };
});

/** ===== 흐름 제어 ===== */
Blockly.Blocks["repeat_n_times"] = { init() {
  this.appendDummyInput().appendField(new Blockly.FieldNumber(3, 1), "COUNT").appendField("번 반복");
  this.appendStatementInput("DO").appendField("실행");
  this.setPreviousStatement(true); this.setNextStatement(true);
  this.setStyle("flow_blocks");
}};
Blockly.Blocks["repeat_until_true"] = { init() {
  this.appendDummyInput().appendField('조건 "').appendField(new Blockly.FieldTextInput("예: 면이 익을"), "CONDITION").appendField('" 될 때까지 반복');
  this.appendStatementInput("DO").appendField("실행");
  this.setPreviousStatement(true); this.setNextStatement(true);
  this.setStyle("flow_blocks");
}};
Blockly.Blocks["if_condition_block"] = { init() {
  this.appendDummyInput().appendField('만약 "').appendField(new Blockly.FieldTextInput("예: 물이 끓으면"), "CONDITION").appendField('" 라면');
  this.appendStatementInput("DO").appendField("실행");
  this.setPreviousStatement(true); this.setNextStatement(true);
  this.setStyle("flow_blocks");
}};
Blockly.Blocks["continue_block"] = { init() {
  this.appendDummyInput().appendField("계속하기");
  this.setPreviousStatement(true); this.setNextStatement(true);
  this.setStyle("flow_blocks");
}};
Blockly.Blocks["break_block"] = { init() {
  this.appendDummyInput().appendField("종료하기");
  this.setPreviousStatement(true);
  this.setStyle("flow_blocks");
}};

/** ===== 합치기 ===== */
Blockly.Blocks["combine_block"] = {
  init() {
    this.itemCount_ = 2;
    this.setOutput(true, "ING");
    this.setStyle("action_blocks");
    this.setMutator("combine_mutator");
    this.updateShape_();
    this.setTooltip("재료를 합칩니다.");
  },
  mutationToDom() { const m=document.createElement("mutation"); m.setAttribute("items", String(this.itemCount_)); return m; },
  domToMutation(xml) { const n=parseInt(xml.getAttribute("items"),10); this.itemCount_=Number.isFinite(n)?n:2; this.updateShape_(); },
  decompose(ws) { const c=ws.newBlock("combine_mutator_container"); c.initSvg();
    let conn=c.getInput("STACK").connection;
    for(let i=0;i<this.itemCount_;i++){ const it=ws.newBlock("combine_mutator_item"); it.initSvg(); conn.connect(it.previousConnection); conn=it.nextConnection;}
    return c; },
  compose(c) { const conns=[]; let it=c.getInputTargetBlock("STACK"); while(it){conns.push(it.valueConnection_); it=it.nextConnection&&it.nextConnection.targetBlock();}
    this.itemCount_=conns.length||1; this.updateShape_();
    for(let i=0;i<this.itemCount_;i++){ const input=this.getInput("ITEM"+i); if(input&&conns[i]) input.connection.connect(conns[i]);}},
  saveConnections(c){let it=c.getInputTargetBlock("STACK");let i=0;while(it){const input=this.getInput("ITEM"+i); it.valueConnection_=input&&input.connection&&input.connection.targetConnection;i++;it=it.nextConnection&&it.nextConnection.targetBlock();}},
  updateShape_(){let i=0;while(this.getInput("ITEM"+i)){this.removeInput("ITEM"+i);i++;} for(let k=0;k<this.itemCount_;k++){this.appendValueInput("ITEM"+k).setCheck("ING").appendField(k===0?"합치기 재료":"재료 추가");}}
};
Blockly.Blocks["combine_mutator_container"]={init(){this.appendStatementInput("STACK").appendField("재료들");this.setColour(300);}};
Blockly.Blocks["combine_mutator_item"]={init(){this.appendDummyInput().appendField("재료");this.setPreviousStatement(true);this.setNextStatement(true);this.setColour(300);}};

Blockly.Extensions.registerMutator("combine_mutator", {
  mutationToDom: Blockly.Blocks["combine_block"].mutationToDom,
  domToMutation: Blockly.Blocks["combine_block"].domToMutation,
  decompose: Blockly.Blocks["combine_block"].decompose,
  compose: Blockly.Blocks["combine_block"].compose,
  saveConnections: Blockly.Blocks["combine_block"].saveConnections,
}, null, ["combine_mutator_item"]);



/**
 * NOTE
 * - 툴박스(flyout)에서 내려오는 fields/data 프리셋/lockFields 처리는
 *   BlocklyArea.jsx의 BLOCK_CREATE 리스너에서 적용됩니다.
 */







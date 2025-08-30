import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/ko";

/** =========================
 * 재료 메타 (features: solid/liquid/oil/powder)
 * ========================= */
const INGREDIENT_NAMES = [
  "김치","식용유","밥","간장","버터",
  "라면사리","라면스프","물","소금","김가루","김밥용 단무지",
].sort((a,b)=>a.localeCompare(b,"ko-KR"));

export const FEATURE_BY_ING = {
  김치:["solid"], 식용유:["oil"], 밥:["solid"], 간장:["liquid"], 버터:["oil"],
  라면사리:["solid"], 라면스프:["powder"], 물:["liquid"], 소금:["powder"],
  김가루:["powder"], "김밥용 단무지":["solid"],
};

/** =========================
 * 라벨(한국어)
 * ========================= */
const ACTION_LABELS = {
  slice:"자르기", grind:"갈기", put:"넣기",
  mix:"섞기", fry:"볶기", boil:"끓이기", simmer:"삶기",
  wait:"기다리기",
};

const ACTIONS_WITH_TIME = ["mix","fry","boil","simmer"];
const ACTIONS_WITHOUT_TIME = ["slice","put","grind"];

/** =========================
 * 시작/완료
 * ========================= */
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

/** =========================
 * 재료 이름 블록 (ING_NAME)
 *  - 계량 블록에서만 사용
 * ========================= */
INGREDIENT_NAMES.forEach((name) => {
  Blockly.Blocks[`ingredient_name_${name}`] = {
    init() {
      this.appendDummyInput().appendField(name);
      this.setOutput(true, "ING_NAME");       // 타입: ING_NAME
      this.setStyle("ingredient_blocks");     // 색상/테마
      this.data = JSON.stringify({
        name,
        features: FEATURE_BY_ING[name] || ["solid"],
      });
      this.setTooltip("재료 이름 (먼저 ‘재료’ 블록에 넣으세요)");
    },
  };
});

/** =========================
 * 재료 계량 블록 (ING)
 *  - NAME: ING_NAME만
 *  - 출력: ING
 * ========================= */
Blockly.Blocks["ingredient_block"] = {
  init() {
    this.appendValueInput("NAME")
      .appendField("재료")
      .setCheck("ING_NAME");
    this.appendDummyInput()
      .appendField("양")
      .appendField(new Blockly.FieldNumber(1, 1), "QUANTITY")
      .appendField(new Blockly.FieldDropdown([
        ["개","개"],["컵","컵"],["리터","리터"],["그램","그램"],
      ]),"UNIT");
    this.setOutput(true, "ING");
    this.setStyle("ingredient_blocks");
    this.setTooltip("재료를 구성합니다.");
  },
};

/** =========================
 * 동작 (Statement & Value)
 *  - 모든 동작의 값 입력 이름을 'ITEM'으로 통일
 *  - value 버전은 출력도 'ING'
 * ========================= */
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

function defineActionWithTime(key) {
  const label = ACTION_LABELS[key];
  // statement
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
  // value
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
}
ACTIONS_WITH_TIME.forEach(defineActionWithTime);

function defineActionNoTime(key) {
  const label = ACTION_LABELS[key];
  // statement
  Blockly.Blocks[`${key}_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label).setCheck("ING");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle("action_blocks");
    },
  };
  // value
  Blockly.Blocks[`${key}_value_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label).setCheck("ING");
      this.setOutput(true, "ING");
      this.setStyle("action_blocks");
    },
  };
}
ACTIONS_WITHOUT_TIME.forEach(defineActionNoTime);

/** =========================
 * 합치기 (ING, 가변 입력) — 안전한 방식(아이콘 클래스를 직접 new 하지 않음)
 * ========================= */
Blockly.Blocks["combine_block"] = {
  init() {
    this.itemCount_ = 2;
    this.setOutput(true, "ING");
    this.setStyle("action_blocks");
    this.setMutator("combine_mutator"); // ✅ 문자열 키로 등록된 뮤테이터 사용
    this.updateShape_();
    this.setTooltip("재료를 합칩니다. (섞기/볶기 등에서 2개 이상 입력 용도)");
  },
  mutationToDom() {
    const m = document.createElement("mutation");
    m.setAttribute("items", String(this.itemCount_));
    return m;
  },
  domToMutation(xml) {
    const n = parseInt(xml.getAttribute("items"), 10);
    this.itemCount_ = Number.isFinite(n) ? n : 2;
    this.updateShape_();
  },
  decompose(ws) {
    const c = ws.newBlock("combine_mutator_container");
    c.initSvg();
    let conn = c.getInput("STACK").connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const it = ws.newBlock("combine_mutator_item");
      it.initSvg();
      conn.connect(it.previousConnection);
      conn = it.nextConnection;
    }
    return c;
  },
  compose(container) {
    const conns = [];
    let it = container.getInputTargetBlock("STACK");
    while (it) {
      conns.push(it.valueConnection_);
      it = it.nextConnection && it.nextConnection.targetBlock();
    }
    this.itemCount_ = conns.length || 1;
    this.updateShape_();
    for (let i = 0; i < this.itemCount_; i++) {
      const input = this.getInput("ITEM" + i);
      if (input && conns[i]) input.connection.connect(conns[i]);
    }
  },
  saveConnections(container) {
    let it = container.getInputTargetBlock("STACK");
    let i = 0;
    while (it) {
      const input = this.getInput("ITEM" + i);
      it.valueConnection_ = input && input.connection && input.connection.targetConnection;
      i++;
      it = it.nextConnection && it.nextConnection.targetBlock();
    }
  },
  updateShape_() {
    let i = 0;
    while (this.getInput("ITEM" + i)) {
      this.removeInput("ITEM" + i);
      i++;
    }
    for (let k = 0; k < this.itemCount_; k++) {
      this.appendValueInput("ITEM" + k)
        .setCheck("ING")
        .appendField(k === 0 ? "합치기 재료" : "재료 추가");
    }
  },
};
Blockly.Blocks["combine_mutator_container"] = {
  init() {
    this.appendStatementInput("STACK").appendField("재료들");
    this.setColour(300);
  },
};
Blockly.Blocks["combine_mutator_item"] = {
  init() {
    this.appendDummyInput().appendField("재료");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(300);
  },
};
Blockly.Extensions.registerMutator(
  "combine_mutator",
  {
    mutationToDom: Blockly.Blocks["combine_block"].mutationToDom,
    domToMutation: Blockly.Blocks["combine_block"].domToMutation,
    decompose: Blockly.Blocks["combine_block"].decompose,
    compose: Blockly.Blocks["combine_block"].compose,
    saveConnections: Blockly.Blocks["combine_block"].saveConnections,
  },
  null,
  ["combine_mutator_item"]
);

/** =========================
 * 흐름 제어 (if/while/for/continue/break)
 * ========================= */
Blockly.Blocks["repeat_n_times"] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldNumber(3, 1), "COUNT")
      .appendField("번 반복");
    this.appendStatementInput("DO").appendField("실행");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("flow_blocks");
  },
};
Blockly.Blocks["repeat_until_true"] = {
  init() {
    this.appendDummyInput()
      .appendField('조건 "')
      .appendField(new Blockly.FieldTextInput("예: 면이 익을"), "CONDITION")
      .appendField('" 될 때까지 반복');
    this.appendStatementInput("DO").appendField("실행");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("flow_blocks");
  },
};
Blockly.Blocks["if_condition_block"] = {
  init() {
    this.appendDummyInput()
      .appendField('만약 "')
      .appendField(new Blockly.FieldTextInput("예: 물이 끓으면"), "CONDITION")
      .appendField('" 라면');
    this.appendStatementInput("DO").appendField("실행");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("flow_blocks");
  },
};
Blockly.Blocks["continue_block"] = {
  init() {
    this.appendDummyInput().appendField("계속하기");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("flow_blocks");
  },
};
Blockly.Blocks["break_block"] = {
  init() {
    this.appendDummyInput().appendField("종료하기");
    this.setPreviousStatement(true);
    this.setStyle("flow_blocks");
  },
};

/**
 * NOTE
 * - 재료 features는 semantics.js에서 검증/토스트에 사용.
 * - 팔레트 노출은 catalog.js에서 조절합니다.
 */




/**
 * NOTE
 * - 재료 features는 semantics.js에서 검증/토스트에 사용.
 */




/**
 * NOTE
 * - 툴박스(flyout)에서 내려오는 fields/data 프리셋/lockFields 처리는
 *   BlocklyArea.jsx의 BLOCK_CREATE 리스너에서 적용됩니다.
 */









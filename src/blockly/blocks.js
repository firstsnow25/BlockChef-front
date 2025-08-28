import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/ko";

/**
 * BlockChef 커스텀 블록들
 * - 스타일: ingredient_blocks / action_blocks / flow_blocks
 */

/* =========================
 * 공통 상수
 * ========================= */
const INGREDIENT_NAMES = [
  "감자", "당근", "양파", "달걀", "소금", "물",
  "라면사리", "라면스프", "대파", "고추",
];

// ✅ 재료별 feature 태그(코어4종 중심)
const FEATURE_BY_ING = {
  감자: ["solid"],
  당근: ["solid"],
  양파: ["solid"],
  달걀: ["solid"],        // 필요 시 'egg' 추가 가능
  소금: ["powder"],
  물: ["liquid"],
  라면사리: ["solid", "noodle"],
  라면스프: ["powder"],
  대파: ["solid", "leafy"],
  고추: ["solid"],
};

const ACTION_LABELS = {
  slice: "썰기",
  put: "넣기",
  mix: "섞기",
  steam: "찌기",
  fry: "볶기",
  boil: "끓이기",
  grill: "굽기",
  deepfry: "튀기기",
  wait: "기다리기",
  peel: "껍질 벗기기",
  crack: "깨기",
  remove_seed: "씨 제거하기",
};

const ACTIONS_WITH_TIME = ["mix", "steam", "fry", "boil", "grill", "deepfry"];
const ACTIONS_WITHOUT_TIME = ["slice", "put", "peel", "crack", "remove_seed"];

/* =========================
 * 시작/완료
 * ========================= */
Blockly.Blocks["start_block"] = {
  init() {
    this.appendDummyInput().appendField("요리 시작");
    this.setNextStatement(true);
    this.setStyle("flow_blocks");
    this.setTooltip("요리를 시작합니다.");
  },
};

Blockly.Blocks["finish_block"] = {
  init() {
    this.appendDummyInput().appendField("요리 완료");
    this.setPreviousStatement(true);
    this.setStyle("flow_blocks");
    this.setTooltip("요리를 완료합니다.");
  },
};

/* =========================
 * 재료: 이름 블록 + 구성 블록
 *  - ingredient_name_감자 ... (값 블록, ✅ data에 features 저장)
 *  - ingredient_block: (재료 이름 값) + 양 + 단위 → 값 블록
 * ========================= */
INGREDIENT_NAMES.forEach((name) => {
  Blockly.Blocks[`ingredient_name_${name}`] = {
    init() {
      this.appendDummyInput().appendField(name);
      this.setOutput(true, null);
      this.setStyle("ingredient_blocks");
      this.setTooltip("재료 이름");

      // ✅ semantics가 읽을 features 메타 (문자열화)
      const feats = FEATURE_BY_ING[name] || ["solid"];
      this.data = JSON.stringify({ features: feats });
    },
  };
});

Blockly.Blocks["ingredient_block"] = {
  init() {
    this.appendValueInput("NAME").appendField("재료");
    this.appendDummyInput()
      .appendField("양")
      .appendField(new Blockly.FieldNumber(1, 1), "QUANTITY")
      .appendField(
        new Blockly.FieldDropdown([
          ["개", "개"],
          ["컵", "컵"],
          ["리터", "리터"],
          ["그램", "그램"],
        ]),
        "UNIT"
      );
    this.setOutput(true, null);
    this.setStyle("ingredient_blocks");
    this.setTooltip("재료를 구성합니다.");
  },
};

/* =========================
 * 동작: 단계(Statement) + 값(Value) 버전
 * ========================= */

// 기다리기(시간만, statement)
Blockly.Blocks["wait_block"] = {
  init() {
    this.appendDummyInput()
      .appendField(ACTION_LABELS.wait)
      .appendField("시간")
      .appendField(new Blockly.FieldNumber(5, 1), "TIME")
      .appendField(
        new Blockly.FieldDropdown([
          ["초", "초"],
          ["분", "분"],
          ["시간", "시간"],
        ]),
        "UNIT"
      );
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("action_blocks");
    this.setTooltip(`조리 방법: ${ACTION_LABELS.wait}`);
  },
};

// with time
ACTIONS_WITH_TIME.forEach((key) => {
  const label = ACTION_LABELS[key];

  // statement
  Blockly.Blocks[`${key}_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label);
      this.appendDummyInput()
        .appendField("시간")
        .appendField(new Blockly.FieldNumber(5, 1), "TIME")
        .appendField(
          new Blockly.FieldDropdown([
            ["초", "초"],
            ["분", "분"],
            ["시간", "시간"],
          ]),
          "UNIT"
        );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle("action_blocks");
      this.setTooltip(`조리 방법: ${label}`);
    },
  };

  // value
  Blockly.Blocks[`${key}_value_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label);
      this.appendDummyInput()
        .appendField("시간")
        .appendField(new Blockly.FieldNumber(5, 1), "TIME")
        .appendField(
          new Blockly.FieldDropdown([
            ["초", "초"],
            ["분", "분"],
            ["시간", "시간"],
          ]),
          "UNIT"
        );
      this.setOutput(true, null);
      this.setStyle("action_blocks");
      this.setTooltip(`조리 방법 (값): ${label}`);
    },
  };
});

// without time
ACTIONS_WITHOUT_TIME.forEach((key) => {
  const label = ACTION_LABELS[key];

  // statement
  Blockly.Blocks[`${key}_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle("action_blocks");
      this.setTooltip(`조리 방법: ${label}`);
    },
  };

  // value
  Blockly.Blocks[`${key}_value_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label);
      this.setOutput(true, null);
      this.setStyle("action_blocks");
      this.setTooltip(`조리 방법 (값): ${label}`);
    },
  };
});

/* =========================
 * 흐름 제어
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
    this.setTooltip("지정한 횟수만큼 반복합니다.");
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
    this.setTooltip("사용자 조건에 도달할 때까지 반복합니다.");
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
    this.setTooltip("조건이 참일 경우 실행");
  },
};

Blockly.Blocks["continue_block"] = {
  init() {
    this.appendDummyInput().appendField("계속하기");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("flow_blocks");
    this.setTooltip("다음 단계로 계속합니다.");
  },
};

Blockly.Blocks["break_block"] = {
  init() {
    this.appendDummyInput().appendField("종료하기");
    this.setPreviousStatement(true);
    this.setStyle("flow_blocks");
    this.setTooltip("흐름을 종료합니다.");
  },
};

/* =========================
 * 합치기 (뮤테이터, value 블록)
 * ========================= */
Blockly.Blocks["combine_block"] = {
  init() {
    this.itemCount_ = 2;
    this.setOutput(true, null);
    this.setStyle("action_blocks");
    this.setMutator("combine_mutator");
    this.updateShape_();
    this.setTooltip("재료를 합칩니다.");
  },
  mutationToDom() {
    const container = document.createElement("mutation");
    container.setAttribute("items", String(this.itemCount_));
    return container;
  },
  domToMutation(xml) {
    const n = parseInt(xml.getAttribute("items"), 10);
    this.itemCount_ = Number.isFinite(n) ? n : 2;
    this.updateShape_();
  },
  decompose(workspace) {
    const container = workspace.newBlock("combine_mutator_container");
    container.initSvg();
    let conn = container.getInput("STACK").connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const item = workspace.newBlock("combine_mutator_item");
      item.initSvg();
      conn.connect(item.previousConnection);
      conn = item.nextConnection;
    }
    return container;
  },
  compose(container) {
    const conns = [];
    let item = container.getInputTargetBlock("STACK");
    while (item) {
      conns.push(item.valueConnection_);
      item = item.nextConnection && item.nextConnection.targetBlock();
    }
    this.itemCount_ = conns.length || 1;
    this.updateShape_();
    for (let i = 0; i < this.itemCount_; i++) {
      const input = this.getInput("ITEM" + i);
      if (input && conns[i]) input.connection.connect(conns[i]);
    }
  },
  saveConnections(container) {
    let item = container.getInputTargetBlock("STACK");
    let i = 0;
    while (item) {
      const input = this.getInput("ITEM" + i);
      item.valueConnection_ =
        input && input.connection && input.connection.targetConnection;
      i++;
      item = item.nextConnection && item.nextConnection.targetBlock();
    }
  },
  updateShape_() {
    let i = 0;
    while (this.getInput("ITEM" + i)) {
      this.removeInput("ITEM" + i);
      i++;
    }
    for (let k = 0; k < this.itemCount_; k++) {
      this.appendValueInput("ITEM" + k).appendField(k === 0 ? "합치기 재료" : "재료 추가");
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


/**
 * NOTE
 * - 툴박스(flyout)에서 내려오는 fields/data 프리셋/lockFields 처리는
 *   BlocklyArea.jsx의 BLOCK_CREATE 리스너에서 적용됩니다.
 */







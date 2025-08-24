// src/blockly/blocks.js
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/ko";

/**
 * BlockChef 커스텀 블록 모음 (HTML 데모 정의 이식)
 * - v12 대응: Mutator 클래스를 직접 import 하지 않고 registerMutator 사용
 * - 스타일: ingredient_blocks / action_blocks / flow_blocks (BlocklyArea의 BlockChefTheme와 매칭)
 */

/* =========================
 * 공통 상수
 * ========================= */
const INGREDIENT_NAMES = [
  "감자", "당근", "양파", "달걀", "소금", "물", "라면사리", "라면스프", "대파", "고추",
];

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
 *  - ingredient_name_감자 ... (값 블록)
 *  - ingredient_block: (재료 이름 값) + 양 + 단위 → 값 블록
 * ========================= */
INGREDIENT_NAMES.forEach((name) => {
  Blockly.Blocks[`ingredient_name_${name}`] = {
    init() {
      this.appendDummyInput().appendField(name);
      this.setOutput(true, null);
      this.setStyle("ingredient_blocks");
      this.setTooltip("재료 이름");
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
 *  - with time: *_block / *_value_block (시간 + 단위)
 *  - without time: *_block / *_value_block
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

  // statement 버전
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

  // value 버전
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
 *  - 반복 N회
 *  - 조건까지 반복
 *  - if (간단 입력형)
 *  - continue / break
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
 *  - combine_block: 입력 ITEM* 가변
 * ========================= */
Blockly.Blocks["combine_block"] = {
  init() {
    this.itemCount_ = 2; // 기본 2개
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
    // 기존 입력 제거
    let i = 0;
    while (this.getInput("ITEM" + i)) {
      this.removeInput("ITEM" + i);
      i++;
    }
    // 새 입력 추가
    for (let k = 0; k < this.itemCount_; k++) {
      this.appendValueInput("ITEM" + k).appendField(k === 0 ? "합치기 재료" : "재료 추가");
    }
  },
};

// 뮤테이터 UI용 블록들
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

// 뮤테이터 등록
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







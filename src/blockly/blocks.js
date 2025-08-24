// src/blockly/blocks.js
import * as Blockly from "blockly/core"; // ✅ 네임스페이스 임포트만 사용 (named import 금지)

/* ───────── 재료 이름(value) 예시 ───────── */
const ING_NAMES = ["감자", "당근", "양파", "달걀", "소금", "물", "라면사리", "라면스프", "대파", "고추"];

ING_NAMES.forEach((name) => {
  const type = `ingredient_name_${name}`;
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("ingredient_blocks");
      this.setOutput(true, null);
      this.appendDummyInput().appendField(name);
      this.setTooltip(name);
    },
  };
});

/* ───────── 재료(value) : 이름 + 양 + 단위 ───────── */
Blockly.Blocks["ingredient_block"] = {
  init() {
    this.setStyle("ingredient_blocks");
    this.setOutput(true, null);
    this.appendValueInput("NAME").appendField("재료");
    this.appendDummyInput()
      .appendField("양")
      .appendField(new Blockly.FieldNumber(1, 0, 9999, 1), "QUANTITY")
      .appendField(
        new Blockly.FieldDropdown([
          ["개", "개"],
          ["g", "g"],
          ["ml", "ml"],
          ["컵", "컵"],
          ["큰술", "큰술"],
          ["작은술", "작은술"],
        ]),
        "UNIT"
      );
  },
};

/* ───────── 조리 단계(statement) ───────── */
function mkTimedAction(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.appendDummyInput()
        .appendField(label)
        .appendField(new Blockly.FieldNumber(5, 0, 1000, 1), "TIME")
        .appendField(new Blockly.FieldDropdown([["분", "분"], ["초", "초"]]), "UNIT");
    },
  };
}
function mkAction(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.appendDummyInput().appendField(label);
    },
  };
}

mkTimedAction("boil_block", "끓이기");
mkTimedAction("fry_block", "볶기");
mkTimedAction("grill_block", "굽기");
mkTimedAction("deepfry_block", "튀기기");
mkAction("slice_block", "썰기");
mkAction("put_block", "넣기");
mkAction("peel_block", "껍질 벗기기");
mkAction("crack_block", "깨기");
mkAction("remove_seed_block", "씨 제거");

/* ───────── 조리 값(value) ───────── */
function mkTimedActionValue(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setOutput(true, null);
      this.appendDummyInput()
        .appendField(label)
        .appendField(new Blockly.FieldNumber(5, 0, 1000, 1), "TIME")
        .appendField(new Blockly.FieldDropdown([["분", "분"], ["초", "초"]]), "UNIT");
    },
  };
}
function mkActionValue(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setOutput(true, null);
      this.appendDummyInput().appendField(label);
    },
  };
}

mkTimedActionValue("boil_value_block", "끓이기");
mkTimedActionValue("fry_value_block", "볶기");
mkTimedActionValue("grill_value_block", "굽기");
mkTimedActionValue("deepfry_value_block", "튀기기");
mkActionValue("slice_value_block", "썰기");
mkActionValue("put_value_block", "넣기");
mkActionValue("peel_value_block", "껍질 벗기기");
mkActionValue("crack_value_block", "깨기");
mkActionValue("remove_seed_value_block", "씨 제거");

/* ───────── 흐름 제어(statement) ───────── */
Blockly.Blocks["start_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setNextStatement(true);
    this.appendDummyInput().appendField("시작");
  },
};
Blockly.Blocks["repeat_n_times"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField("반복")
      .appendField(new Blockly.FieldNumber(3, 1, 999, 1), "COUNT")
      .appendField("회");
    this.appendStatementInput("DO").appendField("실행");
  },
};
Blockly.Blocks["if_condition_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField("만약")
      .appendField(new Blockly.FieldTextInput("예: 물이 끓으면"), "CONDITION");
    this.appendStatementInput("DO").appendField("그러면");
  },
};
Blockly.Blocks["repeat_until_true"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.appendDummyInput()
      .appendField("~까지 반복")
      .appendField(new Blockly.FieldTextInput("예: 면이 익을"), "CONDITION");
    this.appendStatementInput("DO").appendField("실행");
  },
};
Blockly.Blocks["continue_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    this.appendDummyInput().appendField("다음으로");
  },
};
Blockly.Blocks["break_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    this.appendDummyInput().appendField("중단");
  },
};
Blockly.Blocks["finish_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    this.appendDummyInput().appendField("끝");
  },
};

/* ───────── 합치기(combine) – 뮤테이터로 value 입력 동적 추가 ───────── */
Blockly.Blocks["combine_block"] = {
  init() {
    this.setStyle("flow_blocks"); // 필요하면 별도 스타일로 분리 가능
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.itemCount_ = 2; // 기본 2개
    this.updateShape_();
    this.setMutator(new Blockly.Mutator(["combine_item_block"])); // ✅ namespace로 호출
    this.setTooltip("여러 재료/중간 결과를 하나로 합칩니다.");
  },
  updateShape_() {
    // 기존 입력 제거
    let i = 0;
    while (this.getInput("ITEM" + i)) {
      this.removeInput("ITEM" + i);
      i++;
    }
    // 라벨 + 값 슬롯
    this.appendDummyInput().appendField("합치기");
    for (let k = 0; k < this.itemCount_; k++) {
      this.appendValueInput("ITEM" + k).appendField(k === 0 ? "재료/값" : "");
    }
  },
  decompose(workspace) {
    const container = workspace.newBlock("combine_container_block");
    container.initSvg();
    let connection = container.getInput("STACK").connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const item = workspace.newBlock("combine_item_block");
      item.initSvg();
      connection.connect(item.previousConnection);
      connection = item.nextConnection;
    }
    return container;
  },
  compose(containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    const connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    this.itemCount_ = connections.length || 1;
    this.updateShape_();
    for (let i = 0; i < this.itemCount_; i++) {
      if (connections[i]) {
        this.getInput("ITEM" + i).connection.connect(connections[i]);
      }
    }
  },
  saveExtraState() {
    return { itemCount: this.itemCount_ };
  },
  loadExtraState(state) {
    this.itemCount_ = state?.itemCount ?? 2;
    this.updateShape_();
  },
  saveConnections(containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    let i = 0;
    while (itemBlock) {
      const input = this.getInput("ITEM" + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
  },
};

/* 뮤테이터 UI 블록들 */
Blockly.Blocks["combine_container_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.appendDummyInput().appendField("합치기 항목");
    this.appendStatementInput("STACK");
    this.contextMenu = false;
  },
};
Blockly.Blocks["combine_item_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.appendDummyInput().appendField("항목");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  },
};






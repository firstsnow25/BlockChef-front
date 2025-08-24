// src/blockly/blocks.js
import * as Blockly from "blockly/core";

/** 공통 유틸: 더미 인풋 라벨 */
function addLabel(block, text) {
  block.appendDummyInput().appendField(text);
}

/** ─────────────────────────────────────────────────────────
 *  재료 이름 (value) – 예시로 몇 개만. 계속 추가 가능
 * ───────────────────────────────────────────────────────── */
const ING_NAMES = ["감자", "당근", "양파", "달걀", "소금", "물", "라면사리", "라면스프", "대파", "고추"];
ING_NAMES.forEach((name) => {
  const type = `ingredient_name_${name}`;
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("ingredient_blocks");
      this.setOutput(true, null);
      addLabel(this, name);
      this.setTooltip(`${name}`);
      this.setHelpUrl("");
    },
  };
});

/** 재료 블록 (value) – 이름(value) + 양(number) + 단위(dropdown) */
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
    this.setTooltip("재료 구성");
    this.setHelpUrl("");
  },
};

/** ─────────────────────────────────────────────────────────
 *  조리 단계 (statement) – 시간 있는/없는 버전 몇 개 예시
 * ───────────────────────────────────────────────────────── */
function mkTimedAction(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.appendDummyInput()
        .appendField(label)
        .appendField(new Blockly.FieldNumber(5, 0, 1000, 1), "TIME")
        .appendField(
          new Blockly.FieldDropdown([
            ["분", "분"],
            ["초", "초"],
          ]),
          "UNIT"
        );
      this.setTooltip(label);
    },
  };
}
function mkAction(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      addLabel(this, label);
      this.setTooltip(label);
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

/** 조리 값 (value) – 같은 이름의 value 버전 */
function mkTimedActionValue(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setOutput(true, null);
      this.appendDummyInput()
        .appendField(label)
        .appendField(new Blockly.FieldNumber(5, 0, 1000, 1), "TIME")
        .appendField(
          new Blockly.FieldDropdown([
            ["분", "분"],
            ["초", "초"],
          ]),
          "UNIT"
        );
      this.setTooltip(`${label}(값)`);
    },
  };
}
function mkActionValue(type, label) {
  Blockly.Blocks[type] = {
    init() {
      this.setStyle("action_blocks");
      this.setOutput(true, null);
      addLabel(this, label);
      this.setTooltip(`${label}(값)`);
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

/** 흐름 제어 */
Blockly.Blocks["start_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setNextStatement(true);
    addLabel(this, "시작");
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
    addLabel(this, "다음으로");
  },
};
Blockly.Blocks["break_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    addLabel(this, "중단");
  },
};
Blockly.Blocks["finish_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    addLabel(this, "끝");
  },
};

/** ─────────────────────────────────────────────────────────
 *  합치기(combine) – 뮤테이터로 value 입력을 동적 추가
 *  - 저장/로드됨
 *  - 팔레트에선 한 개로 보이고, 뮤테이터(+/-)로 재료/중간값을 여러 개 붙임
 * ───────────────────────────────────────────────────────── */
Blockly.Blocks["combine_block"] = {
  init() {
    this.setStyle("flow_blocks"); // 합치기의 색상은 flow 계열과 구분되게 원하면 combine_category 스타일로 바꿔도 됨
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.itemCount_ = 2; // 기본 2개 합치기
    this.updateShape_();
    this.setMutator(new Blockly.Mutator(["combine_item_block"]));
    this.setTooltip("여러 재료/중간 결과를 하나로 합칩니다.");
  },
  /** 블록 모양을 itemCount_에 맞춰 갱신 */
  updateShape_() {
    // 기존 입력 제거
    let i = 0;
    while (this.getInput("ITEM" + i)) {
      this.removeInput("ITEM" + i);
      i++;
    }
    // 라벨 + 값 슬롯 추가
    addLabel(this, "합치기");
    for (let k = 0; k < this.itemCount_; k++) {
      this.appendValueInput("ITEM" + k).appendField(k === 0 ? "재료/값" : "");
    }
  },
  /** 뮤테이터 UI(컨테이너) */
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
  /** 뮤테이터 compose → 실 블록 갱신 */
  compose(containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    const connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    this.itemCount_ = connections.length || 1;
    this.updateShape_();
    // 기존 연결 복원
    for (let i = 0; i < this.itemCount_; i++) {
      if (connections[i]) {
        this.getInput("ITEM" + i).connection.connect(connections[i]);
      }
    }
  },
  /** 저장용 */
  saveExtraState() {
    return { itemCount: this.itemCount_ };
  },
  /** 로드시 */
  loadExtraState(state) {
    this.itemCount_ = state?.itemCount ?? 2;
    this.updateShape_();
  },
  /** 뮤테이터 UI에서 연결 유지 */
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

/** 뮤테이터: 컨테이너/아이템 정의 */
Blockly.Blocks["combine_container_block"] = {
  init() {
    this.setStyle("flow_blocks");
    addLabel(this, "합치기 항목");
    this.appendStatementInput("STACK");
    this.contextMenu = false;
  },
};
Blockly.Blocks["combine_item_block"] = {
  init() {
    this.setStyle("flow_blocks");
    addLabel(this, "항목");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  },
};






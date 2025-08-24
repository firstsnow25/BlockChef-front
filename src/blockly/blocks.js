// src/blockly/blocks.js
import * as Blockly from "blockly"; // ✅ 네임스페이스 임포트만 사용

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

/* ───────── 합치기(combine) – registerMutator + Extensions.apply (Mutator 클래스 호출 X) ───────── */

// 뮤테이터 믹스인
const COMBINE_MUTATOR_MIXIN = {
  itemCount_: 2,

  mutationToDom() {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("items", String(this.itemCount_));
    return container;
  },

  domToMutation(xml) {
    const items = parseInt(xml.getAttribute("items") || "2", 10);
    this.itemCount_ = isNaN(items) ? 2 : Math.max(1, items);
    this.updateShape_();
  },

  decompose(workspace) {
    const container = workspace.newBlock("combine_container_block");
    container.initSvg();
    let connection = container.getInput("STACK").connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock("combine_item_block");
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return container;
  },

  compose(containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    const connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock =
        itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    this.itemCount_ = Math.max(1, connections.length);
    this.updateShape_();
    for (let i = 0; i < this.itemCount_; i++) {
      if (connections[i]) {
        this.getInput("ITEM" + i).connection.connect(connections[i]);
      }
    }
  },

  saveConnections(containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    let i = 0;
    while (itemBlock) {
      const input = this.getInput("ITEM" + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock =
        itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
  },

  updateShape_() {
    // 기존 입력 제거
    let i = 0;
    while (this.getInput("ITEM" + i)) {
      this.removeInput("ITEM" + i);
      i++;
    }
    // 라벨 + 값 슬롯
    if (!this.getInput("LABEL")) {
      this.appendDummyInput("LABEL").appendField("합치기");
    }
    for (let k = 0; k < this.itemCount_; k++) {
      const input = this.appendValueInput("ITEM" + k);
      if (k === 0) input.appendField("재료/값");
    }
  },
};

// (헬퍼 없음)
const COMBINE_MUTATOR_HELPERS = null;

// 뮤테이터 등록 (Mutator 클래스 사용 안 함)
Blockly.Extensions.registerMutator(
  "combine_mutator",
  COMBINE_MUTATOR_MIXIN,
  COMBINE_MUTATOR_HELPERS,
  ["combine_item_block"]
);

// 합치기 블록 (init 안에서 Extensions.apply로 적용)
Blockly.Blocks["combine_block"] = {
  init() {
    this.setStyle("flow_blocks");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    // 기본 상태
    this.itemCount_ = 2;
    this.updateShape_();
    // 🔥 Mutator 클래스 없이 이름으로 적용
    Blockly.Extensions.apply("combine_mutator", this, false);
    this.setTooltip("여러 재료/중간 결과를 하나로 합칩니다.");
  },
  // 믹스인이 기대하는 메서드 그대로 사용
  mutationToDom: COMBINE_MUTATOR_MIXIN.mutationToDom,
  domToMutation: COMBINE_MUTATOR_MIXIN.domToMutation,
  decompose: COMBINE_MUTATOR_MIXIN.decompose,
  compose: COMBINE_MUTATOR_MIXIN.compose,
  saveConnections: COMBINE_MUTATOR_MIXIN.saveConnections,
  updateShape_: COMBINE_MUTATOR_MIXIN.updateShape_,
};

// 뮤테이터 UI 블록들
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
// 한 번만 등록되도록 플래그
export function registerMissingBlocks(Blockly) {
  if (!Blockly || !Blockly.Blocks) return;
  if (Blockly.Blocks.__blockchef_patch_registered) return;
  Blockly.Blocks.__blockchef_patch_registered = true;

  // 1) ingredient (value) — 없을 때만 최소 형태로 보강
  if (!Blockly.Blocks['ingredient']) {
    Blockly.Blocks['ingredient'] = {
      init: function () {
        this.setColour(30); // 갈색 톤
        this.appendDummyInput()
          .appendField("재료")
          .appendField(new Blockly.FieldDropdown([
            ["감자", "POTATO"], ["당근", "CARROT"], ["양파", "ONION"],
            ["대파", "LEEK"], ["소금", "SALT"], ["설탕", "SUGAR"], ["고추", "CHILI"],
          ]), "NAME");
        this.appendDummyInput()
          .appendField("양")
          .appendField(new Blockly.FieldNumber(1, 0, 9999, 1), "AMOUNT")
          .appendField(new Blockly.FieldDropdown([
            ["개", "EA"], ["g", "G"], ["컵", "CUP"], ["ml", "ML"],
          ]), "UNIT");
        this.setOutput(true, "INGREDIENT");
        this.setTooltip("재료 블록(미정의 시 보강 등록)");
      }
    };
  }

  // 2) action_boil (statement) — 없을 때만 등록
  if (!Blockly.Blocks['action_boil']) {
    Blockly.Blocks['action_boil'] = {
      init: function () {
        this.setColour(200);
        this.appendValueInput("ING").setCheck("INGREDIENT").appendField("재료");
        this.appendDummyInput()
          .appendField("을/를 끓이기 (분)")
          .appendField(new Blockly.FieldNumber(5, 0, 600, 1), "TIME");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("재료를 n분 동안 끓이는 동작(미정의 시 보강 등록)");
      }
    };
  }

  // 3) combine (statement) — 없을 때만 등록 (뮤테이터 없이 안정형)
  if (!Blockly.Blocks['combine']) {
    Blockly.Blocks['combine'] = {
      init: function () {
        this.setColour(120);
        this.appendDummyInput().appendField("합치기");
        this.appendValueInput("A").setCheck("INGREDIENT").appendField("재료 1");
        this.appendValueInput("B").setCheck("INGREDIENT").appendField("재료 2");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("두 재료를 하나로 합침(미정의 시 보강 등록)");
      }
    };
  }
}

// 혹시 기본 내보내기가 필요한 곳이 있었다면, 유지용 래퍼도 제공
export default function registerBlocks(Blockly) {
  registerMissingBlocks(Blockly);
}








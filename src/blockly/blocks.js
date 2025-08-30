// src/blockly/blocks.js
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/ko";

/** =========================
 * 재료 메타 (features 갱신: solid/liquid/oil/powder)
 * ========================= */
const INGREDIENT_NAMES = [
  "김치",
  "식용유",
  "밥",
  "간장",
  "버터",
  "라면사리",
  "라면스프",
  "물",
  "소금",
  "김가루",
  "김밥용 단무지",
].sort((a, b) => a.localeCompare(b, "ko-KR"));

const FEATURE_BY_ING = {
  김치: ["solid"],
  식용유: ["oil"],
  밥: ["solid"],
  간장: ["liquid"],
  버터: ["oil"],
  라면사리: ["solid"],
  라면스프: ["powder"],
  물: ["liquid"],
  소금: ["powder"],
  김가루: ["powder"],
  "김밥용 단무지": ["solid"],
};

/** =========================
 * 라벨(한국어)
 * ========================= */
const ACTION_LABELS = {
  slice: "자르기",
  grind: "갈기",
  put: "넣기",
  mix: "섞기",
  fry: "볶기",
  boil: "끓이기",
  simmer: "삶기",
  wait: "기다리기",
};

const ACTIONS_WITH_TIME = ["mix", "fry", "boil", "simmer"];
const ACTIONS_WITHOUT_TIME = ["slice", "put", "grind"];

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
      this.setOutput(true, "ING_NAME");
      this.setStyle("ingredient_blocks");
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
    this.appendValueInput("NAME").appendField("재료").setCheck("ING_NAME");
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
    this.setOutput(true, "ING");
    this.setStyle("ingredient_blocks");
    this.setTooltip("재료를 구성합니다.");
  },
};

/** =========================
 * 동작 (Statement & Value)
 *  - 모든 동작의 값 입력 이름을 'ITEM'으로 통일 (중요!)
 *  - 값 버전은 출력도 'ING'
 * ========================= */
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
    },
  };
  // value
  Blockly.Blocks[`${key}_value_block`] = {
    init() {
      this.appendValueInput("ITEM").appendField(label).setCheck("ING");
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
 * 합치기 (ING) — 뮤테이터 없이 동적 입력
 *  - 최소 2개 입력에서 시작
 *  - 마지막 입력이 연결되면 빈 입력을 하나 더 추가
 *  - 꼬리쪽 비어있는 입력은 정확히 1개만 유지
 *  - 직렬화/역직렬화로 입력 개수 유지
 * ========================= */
Blockly.Blocks["combine_block"] = {
  init() {
    this.minItems_ = 2;
    this.itemCount_ = this.minItems_;
    this.setOutput(true, "ING");
    this.setStyle("action_blocks");
    this.setTooltip("재료를 합칩니다. (연결하면 입력칸이 자동으로 늘어납니다)");
    this.updateShape_();

    // 동적 슬롯 증감 (뮤테이터 대신)
    this.setOnChange((e) => {
      if (!this.workspace || this.isDeadOrDying_ || !e) return;

      // 1) 마지막 입력이 연결됐으면, 비어있는 입력 하나 더 추가
      if (this.isLastInputConnected_()) {
        this.appendNextEmptyInput_();
      }

      // 2) 꼬리쪽 빈 입력이 2칸 이상이면 1칸만 남기고 제거
      const emptyTailCount = this.getTrailingEmptyCount_();
      if (emptyTailCount > 1) {
        this.trimTrailingEmptyInputs_(/*leaveOne=*/true);
      }

      // 3) 최소 입력 갯수 보장
      if (this.itemCount_ < this.minItems_) {
        this.ensureMinInputs_();
      }
    });
  },

  // 직렬화/역직렬화
  mutationToDom() {
    const m = document.createElement("mutation");
    m.setAttribute("items", String(this.itemCount_));
    return m;
  },
  domToMutation(xml) {
    const n = parseInt(xml.getAttribute("items"), 10);
    this.itemCount_ = Number.isFinite(n) ? n : this.minItems_;
    this.updateShape_();
  },

  // 도우미들
  updateShape_() {
    // 기존 입력 제거
    let i = 0;
    while (this.getInput("ITEM" + i)) {
      this.removeInput("ITEM" + i);
      i++;
    }
    // 재생성
    for (let k = 0; k < this.itemCount_; k++) {
      this.appendValueInput("ITEM" + k)
        .setCheck("ING")
        .appendField(k === 0 ? "합치기 재료" : "재료 추가");
    }
    // 꼬리쪽 비어있는 입력 1개 보장
    if (!this.hasEmptyTail_()) {
      this.appendNextEmptyInput_();
    }
  },

  isLastInputConnected_() {
    if (this.itemCount_ === 0) return false;
    const last = this.getInput("ITEM" + (this.itemCount_ - 1));
    return !!(last && last.connection && last.connection.targetBlock());
  },

  hasEmptyTail_() {
    if (this.itemCount_ === 0) return false;
    const last = this.getInput("ITEM" + (this.itemCount_ - 1));
    return !!(last && (!last.connection || !last.connection.targetBlock()));
  },

  appendNextEmptyInput_() {
    this.itemCount_ += 1;
    this.appendValueInput("ITEM" + (this.itemCount_ - 1))
      .setCheck("ING")
      .appendField("재료 추가");
  },

  getTrailingEmptyCount_() {
    let empties = 0;
    for (let i = this.itemCount_ - 1; i >= 0; i--) {
      const input = this.getInput("ITEM" + i);
      const isEmpty = !input || !input.connection || !input.connection.targetBlock();
      if (isEmpty) empties++;
      else break;
    }
    return empties;
  },

  trimTrailingEmptyInputs_(leaveOne = true) {
    let removeCount = this.getTrailingEmptyCount_() - (leaveOne ? 1 : 0);
    while (removeCount > 0 && this.itemCount_ > this.minItems_) {
      const idx = this.itemCount_ - 1;
      const input = this.getInput("ITEM" + idx);
      const isEmpty = !input || !input.connection || !input.connection.targetBlock();
      if (isEmpty) {
        this.removeInput("ITEM" + idx);
        this.itemCount_--;
        removeCount--;
      } else {
        break;
      }
    }
  },

  ensureMinInputs_() {
    while (this.itemCount_ < this.minItems_) {
      this.appendNextEmptyInput_();
    }
  },
};

/**
 * NOTE
 * - 재료 features는 semantics.js에서 검증/토스트에 사용.
 * - (중요) combine_mutator_* 블록 및 registerMutator는 더 이상 사용하지 않습니다.
 */


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










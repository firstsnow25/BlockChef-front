// src/blockly/blocks.js
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/ko";

/** =========================
 * 재료 메타 (features: solid/liquid/oil/powder)
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

export const FEATURE_BY_ING = {
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
 * 흐름 블럭들
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
 *  - 모든 동작의 값 입력 이름 'ITEM' 통일
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

/* ───────────────────────────────
 * 공통 헬퍼: 초경량 확인 모달 (Promise<boolean>)
 * ─────────────────────────────── */
function __showConfirm(message) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "0"; host.style.top = "0";
    host.style.right = "0"; host.style.bottom = "0";
    host.style.display = "flex";
    host.style.alignItems = "center";
    host.style.justifyContent = "center";
    host.style.background = "rgba(0,0,0,0.25)";
    host.style.zIndex = "999999";

    const box = document.createElement("div");
    box.style.background = "#333"; box.style.color = "#fff";
    box.style.padding = "14px 16px";
    box.style.borderRadius = "10px";
    box.style.boxShadow = "0 10px 20px rgba(0,0,0,0.25)";
    box.style.minWidth = "260px"; box.style.fontSize = "13px";

    const msg = document.createElement("div");
    msg.textContent = message; msg.style.marginBottom = "10px";

    const row = document.createElement("div");
    row.style.display = "flex"; row.style.gap = "8px"; row.style.justifyContent = "flex-end";

    const yes = document.createElement("button");
    yes.textContent = "추가";
    yes.style.padding = "6px 10px"; yes.style.borderRadius = "8px";
    yes.style.border = "0"; yes.style.cursor = "pointer";
    yes.style.background = "#ffb703"; yes.style.color = "#222";

    const no = document.createElement("button");
    no.textContent = "취소";
    no.style.padding = "6px 10px"; no.style.borderRadius = "8px";
    no.style.border = "0"; no.style.cursor = "pointer";
    no.style.background = "#666"; no.style.color = "#fff";

    yes.onclick = () => { cleanup(); resolve(true); };
    no.onclick  = () => { cleanup(); resolve(false); };

    row.appendChild(no); row.appendChild(yes);
    box.appendChild(msg); box.appendChild(row);
    host.appendChild(box); document.body.appendChild(host);
    function cleanup(){ try { document.body.removeChild(host); } catch {} }
  });
}

/* ───────────────────────────────
 * 공통 팩토리: 동적 합치기 블록 생성기
 *  - key: 블록 타입명
 *  - opts:
 *    outputType: setOutput 체크 타입("ING"/"ACTION")
 *    inputCheck: 입력 체크 타입("ING"/"ACTION")
 *    firstLabel / nextLabel: 입력 필드 라벨
 *    tooltip: 툴팁
 *    leaveOneEmptyTail: 꼬리쪽 빈 입력을 1칸 유지할지 여부
 * ─────────────────────────────── */
function __defineDynamicCombineBlock(key, opts) {
  Blockly.Blocks[key] = {
    init() {
      this.minItems_ = 2;
      this.itemCount_ = this.minItems_;
      this._confirming_ = false;
      this._suppressKey_ = null;
      this.setOutput(true, opts.outputType);
      this.setStyle("action_blocks");
      this.setTooltip(opts.tooltip);
      this.updateShape_();

      this.setOnChange((e) => {
        if (!this.workspace || this.isDeadOrDying_ || !e) return;
        // 🔒 팔레트(플라이아웃)에서는 동작 금지
        if (this.isInFlyout || this.workspace?.isFlyout) return;
        // 의미있는 이벤트 + 본 블록에만 반응
        const interested = (e.blockId === this.id) && (
          e.type === Blockly.Events.BLOCK_MOVE ||
          e.type === Blockly.Events.BLOCK_CHANGE ||
          e.type === Blockly.Events.BLOCK_CREATE
        );
        if (!interested) return;

        const last = this.getInput("ITEM" + (this.itemCount_ - 1));
        const child = last && last.connection && last.connection.targetBlock();
        const stateKey = child ? `${child.id}|${this.itemCount_}` : null;

        if (child) {
          if (!this._confirming_ && this._suppressKey_ !== stateKey) {
            this._confirming_ = true;
            __showConfirm("입력 칸을 하나 더 추가할까요?").then((yes) => {
              this._confirming_ = false;
              if (yes) {
                this.appendNextEmptyInput_();
                this._suppressKey_ = null;
              } else {
                // 취소 → 연결 유지 + 같은 상태에선 다시 묻지 않음
                this._suppressKey_ = stateKey;
              }
            });
          }
        } else {
          this._suppressKey_ = null;
        }

        // 꼬리 빈 입력 정리
        const emptyTailCount = this.getTrailingEmptyCount_();
        if (emptyTailCount > 1) {
          this.trimTrailingEmptyInputs_(!!opts.leaveOneEmptyTail);
        }
        // 최소 입력 보장
        if (this.itemCount_ < this.minItems_) {
          this.ensureMinInputs_();
        }
      });
    },
    mutationToDom() {
      const m = document.createElement("mutation");
      m.setAttribute("items", String(this.itemCount_));
      return m;
    },
    domToMutation(xml) {
      const n = parseInt(xml.getAttribute("items"), 10);
      this.itemCount_ = Number.isFinite(n) ? n : this.minItems_;
      this.updateShape_();
      this._suppressKey_ = null;
    },
    updateShape_() {
      let i = 0;
      while (this.getInput("ITEM" + i)) { this.removeInput("ITEM" + i); i++; }
      for (let k = 0; k < this.itemCount_; k++) {
        this.appendValueInput("ITEM" + k)
          .setCheck(opts.inputCheck)
          .appendField(k === 0 ? opts.firstLabel : opts.nextLabel);
      }
    },
    getTrailingEmptyCount_() {
      let empties = 0;
      for (let i = this.itemCount_ - 1; i >= 0; i--) {
        const input = this.getInput("ITEM" + i);
        const isEmpty = !input || !input.connection || !input.connection.targetBlock();
        if (isEmpty) empties++; else break;
      }
      return empties;
    },
    trimTrailingEmptyInputs_(leaveOne = false) {
      let removeCount = this.getTrailingEmptyCount_() - (leaveOne ? 1 : 0);
      while (removeCount > 0 && this.itemCount_ > this.minItems_) {
        const idx = this.itemCount_ - 1;
        const input = this.getInput("ITEM" + idx);
        const isEmpty = !input || !input.connection || !input.connection.targetBlock();
        if (isEmpty) {
          this.removeInput("ITEM" + idx);
          this.itemCount_--;
          removeCount--;
        } else break;
      }
    },
    appendNextEmptyInput_() {
      this.itemCount_ += 1;
      this.appendValueInput("ITEM" + (this.itemCount_ - 1))
        .setCheck(opts.inputCheck)
        .appendField(opts.nextLabel);
    },
    ensureMinInputs_() {
      while (this.itemCount_ < this.minItems_) this.appendNextEmptyInput_();
    },
  };
}

// ✅ 재료 합치기
__defineDynamicCombineBlock("combine_block", {
  outputType: "ING",
  inputCheck: "ING",
  firstLabel: "합치기 재료",
  nextLabel: "재료 추가",
  tooltip: "재료를 합칩니다. (연결 시 입력 칸을 추가할지 물어봅니다)",
  leaveOneEmptyTail: false, // 기존 동작 유지
});

// ✅ 동작 합치기
__defineDynamicCombineBlock("action_combine_block", {
  outputType: "ACTION",
  inputCheck: "ACTION",
  firstLabel: "동작 추가",
  nextLabel: "동작 추가",
  tooltip: "여러 동작을 합칩니다. (연결 시 입력 칸을 추가할지 물어봅니다)",
  leaveOneEmptyTail: true, // 기존 구현대로 꼬리 한 칸 유지
});


/**
 * NOTE
 * - 재료 features는 semantics.js에서 검증/토스트에 사용.
 * - 팔레트 노출은 catalog.js에서 조절합니다.
 */



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







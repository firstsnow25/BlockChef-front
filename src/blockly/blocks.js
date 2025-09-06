// src/blockly/blocks.js
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/ko";
import { showToast } from "./semantics";  // ← 토스트 사용

/** =========================
 * 재료 메타 (features: solid/liquid/oil/powder)
 * ========================= */
const INGREDIENT_NAMES = [
  // solid
  "김치","밥","라면사리","김밥용 단무지","당근","감자","양파","돼지고기","떡국 떡",
  "대파","소고기","다진 마늘","소갈비","무","배","다진 생강","홀 토마토","월계수 잎",
  "타임","베이컨","파스타면","양송이버섯","그라나파다노",
  // liquid
  "간장","물","국간장","액젓","올리고당","굴소스","맛술","청주","레드와인","흰우유",
  // oil
  "식용유","버터","참기름","올리브유",
  // powder
  "라면스프","소금","김가루","짜장가루","카레가루","후추","설탕",
].sort((a, b) => a.localeCompare(b, "ko-KR"));

export const FEATURE_BY_ING = {
  // solid
  "김치":["solid"], "밥":["solid"], "라면사리":["solid"], "김밥용 단무지":["solid"], "당근":["solid"],
  "감자":["solid"], "양파":["solid"], "돼지고기":["solid"], "떡국 떡":["solid"], "대파":["solid"],
  "소고기":["solid"], "다진 마늘":["solid"], "소갈비":["solid"], "무":["solid"], "배":["solid"],
  "다진 생강":["solid"], "홀 토마토":["solid"], "월계수 잎":["solid"], "타임":["solid"],
  "베이컨":["solid"], "파스타면":["solid"], "양송이버섯":["solid"], "그라나파다노":["solid"],

  // liquid
  "간장":["liquid"], "물":["liquid"], "국간장":["liquid"], "액젓":["liquid"], "올리고당":["liquid"],
  "굴소스":["liquid"], "맛술":["liquid"], "청주":["liquid"], "레드와인":["liquid"], "흰우유":["liquid"],

  // oil
  "식용유":["oil"], "버터":["oil"], "참기름":["oil"], "올리브유":["oil"],

  // powder
  "라면스프":["powder"], "소금":["powder"], "김가루":["powder"],
  "짜장가루":["powder"], "카레가루":["powder"], "후추":["powder"], "설탕":["powder"],
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
 *  - 양(QUANTITY): 정수만(precision=1)
 *  - 단위(UNIT): 확장된 드롭다운
 * ========================= */
Blockly.Blocks["ingredient_block"] = {
  init() {
    this.appendValueInput("NAME")
      .appendField("재료")
      .setCheck("ING_NAME");

    // ⬇️ 정수만 허용: precision=1 (소수점 키 입력 자체가 차단됨)
    const qtyField = new Blockly.FieldNumber(
      1,      // default
      1,      // min (필요하면 0으로 바꿔도 됨)
      null,   // max 없음
      1       // precision=1 → 정수만
    );

    // (선택) 안전용 보정: 혹시라도 이상 값이 들어오면 정수로 고정
    qtyField.setValidator((v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 1;
      const i = Math.floor(n);
      return i >= 1 ? i : 1;
    });

    this.appendDummyInput()
      .appendField("양")
      .appendField(qtyField, "QUANTITY")
      .appendField(
        new Blockly.FieldDropdown([
          ["개", "개"],
          ["컵", "컵"],
          ["리터", "리터"],
          ["그램", "그램"],
          // ⬇️ 추가 단위
          ["ml", "ml"],
          ["kg", "kg"],
          ["큰술", "큰술"],
          ["작은술", "작은술"],
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
      this.setOutput(true, ["ING", "ACTION"]);
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
      this.setOutput(true, ["ING", "ACTION"]);
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
        if (this.isInFlyout || this.workspace?.isFlyout) return;

        // 우리 블록으로 "드랍"되거나(새 부모) / 우리 블록이 직접 움직인 케이스만 처리
        const movedIntoMe =
          e.type === Blockly.Events.BLOCK_MOVE &&
          e.newParentId === this.id &&
          /^ITEM\d+$/.test(e.newInputName || "");

        const relateSelf =
          e.blockId === this.id &&
          (e.type === Blockly.Events.BLOCK_MOVE ||
           e.type === Blockly.Events.BLOCK_CHANGE ||
           e.type === Blockly.Events.BLOCK_CREATE);

        if (!(movedIntoMe || relateSelf)) return;

        // ① 허용 블럭 타입 강제(예: 재료 합치기 → ingredient_block만)
        if (movedIntoMe && Array.isArray(opts.acceptOnlyTypes) && opts.acceptOnlyTypes.length > 0) {
          const inp = this.getInput(e.newInputName);
          const child = inp?.connection?.targetBlock();
          if (child && !opts.acceptOnlyTypes.includes(child.type)) {
            try { inp.connection.disconnect(); child.bumpNeighbours?.(); } catch {}
            showToast("‘재료 합치기’에는 ‘재료’ 블럭만 연결할 수 있어요.");
            // 잘못 연결이면 이후 로직 중단
            return;
          }
        }

        // 현재 입력들의 채움 상태 계산
        const filledIds = [];
        let allFull = true;
        for (let i = 0; i < this.itemCount_; i++) {
          const t = this.getInput("ITEM" + i)?.connection?.targetBlock();
          if (!t) allFull = false; else filledIds.push(t.id);
        }
        const stateKey = `${this.itemCount_}|${filledIds.join(",")}`;

        // ② 팝업 타이밍
        //   - 재료 합치기: "모든 입력이 꽉 찬 상태에서" 막 드랍되었을 때만 팝업
        //   - (기본) 그 외: "마지막 입력이 채워졌을 때" 팝업 (action_combine 기존 동작 유지)
        let shouldAsk = false;
        if (opts.confirmOnDropAllFull) {
          shouldAsk = movedIntoMe && allFull; // 드랍 + 전부 채움
        } else {
          const last = this.getInput("ITEM" + (this.itemCount_ - 1));
          const child = last && last.connection && last.connection.targetBlock();
          shouldAsk = !!child; // 마지막 칸이 찼다
        }

        if (shouldAsk) {
          if (!this._confirming_ && this._suppressKey_ !== stateKey) {
            this._confirming_ = true;
            __showConfirm("입력 칸을 하나 더 추가할까요?").then((yes) => {
              this._confirming_ = false;
              if (yes) {
                this.appendNextEmptyInput_();
                this._suppressKey_ = null; // 상태가 바뀌었으니 해제
              } else {
                this._suppressKey_ = stateKey; // 같은 상태에선 다시 묻지 않음
              }
            });
          }
        } else {
          // 하나라도 비면 다음에 다시 묻게 상태 해제
          if (!allFull) this._suppressKey_ = null;
        }

        // 꼬리 정리 & 최소 입력 보장
        const emptyTailCount = this.getTrailingEmptyCount_();
        if (emptyTailCount > 1) this.trimTrailingEmptyInputs_(!!opts.leaveOneEmptyTail);
        if (this.itemCount_ < this.minItems_) this.ensureMinInputs_();
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
  // 동작 스택 → ACTION 값 어댑터
  Blockly.Blocks["action_adapter_block"] = {
    init() {
      // 값 블럭(좌우) + 안쪽에 문장 스택을 담는 C-형태
      this.setOutput(true, "ACTION");
      this.setStyle("flow_blocks");
      this.setTooltip("상하(문장) 동작들을 좌우 'ACTION' 값으로 감싸 동작 합치기에 연결합니다.");

      this.appendDummyInput().appendField("상하->좌우전환 블럭");
      this.appendStatementInput("STEPS").appendField("블럭들"); // 여기에 mix/fry/boil/wait 등의 '문장' 블럭을 넣음
    },
  };
}


// 재료 합치기: 재료(ingredient_block)만 허용 + 전부 찼을 때 드랍 직후 팝업
__defineDynamicCombineBlock("combine_block", {
  outputType: "ING",
  inputCheck: "ING",
  firstLabel: "재료 합치기",
  nextLabel: "재료 추가",
  tooltip: "재료를 합칩니다. (재료 블럭만 연결 가능)",
  leaveOneEmptyTail: false,
  acceptOnlyTypes: ["ingredient_block"],
  confirmOnDropAllFull: true,
});

// 동작 합치기: 기존 동작 유지(마지막 칸 찼을 때 묻기, 타입 제한 없음)
__defineDynamicCombineBlock("action_combine_block", {
  outputType: ["ING", "ACTION"],
  inputCheck: null,
  firstLabel: "손질된 재료들",
  nextLabel: "재료 추가",
  tooltip: "여러 동작을 합칩니다.(연결 시 입력 칸을 추가할지 물어봅니다)",
  leaveOneEmptyTail: true,
  // acceptOnlyTypes: 없음
  // confirmOnDropAllFull: 없음(기존 로직)
});

// ─────────────────────────────────────────────
// ⬇⬇⬇ 여기부터 “스타일 오버라이드” 패치 (파일 맨 끝에 위치)
// ─────────────────────────────────────────────
(() => {
  ["mix","fry","boil","simmer","slice","put","grind"].forEach((k) => {
    const stmt = Blockly.Blocks[`${k}_block`];
    if (stmt && stmt.init) {
      const old = stmt.init;
      stmt.init = function () { old.call(this); this.setStyle("action_main_blocks"); };
    }
    const val = Blockly.Blocks[`${k}_value_block`];
    if (val && val.init) {
      const old = val.init;
      val.init = function () { old.call(this); this.setStyle("action_value_blocks"); };
    }
  });

  // 준비된 재료(동작 합치기)는 '값' 계열 색상으로
  const ac = Blockly.Blocks["action_combine_block"];
  if (ac && ac.init) {
    const old = ac.init;
    ac.init = function () { old.call(this); this.setStyle("action_value_blocks"); };
  }
})();

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







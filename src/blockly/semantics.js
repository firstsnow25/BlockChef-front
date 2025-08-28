// src/blockly/semantics.js
import * as Blockly from "blockly/core";

/** =========================
 *  요리 DSL 규칙 (허용/주의/금지)
 * ========================== */
const RULES = {
  slice: {
    forbid: ["liquid", "oil"],
    caution: ["powder"],
    requireAny: [],
    msg: {
      forbid: "액체/기름은 자를 수 없어요.",
      caution: "가루를 ‘더 곱게’는 가능하지만 일반적이진 않아요.",
    },
  },
  fry: {
    forbid: [],
    caution: ["liquid", "powder"],
    requireAny: ["oil"], // 기름이 함께 있길 권장(미충족 시 경고)
    msg: {
      caution: "가루/많은 액체를 볶는 건 주의가 필요해요.",
      require: "기름 없이 볶으면 타기 쉬워요.",
    },
  },
  mix: {
    forbid: [],
    caution: [],
    requireMinInputs: 2, // 합치기(combine) 기준 2개 이상 권장
    msg: { require: "섞기는 보통 2가지 이상 재료가 필요해요." },
  },
  put: {
    forbid: [],
    caution: [],
  },
  boil: {
    forbid: ["oil"],
    caution: ["powder"],
    requireAny: ["liquid"], // 끓이는 매체(국물/물)가 필요
    msg: {
      forbid: "기름을 끓이는 동작은 ‘튀기기’에 가까워요.",
      caution: "가루를 넣고 끓이면 탁해질 수 있어요.",
      require: "끓이려면 국물/물이 함께 있어야 해요.",
    },
  },
};

/** =========================
 *  토스트 (아주 가볍게)
 * ========================== */
export function showToast(msg) {
  if (!msg) return;
  let el = document.getElementById("blockchef-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "blockchef-toast";
    el.style.position = "fixed";
    el.style.right = "16px";
    el.style.bottom = "16px";
    el.style.zIndex = 9999;
    el.style.padding = "8px 12px";
    el.style.borderRadius = "8px";
    el.style.background = "rgba(255,83,83,0.95)";
    el.style.color = "#fff";
    el.style.fontSize = "12px";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    el.style.transition = "opacity .2s";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = "0"), 1600);
}

/** =========================
 *  재료 feature 수집 유틸
 * ========================== */

// ingredient_name_* 블록에서 feature 읽기 (blocks.js에서 this.data에 저장)
function featuresFromIngredientNameBlock(b) {
  try {
    const meta = b.data ? JSON.parse(b.data) : null;
    if (meta?.features && Array.isArray(meta.features)) {
      return new Set(meta.features);
    }
  } catch {}
  return new Set(); // 모르면 빈셋
}

// 임의 value블록에서 재귀적으로 feature 수집
function collectFeaturesFromValue(block) {
  if (!block) return new Set();

  // ingredient_name_*
  if (block.type.startsWith("ingredient_name_")) {
    return featuresFromIngredientNameBlock(block);
  }

  // ingredient_block → NAME 입력의 값 따라감
  if (block.type === "ingredient_block") {
    const nameInput = block.getInput("NAME");
    const nameConn = nameInput?.connection?.targetBlock();
    return collectFeaturesFromValue(nameConn);
  }

  // combine_block → ITEM* 입력들 합집합
  if (block.type === "combine_block") {
    const out = new Set();
    let k = 0;
    while (block.getInput("ITEM" + k)) {
      const child = block.getInput("ITEM" + k).connection?.targetBlock();
      for (const t of collectFeaturesFromValue(child)) out.add(t);
      k++;
    }
    return out;
  }

  // action의 value형 블록 (mix_value_block 등)도 내부 ITEM을 따라 들어갈 수 있음
  if (/_value_block$/.test(block.type)) {
    const v = block.getInput("ITEM")?.connection?.targetBlock();
    return collectFeaturesFromValue(v);
  }

  // 그 외: 알 수 없으면 빈
  return new Set();
}

/** mix의 ‘최소 2개 입력’ 판정 (combine 기준) */
function countItemsForMix(block) {
  if (!block) return 0;
  const v = block.getInput("ITEM")?.connection?.targetBlock();
  if (!v) return 0;

  if (v.type === "combine_block") {
    let count = 0;
    let k = 0;
    while (v.getInput("ITEM" + k)) {
      if (v.getInput("ITEM" + k)?.connection?.targetBlock()) count++;
      k++;
    }
    return count;
  }
  // 단일 재료 1개
  return 1;
}

/** 액션키 추출: fry_block / fry_value_block → fry */
function getActionKeyFromType(type) {
  const m = type.match(/^(slice|fry|mix|put|boil)(?:_value)?_block$/);
  return m ? m[1] : null;
}

/** 액션블록의 ITEM에 child 연결될 때 검증 */
function validateActionConnection(parent, child) {
  const key = getActionKeyFromType(parent.type);
  if (!key) return { verdict: "ok" };

  const rule = RULES[key];
  if (!rule) return { verdict: "ok" };

  const feats = collectFeaturesFromValue(child);

  // 금지
  for (const f of feats) {
    if (rule.forbid?.includes(f)) {
      return {
        verdict: "block",
        message: rule.msg?.forbid || "이 조합은 허용되지 않아요.",
      };
    }
  }

  // 주의
  for (const f of feats) {
    if (rule.caution?.includes(f)) {
      return {
        verdict: "warn",
        message:
          rule.msg?.caution || "이 조합은 가능하지만 주의가 필요해요.",
      };
    }
  }

  // requireAny (권장)
  if (rule.requireAny && rule.requireAny.length) {
    let ok = false;
    for (const need of rule.requireAny) {
      if (feats.has(need)) {
        ok = true;
        break;
      }
    }
    if (!ok) {
      return {
        verdict: "warn",
        message: rule.msg?.require || "이 조합엔 추가 재료가 필요해요.",
      };
    }
  }

  // mix 최소 입력
  if (key === "mix" && rule.requireMinInputs) {
    const n = countItemsForMix(parent);
    if (n < rule.requireMinInputs) {
      return {
        verdict: "warn",
        message: rule.msg?.require || "섞기는 보통 2가지 이상 재료가 필요해요.",
      };
    }
  }

  return { verdict: "ok" };
}

/** 검증 → 처리(토스트/연결취소) */
function handleValidationResult(ws, parent, inputName, child, res) {
  if (!res || res.verdict === "ok") return;

  if (res.verdict === "warn") {
    showToast(res.message);
    return;
  }

  if (res.verdict === "block") {
    try {
      // 연결만 해제
      const input = parent.getInput(inputName);
      const conn = input?.connection;
      if (conn?.targetConnection) {
        conn.disconnect();
      }
      showToast(res.message || "이 조합은 허용되지 않아요.");
    } catch {
      showToast("이 조합은 허용되지 않아요.");
    }
  }
}

/** 워크스페이스에 리스너 설치 */
export function installSemantics(ws) {
  const onMove = (ev) => {
    if (ev.type !== Blockly.Events.BLOCK_MOVE) return;

    // 새 부모/입력이 생겼다면 (연결 시도)
    if (ev.newParentId && ev.newInputName) {
      const parent = ws.getBlockById(ev.newParentId);
      const child = ws.getBlockById(ev.blockId);
      if (!parent || !child) return;

      // parent가 액션블록인지 점검 후 검증
      const res = validateActionConnection(parent, child);
      handleValidationResult(ws, parent, ev.newInputName, child, res);
    }
  };

  ws.addChangeListener(onMove);
}

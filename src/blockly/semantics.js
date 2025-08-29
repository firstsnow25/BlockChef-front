// src/blockly/semantics.js
import * as Blockly from "blockly";

/** -----------------------
 * 토스트
 * ----------------------- */
export function showToast(msg, level = "error") {
  let el = document.getElementById("blockchef-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "blockchef-toast";
    el.style.position = "fixed";
    el.style.right = "16px";
    el.style.bottom = "16px";
    el.style.zIndex = "999999";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "10px";
    el.style.color = "#fff";
    el.style.fontSize = "12px";
    el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    document.body.appendChild(el);
  }
  el.style.background =
    level === "warn" ? "rgba(255,165,0,0.95)" : "rgba(255,83,83,0.95)";
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = "0"), 1800);
}

/** -----------------------
 * ING 체인에서 재료 개수 / feature 집합 추출
 *  - ingredient_block(ING) 리프를 세고 features를 합집합으로 모음
 * ----------------------- */
function collectFromING(block, acc) {
  if (!block) return;
  if (!acc) acc = { count: 0, set: new Set() };

  if (block.type === "ingredient_block") {
    const nameBlock = block.getInputTargetBlock("NAME");
    if (nameBlock && nameBlock.data) {
      try {
        const meta = JSON.parse(nameBlock.data);
        (meta.features || []).forEach((f) => acc.set.add(f));
        acc.count += 1;
      } catch {}
    }
    return acc;
  }

  // combine_block 또는 value 파이프라인을 재귀 순회
  const tryInputs = ["ITEM", "NAME", "ITEM0", "ITEM1", "ITEM2", "ITEM3", "ITEM4"];
  for (const inputName of tryInputs) {
    const child = block.getInputTargetBlock?.(inputName);
    if (child) collectFromING(child, acc);
  }
  return acc;
}

/** -----------------------
 * 규칙 평가
 * ----------------------- */
function evaluateRule(actionType, summary) {
  const has = (f) => summary.set.has(f);

  switch (actionType) {
    case "slice": {
      // required: solid ; unrequired: liquid, powder, oil
      if (!has("solid")) {
        return { ok: false, error: "자르기는 고체 재료에만 가능해요." };
      }
      if (has("liquid") || has("powder") || has("oil")) {
        return { ok: false, error: "자르기는 액체/가루/기름 재료에는 사용할 수 없어요." };
      }
      return { ok: true };
    }

    case "fry": {
      // required: oil & (solid|powder) ; unrequired: liquid
      if (!has("oil")) {
        return { ok: false, error: "볶기에는 기름(식용유/버터 등)이 필요해요." };
      }
      if (!(has("solid") || has("powder"))) {
        return { ok: false, error: "볶기는 고체나 가루 재료와 함께 사용해야 해요." };
      }
      if (has("liquid")) {
        return { ok: false, error: "볶기에는 액체 재료는 적합하지 않아요." };
      }
      return { ok: true };
    }

    case "mix": {
      // required: 2+ ingredients
      if (summary.count < 2) {
        return { ok: false, error: "섞기는 재료가 2개 이상이어야 해요. '합치기' 블록으로 묶은 뒤 사용해 주세요." };
      }
      return { ok: true };
    }

    case "boil": {
      // required: liquid
      if (!has("liquid")) {
        return { ok: false, error: "끓이기는 액체 재료가 필요해요." };
      }
      return { ok: true };
    }

    case "grind": {
      // required: solid ; unrequired: powder
      if (summary.set.size === 0 || !has("solid")) {
        return { ok: false, error: "갈기는 고체 재료에만 사용할 수 있어요." };
      }
      if (has("powder")) {
        return { ok: false, error: "이미 가루 형태의 재료는 갈 수 없어요." };
      }
      return { ok: true };
    }

    case "simmer": {
      // required: liquid & solid
      if (!(has("liquid") && has("solid"))) {
        return { ok: false, error: "삶기는 액체와 고체 재료가 함께 있어야 해요." };
      }
      return { ok: true };
    }

    // 나머지(put 등): 허용
    default:
      return { ok: true };
  }
}

/** -----------------------
 * block.type → actionType
 * ----------------------- */
function getActionTypeFromBlockType(type) {
  const suffixes = ["_block", "_value_block"];
  for (const s of suffixes) {
    if (type.endsWith(s)) return type.slice(0, -s.length);
  }
  return null;
}

/** -----------------------
 * 설치
 *  - 연결 성립 시 규칙 검사
 *  - ING_NAME을 직접 꽂으려는 시도 차단 & 토스트
 *  - ING_NAME을 단독으로 끌어다 놓고 방치하면 가이드 토스트
 * ----------------------- */
export function installSemantics(workspace) {
  // 1) 연결 성립 시 검사
  const onMove = (ev) => {
    if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
    if (!ev.newParentId || !ev.newInputName) return;

    const parent = workspace.getBlockById(ev.newParentId);
    if (!parent || ev.newInputName !== "ITEM") return;

    const actionType = getActionTypeFromBlockType(parent.type);
    if (!actionType) return;

    const input = parent.getInput(ev.newInputName);
    const child = input?.connection?.targetBlock();
    if (!child) return;

    // ING_NAME을 직접 ITEM(ING)에 꽂으려는 시도 → 차단
    if (child.outputConnection) {
      const check = child.outputConnection.getCheck?.() || child.outputConnection.check_;
      if (check && (check.includes?.("ING_NAME") || check === "ING_NAME")) {
        try {
          input.connection.disconnect();
          child.bumpNeighbours();
        } catch {}
        showToast("재료 이름 블록은 먼저 '재료' 블록과 결합한 뒤 사용하세요.", "warn");
        return;
      }
    }

    // ING 체인의 합집합/개수 수집
    const summary = collectFromING(child, { count: 0, set: new Set() });
    if (!summary || summary.count === 0) return;

    const verdict = evaluateRule(actionType, summary);
    if (verdict.ok) return;

    // 불가 → 튕겨내기 + 토스트
    try {
      input.connection.disconnect();
      child.bumpNeighbours();
    } catch {}
    showToast(verdict.error || "이 조합은 사용할 수 없어요.", "error");
  };

  // 2) ING_NAME을 드롭해두는 경우(사용자가 바로 동작에 꽂으려다 실패) 가이드 토스트
  const onDrag = (ev) => {
    if (ev.type !== Blockly.Events.BLOCK_DRAG || !ev.isEnd) return;
    const b = workspace.getBlockById(ev.blockId);
    if (!b || !b.outputConnection) return;
    const check = b.outputConnection.getCheck?.() || b.outputConnection.check_;
    if (check && (check.includes?.("ING_NAME") || check === "ING_NAME")) {
      // 부모가 없으면(어디에도 연결 못 했으면) 안내
      if (!b.getParent()) {
        showToast("재료 이름 블록은 '재료' 블록의 이름 칸에 먼저 넣어주세요.", "warn");
      }
    }
  };

  workspace.addChangeListener(onMove);
  workspace.addChangeListener(onDrag);
}






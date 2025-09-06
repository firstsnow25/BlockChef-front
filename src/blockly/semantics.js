// src/blockly/semantics.js
import * as Blockly from "blockly";

/** Toast */
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

/** 재료 체인에서 features 수집 */
function getFeaturesFromAnyING(block) {
  if (!block) return null;
  if (block.type === "ingredient_block") {
    const nameBlock = block.getInputTargetBlock("NAME");
    if (nameBlock && nameBlock.data) {
      try {
        const meta = JSON.parse(nameBlock.data);
        return meta.features || null;
      } catch {}
    }
    return null;
  }
  const tryInputs = ["ITEM", "NAME", "ITEM0", "ITEM1", "ITEM2", "ITEM3"];
  for (const inputName of tryInputs) {
    const child = block.getInputTargetBlock?.(inputName);
    if (child) {
      const feats = getFeaturesFromAnyING(child);
      if (feats) return feats;
    }
  }
  return null;
}

/** ING_NAME(재료이름)인지 */
function isRawIngredientNameBlock(block) {
  return block?.outputConnection?.getCheck?.()?.includes?.("ING_NAME");
}

/** combine 체인 안에 ING 개수 대략 계산 */
function countINGChildren(block) {
  if (!block) return 0;
  if (block.type === "ingredient_block") return 1;

  // 재료 합치기
  if (block.type === "combine_block") {
    let n = 0, i = 0;
    while (block.getInput("ITEM" + i)) {
      n += countINGChildren(block.getInputTargetBlock("ITEM" + i));
      i++;
    }
    return n;
  }

  // ⭐ 동작 합치기(값 묶음)도 재료 개수 집계에 포함
  if (block.type === "action_combine_block") {
    let n = 0, i = 0;
    while (block.getInput("ITEM" + i)) {
      n += countINGChildren(block.getInputTargetBlock("ITEM" + i));
      i++;
    }
    return n;
  }

  // 일반 동작 값 블록 체인(ING을 ITEM 슬롯에 받음)
  const child = block.getInputTargetBlock?.("ITEM");
  if (child) return countINGChildren(child);
  return 0;
}

/** 동작 키 추출: foo_block / foo_value_block → foo */
function getActionTypeFromBlockType(type) {
  if (!type) return null;
  let t = String(type);
  // 1) 가장 긴 접미사부터 제거
  if (t.endsWith("_value_block")) t = t.slice(0, -"_value_block".length); // mix_value
  else if (t.endsWith("_block")) t = t.slice(0, -"_block".length);        // mix
  // 2) 남은 '_value'도 정규화
  if (t.endsWith("_value")) t = t.slice(0, -"_value".length);             // mix
  return t; // 'mix' / 'fry' / 'boil' / 'simmer' / 'slice' / 'put' ...
}

/** 동작 의미 규칙 평가 */
function evaluateRule(action, blockChainRoot) {
  function collectFeatures(b, bag = new Set()) {
    if (!b) return bag;

    if (b.type === "ingredient_block") {
      const feats = getFeaturesFromAnyING(b) || [];
      feats.forEach((f) => bag.add(f));
      return bag;
    }

    if (b.type === "combine_block" || b.type === "action_combine_block") {
      let i = 0;
      while (b.getInput("ITEM" + i)) {
        collectFeatures(b.getInputTargetBlock("ITEM" + i), bag);
        i++;
      }
      return bag;
    }

    const child = b.getInputTargetBlock?.("ITEM");
    if (child) return collectFeatures(child, bag);
    return bag;
  }

  const feats = Array.from(collectFeatures(blockChainRoot));
  const has = (f) => feats.includes(f);
  const ingCount = countINGChildren(blockChainRoot);

  switch (action) {
    case "slice":
      if (!has("solid")) return { ok: false, error: "자르기는 고체 재료에만 사용할 수 있어요." };
      return { ok: true };
    case "grind":
      if (!has("solid")) return { ok: false, error: "갈기는 고체 재료에만 사용할 수 있어요." };
      if (has("powder")) return { ok: true, warn: "이미 가루 상태예요. 갈 필요가 없을 수 있어요." };
      return { ok: true };
    case "mix":
      if (ingCount < 2) return { ok: false, error: "섞기는 재료 2개 이상이 필요해요. ‘합치기’ 블록으로 묶어 넣어주세요." };
      return { ok: true };
    case "fry":
      if (!has("oil")) return { ok: false, error: "볶기는 기름(oil)이 필요해요. 식용유/버터 등을 추가하세요." };
      if (!(has("solid") || has("powder"))) return { ok: false, error: "볶기는 고체 또는 가루 재료가 필요해요." };
      if (has("liquid")) return { ok: false, error: "볶기에는 보통 액체는 넣지 않아요." };
      return { ok: true };
    case "boil":
      if (!has("liquid")) return { ok: false, error: "끓이기는 액체가 필요해요. 물/간장 등 액체 재료를 포함하세요." };
      return { ok: true };
    case "simmer":
      if (!has("liquid") || !has("solid")) return { ok: false, error: "삶기는 액체와 고체 재료가 모두 필요해요." };
      return { ok: true };
    case "put":
      return { ok: true };
    default:
      return { ok: true };
  }
}

/** 설치 */
export function installSemantics(workspace) {
  let _squelch = false;
  const revertInvalid = () => {
    if (_squelch) return;
    _squelch = true;
    try { workspace.undo(false); } catch {}
    setTimeout(() => { _squelch = false; }, 0);
  };

  const onMove = (ev) => {
    if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
    if (_squelch) return;
    if (!ev.newParentId || !ev.newInputName) return;

    const parent = workspace.getBlockById(ev.newParentId);
    if (!parent) return;

    const inputName = ev.newInputName;
    const input = parent.getInput(inputName);
    if (!input) return;

    // ✅ ING_NAME → 계량블럭(NAME) 연결은 무조건 허용 (간섭 금지)
    if (parent.type === "ingredient_block" && inputName === "NAME") return;

    // ── A) 재료 합치기: ingredient_block만 허용 ─────────────────────────
    if (parent.type === "combine_block" && /^ITEM\d+$/.test(inputName)) {
      const child = input.connection && input.connection.targetBlock();
      if (!child) return;
      if (child.type !== "ingredient_block") {
        revertInvalid();
        showToast("재료 합치기에는 ‘재료’ 계량블록만 연결할 수 있어요.", "error");
      }
      return;
    }

    // ── B) 동작 합치기(준비된 재료): 동작 값/결과만 허용 ────────────────
    if (parent.type === "action_combine_block" && /^ITEM\d+$/.test(inputName)) {
      const child = input.connection && input.connection.targetBlock();
      if (!child) return;
      const checks = child.outputConnection?.getCheck?.() || [];
      const isName = isRawIngredientNameBlock(child);      // 재료 이름 블럭
      const isMeasured = child.type === "ingredient_block"; // 계량블럭
      const isActionLike = checks.includes("ING") || checks.includes("ACTION");
      if (isName || isMeasured || !isActionLike) {
        revertInvalid();
        showToast("동작 합치기에는 동작(값) 블록이나 결과 값만 연결할 수 있어요. 재료는 먼저 ‘재료’ 계량블록에 넣어 값을 만든 뒤 사용하세요.", "error");
      }
      return;
    }

    // ── C) 조리 & 조리값 공통 규칙: ‘ITEM’ 슬롯에만 적용 ────────────────
    if (inputName !== "ITEM") return;

    const actionType = getActionTypeFromBlockType(parent.type);
    if (!actionType) return; // 재료/흐름/합치기 등은 무시

    const child = input.connection && input.connection.targetBlock();
    if (!child) return;

    // 재료이름(ING_NAME)을 바로 꽂는 시도는 금지 (두 카테고리 공통)
    if (isRawIngredientNameBlock(child)) {
      revertInvalid();
      showToast("재료 이름은 먼저 ‘재료’ 계량블록에 넣은 뒤 사용 가능합니다.", "error");
      return;
    }

    // 동작 의미 규칙 (섞기 2개 이상 등) — 조리/조리값 동일하게 적용
    const verdict = evaluateRule(actionType, child);
    if (!verdict.ok) {
      revertInvalid();
      showToast(verdict.error || "이 조합은 사용할 수 없어요.", "error");
      return;
    }
    if (verdict.warn) showToast(verdict.warn, "warn");
  };

  workspace.addChangeListener(onMove);
}










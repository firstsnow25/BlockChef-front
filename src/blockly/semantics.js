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

  // 계량 블록이면 NAME 속에서 추출
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

  // combine 또는 value 체인 재귀 추적
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

/** ING_NAME(재료이름)인지 빠르게 확인 */
function isRawIngredientNameBlock(block) {
  return block?.outputConnection?.getCheck?.()?.includes?.("ING_NAME");
}

/** combine 체인 안에 ING가 몇 개 들어있는지 대략 계산(섞기/볶기 검사용) */
function countINGChildren(block) {
  if (!block) return 0;
  if (block.type === "ingredient_block") return 1;
  if (block.type === "combine_block") {
    let n = 0;
    let i = 0;
    while (block.getInput("ITEM" + i)) {
      const child = block.getInputTargetBlock("ITEM" + i);
      n += countINGChildren(child);
      i++;
    }
    return n;
  }
  // value 동작 블록 체인 안에 ingredient_block이 있을 수 있음
  const child = block.getInputTargetBlock?.("ITEM");
  if (child) return countINGChildren(child);
  return 0;
}

/** 동작 타입 추출 */
function getActionTypeFromBlockType(type) {
  const suffixes = ["_block", "_value_block"];
  for (const s of suffixes) if (type.endsWith(s)) return type.slice(0, -s.length);
  return null;
}

/** 규칙 평가 */
function evaluateRule(action, blockChainRoot) {
  // 재료 feature 모음(합치기면 첫 재료의 feature만 보지 않도록, 합치기 전체를 수집)
  // 간단화를 위해: 하나라도 해당 feature가 있으면 포함으로 본다.
  function collectFeatures(b, bag = new Set()) {
    if (!b) return bag;
    if (b.type === "ingredient_block") {
      const feats = getFeaturesFromAnyING(b) || [];
      feats.forEach((f) => bag.add(f));
      return bag;
    }
    if (b.type === "combine_block") {
      let i = 0;
      while (b.getInput("ITEM" + i)) {
        const child = b.getInputTargetBlock("ITEM" + i);
        collectFeatures(child, bag);
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
    case "slice": // 자르기: solid만
      if (!has("solid")) return { ok: false, error: "자르기는 고체 재료에만 사용할 수 있어요." };
      return { ok: true };

    case "grind": // 갈기: solid만, powder는 의미 없음
      if (!has("solid")) return { ok: false, error: "갈기는 고체 재료에만 사용할 수 있어요." };
      if (has("powder")) return { ok: true, warn: "이미 가루 상태예요. 갈 필요가 없을 수 있어요." };
      return { ok: true };

    case "mix": // 섞기: 재료 2개 이상
      if (ingCount < 2) return { ok: false, error: "섞기는 재료 2개 이상이 필요해요. ‘합치기’ 블록으로 묶어 넣어주세요." };
      return { ok: true };

    case "fry": // 볶기: oil 필수 + (solid 또는 powder), liquid 금지
      if (!has("oil")) return { ok: false, error: "볶기는 기름(oil)이 필요해요. 식용유/버터 등을 추가하세요." };
      if (!(has("solid") || has("powder"))) return { ok: false, error: "볶기는 고체 또는 가루 재료가 필요해요." };
      if (has("liquid")) return { ok: false, error: "볶기에는 보통 액체는 넣지 않아요." };
      // 재료가 2개 이상이면 더 자연스럽지만 필수는 아님
      return { ok: true };

    case "boil": // 끓이기: liquid 필수
      if (!has("liquid")) return { ok: false, error: "끓이기는 액체가 필요해요. 물/간장 등 액체 재료를 포함하세요." };
      return { ok: true };

    case "simmer": // 삶기: liquid + solid 필수
      if (!has("liquid") || !has("solid")) return { ok: false, error: "삶기는 액체와 고체 재료가 모두 필요해요." };
      return { ok: true };

    case "put": // 넣기: 제한 없음
      return { ok: true };

    default:
      return { ok: true };
  }
}

/** 설치 */
export function installSemantics(workspace) {
  const onMove = (ev) => {
    if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
    if (!ev.newParentId || !ev.newInputName) return;

    const parent = workspace.getBlockById(ev.newParentId);
    if (!parent) return;

    const inputName = ev.newInputName;
    const input = parent.getInput(inputName);
    if (!input) return;

    // ── A) 재료 합치기: ingredient_block만 허용 ─────────────────────────
    if (parent.type === "combine_block" && /^ITEM\d+$/.test(inputName)) {
      const child = input.connection && input.connection.targetBlock();
      if (!child) return;
      if (child.type !== "ingredient_block") {
        try { input.connection.disconnect(); child.bumpNeighbours?.(); } catch {}
        showToast("재료 합치기에는 ‘재료’ 계량블록만 연결할 수 있어요.", "error");
      }
      return; // 더 진행하지 않음
    }

    // ── B) 동작 합치기: ACTION 타입(동작값 블럭)만 허용 ───────────────────
    if (parent.type === "action_combine_block" && /^ITEM\d+$/.test(inputName)) {
      const child = input.connection && input.connection.targetBlock();
      if (!child) return;

      const checks = child.outputConnection?.getCheck?.() || [];
      const isActionLike = Array.isArray(checks) && checks.includes("ACTION");
      if (!isActionLike) {
        try { input.connection.disconnect(); child.bumpNeighbours?.(); } catch {}
        showToast("동작 합치기에는 동작(값) 블록만 연결할 수 있어요.", "error");
      }
      return; // 더 진행하지 않음
    }

    // ── C) 기존 조리 동작 룰(ITEM 입력에만 적용) ────────────────────────
    if (inputName !== "ITEM") return;

    const actionType = getActionTypeFromBlockType(parent.type);
    if (!actionType) return; // 재료/흐름/합치기 등은 무시

    const child = input.connection && input.connection.targetBlock();
    if (!child) return;

    // ING_NAME 직결 금지
    if (isRawIngredientNameBlock(child)) {
      try { input.connection.disconnect(); child.bumpNeighbours?.(); } catch {}
      showToast("재료 이름은 먼저 ‘재료’ 계량블록에 넣은 뒤 사용 가능합니다.", "error");
      return;
    }

    // 동작별 의미 검증
    const verdict = evaluateRule(actionType, child);
    if (!verdict.ok) {
      try { input.connection.disconnect(); child.bumpNeighbours?.(); } catch {}
      showToast(verdict.error || "이 조합은 사용할 수 없어요.", "error");
    } else if (verdict.warn) {
      showToast(verdict.warn, "warn");
    }
  };

  workspace.addChangeListener(onMove);
}






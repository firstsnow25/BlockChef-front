// src/blockly/semantics.js
import * as Blockly from "blockly";

/** -----------------------
 * 토스트 (항상 화면에 보이도록 fixed)
 * ----------------------- */
export function showToast(msg, level = "error") {
  let el = document.getElementById("blockchef-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "blockchef-toast";
    el.style.position = "fixed";           // ✅ fixed로 변경
    el.style.right = "16px";
    el.style.bottom = "16px";
    el.style.zIndex = "999999";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "10px";
    el.style.color = "#fff";
    el.style.fontSize = "12px";
    el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
  }
  el.style.background =
    level === "warn" ? "rgba(255,165,0,0.95)" : "rgba(255,83,83,0.95)"; // 주황/빨강
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = "0"), 1800);
}

/** -----------------------
 * feature 추출 유틸
 *  - ingredient_block 내부 NAME → ingredient_name_* 의 data.features
 * ----------------------- */
function getFeaturesFromAnyING(block) {
  if (!block) return null;

  // 1) 재료 계량 블록이라면: NAME 입력에서 재료 이름 찾기
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

  // 2) combine_block 같은 ING-value 체인은 가장 안쪽 ingredient_block을 찾음
  //    value 출력 체인: (어떤_동작_value_block) → ... → ingredient_block
  //    재귀적으로 ITEM/NAME 입력을 추적
  const tryInputs = ["ITEM", "NAME", "ITEM0", "ITEM1", "ITEM2"];
  for (const inputName of tryInputs) {
    const child = block.getInputTargetBlock?.(inputName);
    if (child) {
      const feats = getFeaturesFromAnyING(child);
      if (feats) return feats;
    }
  }
  return null;
}

/** -----------------------
 * 규칙 평가
 * actionType: "slice" | "fry" | ...
 * features: ["solid","powder",...]
 * return {ok:boolean, warn?:string, error?:string}
 * ----------------------- */
function evaluateRule(actionType, features) {
  if (!features || !features.length) return { ok: true };

  const has = (f) => features.includes(f);

  switch (actionType) {
    /** 절대 불가 계열(예시) */
    case "peel": // 껍질 벗기기
    case "crack": // 깨기
      if (has("liquid") || has("powder")) {
        return { ok: false, error: `해당 동작은 ${has("liquid") ? "액체" : "가루"} 재료에 사용할 수 없어요.` };
      }
      return { ok: true };

    case "remove_seed": // 씨 제거하기
      // 씨가 없는 재료는 대부분 불가. 고추 정도만 허용(leafy+solid 조합 예시)
      if (!(has("solid"))) {
        return { ok: false, error: "씨 제거는 고체 재료에만 가능해요." };
      }
      return { ok: true };

    /** 일반적으로 가능한/비권장 케이스 */
    case "slice": // 썰기
      if (has("liquid") || has("powder")) {
        return { ok: false, error: "썰기는 액체/가루에 사용할 수 없어요." };
      }
      return { ok: true };

    case "fry": // 볶기
      // 사용자 의견 반영: 소금(가루) 볶기는 풍미용으로 허용
      return { ok: true };

    case "boil": // 끓이기
      // 사용자 의견 반영: 김가루 등 가루도 국물에 넣어 끓일 수 있음 → 허용
      return { ok: true };

    case "steam": // 찌기
      // 액체/가루 찌기는 비권장 (하지만 막진 않음)
      if (has("liquid") || has("powder")) {
        return { ok: true, warn: "일반적이진 않아요. 이 조합이 맞는지 확인해보세요." };
      }
      return { ok: true };

    case "grill": // 굽기
    case "deepfry": // 튀기기
      // 액체/가루 바로 굽기/튀기기는 비권장
      if (has("liquid") || has("powder")) {
        return { ok: true, warn: "이 동작은 보통 고체류에 적용돼요. 그래도 진행할게요." };
      }
      return { ok: true };

    case "mix": // 섞기
    case "put": // 넣기
    case "wait": // 기다리기
      return { ok: true };
  }

  return { ok: true };
}

/** -----------------------
 * action 블록의 actionType 구하기
 *  - *_block, *_value_block → 접두사 추출
 * ----------------------- */
function getActionTypeFromBlockType(type) {
  const suffixes = ["_block", "_value_block"];
  for (const s of suffixes) {
    if (type.endsWith(s)) return type.slice(0, -s.length);
  }
  return null;
}

/** -----------------------
 * 설치: 연결 시 검증 + 불가면 자동 분리 + 토스트 알림
 * ----------------------- */
export function installSemantics(workspace) {
  // MOVE 이벤트를 통해 연결이 성립하는 순간을 잡는다.
  const onMove = (ev) => {
    if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
    if (!ev.newParentId && !ev.newInputName) return; // 연결이 성립된 move만 관심

    const block = workspace.getBlockById(ev.blockId);
    if (!block) return;

    // 값 연결만 검사: 동작 블록의 ITEM 입력에 무언가가 연결될 때
    // parent: 연결 '받는' 블록, child: 연결 '들어오는' 블록
    const parent = workspace.getBlockById(ev.newParentId);
    if (!parent || !ev.newInputName) return;

    const inputName = ev.newInputName;
    const input = parent.getInput(inputName);
    if (!input || input.name !== "ITEM") return; // 동작 블록의 ITEM만 검사

    const actionType = getActionTypeFromBlockType(parent.type);
    if (!actionType) return;

    const child = input.connection && input.connection.targetBlock();
    if (!child) return;

    // 연결된 값(ING 체인)에서 features 뽑기
    const feats = getFeaturesFromAnyING(child);
    if (!feats) return;

    const verdict = evaluateRule(actionType, feats);

    if (verdict.ok && !verdict.warn) return;

    if (!verdict.ok) {
      // ❌ 불가: 연결 끊기 + 토스트 + 살짝 되돌리기
      try {
        input.connection.disconnect();
        // 살짝 튕겨내기(시각적 피드백)
        const xy = child.getRelativeToSurfaceXY();
        child.moveBy(12, -12);
        child.moveBy(-12, 12);
      } catch {}
      showToast(verdict.error || "이 조합은 사용할 수 없어요.", "error");
      return;
    }

    // ⚠ 비권장: 연결은 유지하지만 경고 토스트
    if (verdict.warn) {
      showToast(verdict.warn, "warn");
    }
  };

  workspace.addChangeListener(onMove);
}



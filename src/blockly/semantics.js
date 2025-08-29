import * as Blockly from "blockly";

/** -----------------------
 * 토스트 (fixed)
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
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
  }
  el.style.background =
    level === "warn" ? "rgba(255,165,0,0.95)" : "rgba(255,83,83,0.95)";
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = "0"), 1800);
}

/** =========================================================
 * ING 체인에서 "모든 재료"의 feature 수집
 *  - ingredient_block → NAME.data.features
 *  - combine_block   → ITEM0..N 모두 재귀 수집
 *  - *_value_block   → ITEM을 재귀 추적
 *  - 단일 재료만 있으면 length=1 배열 반환
 * ========================================================= */
function collectFeatures(block, out = []) {
  if (!block) return out;

  // 1) 최종 재료: ingredient_block
  if (block.type === "ingredient_block") {
    const nameBlock = block.getInputTargetBlock("NAME");
    if (nameBlock && nameBlock.data) {
      try {
        const meta = JSON.parse(nameBlock.data);
        const feats = meta.features || [];
        // features는 새 스펙: solid | liquid | oil | powder
        if (Array.isArray(feats) && feats.length) {
          out.push(feats);
        }
      } catch {}
    }
    return out;
  }

  // 2) 합치기: combine_block → ITEM0..ITEMN 반복
  if (block.type === "combine_block") {
    // itemCount_를 믿을 수 없으니 존재하는 입력만 순회
    for (let i = 0; i < 20; i++) {
      const inp = block.getInput("ITEM" + i);
      if (!inp) break;
      const child = inp.connection && inp.connection.targetBlock();
      if (child) collectFeatures(child, out);
    }
    return out;
  }

  // 3) 그 외 value-체인: ITEM 또는 NAME을 재귀 추적
  const tryInputs = ["ITEM", "NAME"];
  for (const inputName of tryInputs) {
    const child = block.getInputTargetBlock?.(inputName);
    if (child) collectFeatures(child, out);
  }
  return out;
}

/** -----------------------
 * util: 배열 특징 체크
 * featsArr: [ ["solid"], ["oil"], ... ]
 * ----------------------- */
function hasAny(featsArr, key) {
  return featsArr.some((fs) => fs.includes(key));
}
function everyAre(featsArr, key) {
  return featsArr.length > 0 && featsArr.every((fs) => fs.includes(key));
}
function count(featsArr) {
  return featsArr.length;
}

/** -----------------------
 * 동작 타입 추출
 * (block.type: 'slice_block' / 'slice_value_block' → 'slice')
 * ----------------------- */
function getActionTypeFromBlockType(type) {
  const suffixes = ["_block", "_value_block"];
  for (const s of suffixes) {
    if (type.endsWith(s)) return type.slice(0, -s.length);
  }
  return null;
}

/** =========================================================
 * 규칙 평가
 *
 * 신 규격 features: 'solid' | 'liquid' | 'oil' | 'powder'
 * 동작:
 *  - slice(자르기)     : required solid              / unrequired liquid, powder, oil(=불가)
 *  - fry(볶기)         : required (oil AND (solid|powder)) / unrequired liquid(=경고만)
 *  - mix(섞기)         : required 재료 2개 이상
 *  - put(넣기)         : 아무거나
 *  - boil(끓이기)      : required liquid
 *  - grind(갈기)       : required solid / unrequired powder
 *  - simmer(삶기)      : required (liquid AND solid)
 *
 * return { ok:boolean, warn?:string, error?:string }
 * ========================================================= */
function evaluateRule(actionType, featsArr) {
  const n = count(featsArr);
  const hasSolid = hasAny(featsArr, "solid");
  const hasLiquid = hasAny(featsArr, "liquid");
  const hasOil = hasAny(featsArr, "oil");
  const hasPowder = hasAny(featsArr, "powder");

  switch (actionType) {
    case "slice": // 자르기
      // 모든 재료가 solid 여야 함
      if (!everyAre(featsArr, "solid")) {
        return { ok: false, error: "자르기는 고체 재료에만 사용할 수 있어요." };
      }
      return { ok: true };

    case "fry": // 볶기
      // 반드시 기름 + (고체 또는 가루) 동시 포함
      if (!hasOil || !(hasSolid || hasPowder)) {
        return {
          ok: false,
          error: "볶기에는 기름과 (고체 또는 가루) 재료가 함께 필요해요.",
        };
      }
      // 액체가 섞여 있으면 비권장
      if (hasLiquid) {
        return { ok: true, warn: "볶기에는 액체는 보통 사용하지 않아요." };
      }
      return { ok: true };

    case "mix": // 섞기
      if (n < 2) {
        return { ok: false, error: "섞기에는 재료가 2개 이상 필요해요." };
      }
      return { ok: true };

    case "put": // 넣기
      return { ok: true };

    case "boil": // 끓이기
      if (!hasLiquid) {
        return { ok: false, error: "끓이기에는 액체 재료가 필요해요." };
      }
      return { ok: true };

    case "grind": // 갈기
      if (!hasSolid) {
        return { ok: false, error: "갈기에는 고체 재료가 필요해요." };
      }
      // 가루만 있거나, 가루가 섞여 있으면 안내
      if (!hasSolid && hasPowder) {
        // 위에서 이미 잡히지만 안전망
        return { ok: false, error: "이미 가루 상태예요. 갈 필요가 없어요." };
      }
      if (hasPowder) {
        return { ok: true, warn: "가루 재료는 이미 곱게 되어 있어요." };
      }
      return { ok: true };

    case "simmer": // 삶기 (동일 키가 없다면 block 타입을 'simmer_*'로 만들어 주세요)
    case "boil_soft":
    case "life": // 혹시 팀에서 임시 키를 썼다면 안전망
      if (!(hasLiquid && hasSolid)) {
        return {
          ok: false,
          error: "삶기에는 액체와 고체 재료가 함께 필요해요.",
        };
      }
      return { ok: true };

    default:
      // 규칙이 아직 정의되지 않은 동작은 통과
      return { ok: true };
  }
}

/** =========================================================
 * 설치: 연결 순간 검증
 *  - 불가: 연결 해제 + 튕김(bump) + 빨간 토스트
 *  - 경고: 연결 유지 + 주황 토스트
 * ========================================================= */
export function installSemantics(workspace) {
  const onMove = (ev) => {
    if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
    if (!ev.newParentId || !ev.newInputName) return;

    const parent = workspace.getBlockById(ev.newParentId);
    if (!parent) return;

    // 동작 블록의 값 입력 이름은 모두 'ITEM'로 가정
    if (ev.newInputName !== "ITEM") return;

    const actionType = getActionTypeFromBlockType(parent.type);
    if (!actionType) return;

    const input = parent.getInput(ev.newInputName);
    const child = input?.connection?.targetBlock();
    // ING_NAME을 직접 ITEM(ING)에 꽂으려는 시도 차단 + 안내
    if (child?.outputConnection) {
      const check = child.outputConnection.getCheck?.() || child.outputConnection.check_;
      if (check && (check.includes?.("ING_NAME") || check === "ING_NAME")) {
        try { input.connection.disconnect(); child.bumpNeighbours(); } catch {}
        showToast("재료 이름 블록은 먼저 '재료' 블록과 결합한 뒤 사용하세요.", "warn");
        return;
      }
    }
    if (!child) return;

    // 🔎 연결된 값 체인에서 모든 재료 feature 수집
    const featsArr = collectFeatures(child);

    // 재료가 하나도 파악되지 않으면 패스(사용자 입력 미완성)
    if (!featsArr.length) return;

    const verdict = evaluateRule(actionType, featsArr);

    if (!verdict.ok) {
      try {
        // ❌ 불가: 연결 해제 + 살짝 튕겨내기(기존 UX 유지)
        input.connection.disconnect();
        child.bumpNeighbours(); // 워크스페이스 안쪽으로 밀어냄
      } catch {}
      showToast(verdict.error || "이 조합은 사용할 수 없어요.", "error");
      return;
    }

    if (verdict.warn) {
      // ⚠ 비권장: 연결은 유지
      showToast(verdict.warn, "warn");
    }
  };

  workspace.addChangeListener(onMove);
}





// src/blockly/semantics.js
import * as Blockly from "blockly";

export function installSemantics(workspace) {
  const showToast = (msg) => {
    let el = document.getElementById("blockchef-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "blockchef-toast";
      el.style.position = "absolute";
      el.style.right = "16px";
      el.style.bottom = "16px";
      el.style.zIndex = 9999;
      el.style.padding = "8px 12px";
      el.style.borderRadius = "8px";
      el.style.background = "rgba(255,83,83,.95)";
      el.style.color = "#fff";
      el.style.fontSize = "12px";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,.15)";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.opacity = "0"), 1500);
  };

  // helper: ING 블록에서 feature 읽기
  function getFeaturesFromIng(ingBlock) {
    // case 1) ingredient_block(ING) → 자식 NAME(ING_NAME) 블록의 data에서 가져오기
    const nameInput = ingBlock.getInput("NAME");
    if (nameInput?.connection?.targetBlock()) {
      const nameBlock = nameInput.connection.targetBlock();
      try {
        const meta = nameBlock.data ? JSON.parse(nameBlock.data) : {};
        if (Array.isArray(meta.features)) return meta.features;
      } catch {}
    }
    // case 2) 값 동작의 출력이 다시 ING일 수 있으므로, 내부 연결에서 NAME 탐색
    for (const input of ingBlock.inputList || []) {
      if (input.connection?.targetBlock?.()) {
        const child = input.connection.targetBlock();
        const feats = getFeaturesFromIng(child);
        if (feats?.length) return feats;
      }
    }
    return [];
  }

  // 규칙 테이블
  const hardDeny = {
    slice:   (feats)=> feats.includes("powder") || feats.includes("liquid"),
    peel:    (feats)=> feats.includes("powder") || feats.includes("liquid"),
    crack:   (feats)=> !(feats.includes("egg")), // 달걀만 가능
    remove_seed: (feats)=> feats.includes("powder") || feats.includes("liquid"),
    grill:   (feats)=> feats.includes("liquid"), // 순수 액체만 굽기 불허
    deepfry: (feats)=> feats.includes("liquid"), // 순수 액체만 튀기기 불허
    fry:     (feats)=> false,  // 소금 볶기 허용(풍미)
    steam:   (feats)=> false,
    boil:    (feats)=> false,  // 끓이기: 고체/가루/액체 모두 허용
    mix:     (feats)=> false,
    put:     (feats)=> false,
    wait:    (feats)=> false,
  };

  const denyMsg = {
    slice:   "썰기는 가루/액체 재료에 사용할 수 없어요.",
    peel:    "껍질 벗기기는 가루/액체 재료에 사용할 수 없어요.",
    crack:   "깨기는 달걀 같은 재료만 가능해요.",
    remove_seed: "씨 제거하기는 가루/액체 재료에 사용할 수 없어요.",
    grill:   "액체만 단독으로 굽는 동작은 허용되지 않아요.",
    deepfry: "액체만 단독으로 튀기기는 허용되지 않아요.",
  };

  function isActionBlockType(type) {
    return /_(block|value_block)$/.test(type) && !/^ingredient_/.test(type);
  }

  workspace.addChangeListener((ev) => {
    if (ev.type !== Blockly.Events.BLOCK_MOVE && ev.type !== Blockly.Events.BLOCK_CHANGE) return;

    const blk = workspace.getBlockById?.(ev.blockId);
    if (!blk) return;

    // 동작 블록의 ITEM 입력에 뭔가 연결될 때 검사
    if (isActionBlockType(blk.type)) {
      const itemInput = blk.getInput("ITEM");
      if (!itemInput) return; // wait_block 등

      const ing = itemInput.connection?.targetBlock?.();
      if (!ing) return;

      // ING 타입만 받도록 blocks.js에서 setCheck로 막아두었지만,
      // 혹시라도 연결 직후에 feature 규칙도 추가로 점검
      const feats = getFeaturesFromIng(ing) || [];
      const key = blk.type.replace(/_(value_)?block$/,""); // ex) slice_block → slice

      const deny = hardDeny[key]?.(feats);
      if (deny) {
        // 연결 해제 + 안내 토스트
        workspace.undo(false); // 마지막 연결 취소
        showToast(denyMsg[key] || "이 동작에 맞지 않는 재료예요.");
      }
    }
  });
}



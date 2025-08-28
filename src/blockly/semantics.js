// src/blockly/semantics.js
import * as Blockly from "blockly";

/** -----------------------
 * 토스트
 * ----------------------- */
export function showToast(msg, level="error") {
  let el=document.getElementById("blockchef-toast");
  if(!el){
    el=document.createElement("div");
    el.id="blockchef-toast";
    el.style.position="fixed"; el.style.right="16px"; el.style.bottom="16px";
    el.style.zIndex="999999"; el.style.padding="10px 12px"; el.style.borderRadius="10px";
    el.style.color="#fff"; el.style.fontSize="12px"; el.style.boxShadow="0 4px 12px rgba(0,0,0,0.2)";
    document.body.appendChild(el);
  }
  el.style.background= level==="warn" ? "rgba(255,165,0,0.95)" : "rgba(255,83,83,0.95)";
  el.textContent=msg; el.style.opacity="1"; clearTimeout(el._t);
  el._t=setTimeout(()=>el.style.opacity="0",1800);
}

/** -----------------------
 * feature 추출
 * ----------------------- */
function getFeaturesFromAnyING(block){
  if(!block) return null;
  if(block.type==="ingredient_block"){
    const nameBlock=block.getInputTargetBlock("NAME");
    if(nameBlock&&nameBlock.data){
      try{const meta=JSON.parse(nameBlock.data); return meta.features||null;}catch{}
    }
    return null;
  }
  const tryInputs=["ITEM","NAME","ITEM0","ITEM1","ITEM2"];
  for(const inputName of tryInputs){
    const child=block.getInputTargetBlock?.(inputName);
    if(child){const feats=getFeaturesFromAnyING(child); if(feats) return feats;}
  }
  return null;
}

/** -----------------------
 * 규칙 평가 (허용/불가만)
 * ----------------------- */
function evaluateRule(actionType, features){
  if(!features) return {ok:true};
  const has=(f)=>features.includes(f);

  switch(actionType){
    case "slice":
      if(has("liquid")||has("powder")) return {ok:false,error:"썰기는 액체/가루에 사용할 수 없어요."};
      return {ok:true};
    case "peel":
    case "crack":
      if(has("liquid")||has("powder")) return {ok:false,error:"액체/가루는 껍질 벗기거나 깰 수 없어요."};
      return {ok:true};
    case "remove_seed":
      if(!has("solid")) return {ok:false,error:"씨 제거는 고체 재료에만 가능해요."};
      return {ok:true};
    default:
      return {ok:true};
  }
}

/** -----------------------
 * actionType 추출
 * ----------------------- */
function getActionTypeFromBlockType(type){
  const suffixes=["_block","_value_block"];
  for(const s of suffixes){ if(type.endsWith(s)) return type.slice(0,-s.length);}
  return null;
}

/** -----------------------
 * 설치
 * ----------------------- */
export function installSemantics(workspace){
  const onMove=(ev)=>{
    if(ev.type!==Blockly.Events.BLOCK_MOVE) return;
    if(!ev.newParentId||!ev.newInputName) return;

    const parent=workspace.getBlockById(ev.newParentId);
    if(!parent||!ev.newInputName) return;
    if(ev.newInputName!=="ITEM") return;

    const actionType=getActionTypeFromBlockType(parent.type);
    if(!actionType) return;

    const input=parent.getInput(ev.newInputName);
    const child=input?.connection?.targetBlock();
    if(!child) return;

    const feats=getFeaturesFromAnyING(child);
    if(!feats) return;

    const verdict=evaluateRule(actionType,feats);
    if(verdict.ok) return;

    try{
      input.connection.disconnect();
      child.bumpNeighbours();
    }catch{}
    showToast(verdict.error||"이 조합은 사용할 수 없어요.","error");
  };
  workspace.addChangeListener(onMove);
}




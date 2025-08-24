// src/components/BlocklyArea.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as Blockly from "blockly";
import "blockly/blocks"; // 기본 블록(필요시)
import "../blockly/blockly.css"; // 스타일

// NOTE: catalog는 기존 파일 그대로 사용한다고 가정
import { CATALOG } from "../blockly/catalog";

// 좌측 팔레트의 각 블록 높이/간격(겹침 방지)
const PALETTE_BLOCK_HEIGHT = 56; // 대략적인 높이
const PALETTE_BLOCK_GAP = 12;

/** 화면 좌표(clientX/Y)를 workspace 좌표로 바꾸기 */
function clientToWsXY(workspace, clientX, clientY) {
  const metrics = workspace.getMetrics();
  const scale = workspace.scale;
  const wsOrigin = workspace.getParentSvg().getBoundingClientRect();
  const x = (clientX - wsOrigin.left + workspace.scrollX) / scale;
  const y = (clientY - wsOrigin.top + workspace.scrollY) / scale;
  return new Blockly.utils.Coordinate(x, y);
}

/** 팔레트 → 작업영역 드래그가 끝났는지, 그리고 작업영역 위인지 확인 */
function isOverElement(clientX, clientY, elem) {
  const r = elem.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

const BlocklyArea = forwardRef(function BlocklyArea(
  { initialXml = "", onXmlChange, activeCategory = "재료" },
  ref
) {
  const containerRef = useRef(null);

  // 두 개의 워크스페이스(DOM)
  const paletteDivRef = useRef(null);
  const workspaceDivRef = useRef(null);

  const paletteWsRef = useRef(null);   // readOnly
  const mainWsRef = useRef(null);      // 편집용

  // 경계(팔레트 오른쪽) 기준을 위해 DOMRect 캐싱
  const [paletteRightEdge, setPaletteRightEdge] = useState(0);

  // 드래그 복제용 임시 상태
  const dragState = useRef({
    dragging: false,
    ghost: null,
    blockXmlText: "",
  });

  // ====== 외부 노출 API ======
  useImperativeHandle(ref, () => ({
    getXml() {
      if (!mainWsRef.current) return "";
      const dom = Blockly.Xml.workspaceToDom(mainWsRef.current);
      return Blockly.Xml.domToText(dom);
    },
    loadXml(xmlText) {
      if (!mainWsRef.current) return;
      mainWsRef.current.clear();
      if (xmlText) {
        const dom = Blockly.Xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(dom, mainWsRef.current);
      }
    },
    clear() {
      mainWsRef.current?.clear();
    },
    undo() {
      mainWsRef.current && Blockly.Events.setGroup(true) && mainWsRef.current.undo(false);
    },
    redo() {
      mainWsRef.current && Blockly.Events.setGroup(true) && mainWsRef.current.undo(true);
    },
  }));

  // ====== 초기 세팅: 팔레트WS(readOnly) + 메인WS(편집) 생성 ======
  useEffect(() => {
    if (!containerRef.current) return;

    // DOM 구조: [팔레트][세로분리선][작업영역]
    const paletteDiv = document.createElement("div");
    const splitter = document.createElement("div");
    const workspaceDiv = document.createElement("div");
    paletteDivRef.current = paletteDiv;
    workspaceDivRef.current = workspaceDiv;

    paletteDiv.style.width = "260px";
    paletteDiv.style.height = "100%";
    paletteDiv.style.overflow = "hidden";

    splitter.style.width = "1px";
    splitter.style.background = "#e5e7eb";

    workspaceDiv.style.flex = "1";
    workspaceDiv.style.height = "100%";

    containerRef.current.innerHTML = "";
    containerRef.current.style.display = "flex";
    containerRef.current.appendChild(paletteDiv);
    containerRef.current.appendChild(splitter);
    containerRef.current.appendChild(workspaceDiv);

    // 팔레트 워크스페이스 (readOnly)
    const paletteWs = Blockly.inject(paletteDiv, {
      readOnly: true,
      scrollbars: true,
      sounds: false,
      trashcan: false,
      move: { scrollbars: true, drag: false, wheel: true },
      zoom: { startScale: 0.9, controls: false, wheel: false, pinch: false },
      renderer: "zelos",
    });
    paletteWsRef.current = paletteWs;

    // 메인 워크스페이스
    const mainWs = Blockly.inject(workspaceDiv, {
      toolbox: null, // 기본 툴박스 OFF
      scrollbars: true,
      move: { scrollbars: true, drag: true, wheel: false },
      zoom: { startScale: 0.9, controls: true, wheel: true, pinch: true, maxScale: 2, minScale: 0.5 },
      renderer: "zelos",
      grid: { spacing: 24, length: 3, colour: "#eee", snap: false },
      trashcan: true,
    });
    mainWsRef.current = mainWs;

    // XML 동기화
    const listener = () => {
      if (!onXmlChange) return;
      const dom = Blockly.Xml.workspaceToDom(mainWs);
      onXmlChange(Blockly.Xml.domToText(dom));
    };
    mainWs.addChangeListener(listener);

    // “되돌리기용 좌표” 저장 + 팔레트 침범 시 원위치
    let prevXY = new Map(); // blockId -> {x,y}
    mainWs.addChangeListener((e) => {
      if (e.type === Blockly.Events.BLOCK_MOVE) {
        const block = mainWs.getBlockById(e.blockId);
        if (!block) return;

        if (!e.isStart && e.newCoordinate) {
          // move 중
        }
        if (e.isStart) {
          const { x, y } = block.getRelativeToSurfaceXY();
          prevXY.set(block.id, { x, y });
        }
        if (e.isEnd) {
          // 팔레트 오른쪽 경계를 넘어왔는지 확인(경계 기준: 팔레트 DOM의 right)
          const wsSvgRect = workspaceDiv.getBoundingClientRect();
          const palRect = paletteDiv.getBoundingClientRect();
          setPaletteRightEdge(palRect.right);

          // 블록의 화면 좌표 대충 계산
          const bxy = block.getSvgRoot().getBoundingClientRect();
          const overlapsPalette = bxy.left < palRect.right; // 팔레트 영역 또는 경계 침범

          if (overlapsPalette) {
            const p = prevXY.get(block.id);
            if (p) {
              block.moveTo(new Blockly.utils.Coordinate(p.x, p.y));
            }
          }
        }
      }
    });

    // 초기 XML 로드
    if (initialXml) {
      try {
        const dom = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, mainWs);
      } catch {
        // 무시
      }
    }

    // 언마운트
    return () => {
      mainWs.dispose();
      paletteWs.dispose();
    };
  }, []); // 최초 1회

  // ====== 팔레트 재구성(카테고리 전환 시) ======
  useEffect(() => {
    const paletteWs = paletteWsRef.current;
    const mainWs = mainWsRef.current;
    const paletteDiv = paletteDivRef.current;
    const workspaceDiv = workspaceDivRef.current;
    if (!paletteWs || !paletteDiv || !workspaceDiv) return;

    // 팔레트 비우고 해당 카테고리 블록을 세로로 배치 (겹침 방지)
    paletteWs.clear();
    const list = CATALOG[activeCategory] || [];
    let yCursor = 10;

    list.forEach((entry, idx) => {
      // 팔레트에 보여줄 미니 블록 (readOnly이므로 직접 top block으로 생성)
      const b = paletteWs.newBlock(entry.type);
      // 고정값이 있으면 setFieldValue
      if (entry.fields) {
        Object.entries(entry.fields).forEach(([k, v]) => {
          try {
            b.setFieldValue(String(v), k);
          } catch {}
        });
      }
      // 팔레트 블록은 움직이지 않도록
      b.setMovable(false);
      b.setDeletable(false);
      b.initSvg();
      b.render();

      // 위치 지정(겹치지 않도록)
      b.moveBy(12, yCursor);
      yCursor += PALETTE_BLOCK_HEIGHT + PALETTE_BLOCK_GAP;

      // === 드래그해서 작업영역에 "복사" 생성 ===
      // palette는 readOnly라 블록 자체를 드래깅할 수 없으니,
      // mousedown에 맞춰 ‘유령’ div를 띄우고 mouseup 때 workspace에 붙여준다.
      const root = b.getSvgRoot();
      if (!root) return;

      const onMouseDown = (ev) => {
        ev.preventDefault();

        dragState.current.dragging = true;
        // 블록 xml
        const xml = Blockly.Xml.blockToDom(b, true); // withXY = true
        dragState.current.blockXmlText = Blockly.Xml.domToText(xml);

        // 유령(드래그 프리뷰)
        const ghost = document.createElement("div");
        ghost.style.position = "fixed";
        ghost.style.pointerEvents = "none";
        ghost.style.left = ev.clientX + "px";
        ghost.style.top = ev.clientY + "px";
        ghost.style.width = "140px";
        ghost.style.height = "36px";
        ghost.style.border = "1px dashed #aaa";
        ghost.style.borderRadius = "6px";
        ghost.style.background = "#fafafa";
        ghost.style.boxShadow = "0 2px 6px rgba(0,0,0,.15)";
        ghost.style.zIndex = "99999";
        ghost.style.transform = "translate(-50%,-50%)";
        document.body.appendChild(ghost);
        dragState.current.ghost = ghost;

        const onMove = (e2) => {
          if (!dragState.current.dragging) return;
          ghost.style.left = e2.clientX + "px";
          ghost.style.top = e2.clientY + "px";
        };

        const onUp = (e2) => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);

          // 작업영역 위에서 놓였는지
          const overMain = isOverElement(e2.clientX, e2.clientY, workspaceDiv);
          if (overMain && dragState.current.blockXmlText) {
            try {
              const ws = mainWs;
              const xmlDom = Blockly.Xml.textToDom(dragState.current.blockXmlText);
              const newBlock = Blockly.Xml.domToBlock(xmlDom, ws);
              // 떨어뜨린 위치로 이동
              const xy = clientToWsXY(ws, e2.clientX, e2.clientY);
              newBlock.moveTo(xy);
              newBlock.select();
            } catch {}
          }

          // 유령 제거
          dragState.current.ghost?.remove();
          dragState.current.ghost = null;
          dragState.current.dragging = false;
          dragState.current.blockXmlText = "";
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      };

      // 팔레트 블록 루트에 리스너 부착
      root.addEventListener("mousedown", onMouseDown);
      // 정리: 팔레트가 다시 그려질 때 자동 dispose되므로 별도 제거는 생략
    });

    // 팔레트 경계(오른쪽) 갱신
    setTimeout(() => {
      const palRect = paletteDiv.getBoundingClientRect();
      setPaletteRightEdge(palRect.right);
    }, 0);
  }, [activeCategory]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
});

export default BlocklyArea;













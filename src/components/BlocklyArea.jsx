// src/components/BlocklyArea.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import "../blockly/blockly.css";
import { CATALOG } from "../blockly/catalog";

const PALETTE_BLOCK_HEIGHT = 56;
const PALETTE_BLOCK_GAP = 12;

function clientToWsXY(workspace, clientX, clientY) {
  const scale = workspace.scale;
  const wsRect = workspace.getParentSvg().getBoundingClientRect();
  const x = (clientX - wsRect.left + workspace.scrollX) / scale;
  const y = (clientY - wsRect.top + workspace.scrollY) / scale;
  return new Blockly.utils.Coordinate(x, y);
}
function isOverElement(x, y, elem) {
  const r = elem.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

const BlocklyArea = forwardRef(function BlocklyArea(
  { initialXml = "", onXmlChange, activeCategory = "재료" },
  ref
) {
  const hostRef = useRef(null);
  const paletteDivRef = useRef(null);
  const workDivRef = useRef(null);

  const paletteWsRef = useRef(null);
  const mainWsRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getXml() {
      const ws = mainWsRef.current;
      if (!ws) return "";
      const dom = Blockly.Xml.workspaceToDom(ws);
      return Blockly.Xml.domToText(dom);
    },
    loadXml(xml) {
      const ws = mainWsRef.current;
      if (!ws) return;
      ws.clear();
      if (xml) {
        const dom = Blockly.Xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, ws);
      }
    },
    clear() {
      mainWsRef.current?.clear();
    },
    undo() {
      mainWsRef.current && mainWsRef.current.undo(false);
    },
    redo() {
      mainWsRef.current && mainWsRef.current.undo(true);
    },
  }));

  // 최초 1회: 팔레트 WS + 메인 WS 구성
  useEffect(() => {
    if (!hostRef.current) return;

    const paletteDiv = document.createElement("div");
    const splitter = document.createElement("div");
    const workDiv = document.createElement("div");
    paletteDivRef.current = paletteDiv;
    workDivRef.current = workDiv;

    const host = hostRef.current;
    host.innerHTML = "";
    host.style.display = "flex";

    paletteDiv.style.width = "260px";
    paletteDiv.style.height = "100%";
    paletteDiv.style.overflow = "hidden";
    splitter.style.width = "1px";
    splitter.style.background = "#e5e7eb";
    workDiv.style.flex = "1";
    workDiv.style.height = "100%";

    host.appendChild(paletteDiv);
    host.appendChild(splitter);
    host.appendChild(workDiv);

    // 팔레트 (readOnly)
    const paletteWs = Blockly.inject(paletteDiv, {
      readOnly: true,
      scrollbars: true,
      move: { scrollbars: true, drag: false, wheel: true },
      zoom: { startScale: 0.95, controls: false, wheel: false, pinch: false },
      trashcan: false,
      sounds: false,
      renderer: "zelos",
    });
    paletteWsRef.current = paletteWs;

    // 메인
    const mainWs = Blockly.inject(workDiv, {
      toolbox: null,
      scrollbars: true,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: {
        startScale: 0.95,
        controls: true,
        wheel: true,
        pinch: true,
        maxScale: 2,
        minScale: 0.5,
      },
      renderer: "zelos",
      grid: { spacing: 24, length: 3, colour: "#eee", snap: false },
      trashcan: true,
    });
    mainWsRef.current = mainWs;

    // 저장 콜백
    const emitXml = () => {
      if (!onXmlChange) return;
      const dom = Blockly.Xml.workspaceToDom(mainWs);
      onXmlChange(Blockly.Xml.domToText(dom));
    };
    mainWs.addChangeListener(emitXml);

    // 팔레트 경계 침범 시, "메인에서 움직인 블록"만 원위치
    const startXY = new Map();
    mainWs.addChangeListener((e) => {
      if (e.type !== Blockly.Events.BLOCK_MOVE) return;
      const b = mainWs.getBlockById(e.blockId);
      if (!b) return;

      if (e.isStart) {
        const { x, y } = b.getRelativeToSurfaceXY();
        startXY.set(b.id, { x, y });
        return;
      }
      if (e.isEnd) {
        const palRect = paletteDiv.getBoundingClientRect(); // 매번 최신 경계
        const br = b.getSvgRoot().getBoundingClientRect();
        const overlapped = br.left < palRect.right - 6; // 6px 여유
        if (overlapped) {
          const p = startXY.get(b.id);
          if (p) b.moveTo(new Blockly.utils.Coordinate(p.x, p.y));
        }
      }
    });

    // 초기 XML 로드
    if (initialXml) {
      try {
        const dom = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, mainWs);
      } catch {
        /* noop */
      }
    }

    return () => {
      mainWs.dispose();
      paletteWs.dispose();
    };
  }, []); // once

  // 카테고리 전환 시 팔레트 렌더링
  useEffect(() => {
    const paletteWs = paletteWsRef.current;
    const paletteDiv = paletteDivRef.current;
    const workDiv = workDivRef.current;
    const mainWs = mainWsRef.current;
    if (!paletteWs || !paletteDiv || !workDiv || !mainWs) return;

    // 안전하게 초기화
    paletteWs.clear();
    let y = 12;

    const list = CATALOG[activeCategory] || [];
    list.forEach((entry) => {
      try {
        // 존재하지 않는 타입은 건너뛰기 (백지 방지)
        if (!Blockly.Blocks[entry.type]) {
          console.warn(`[팔레트] 정의 안 된 타입: ${entry.type} (스킵)`);
          return;
        }

        const demo = paletteWs.newBlock(entry.type);
        // 필드 고정 적용
        if (entry.fields) {
          Object.entries(entry.fields).forEach(([k, v]) => {
            try {
              demo.setFieldValue(String(v), k);
              if (entry.lockFields?.includes(k)) {
                const f = demo.getField(k);
                f && f.setEnabled(false);
              }
            } catch {}
          });
        }
        demo.setMovable(false);
        demo.setDeletable(false);
        demo.initSvg();
        demo.render();
        demo.moveBy(12, y);
        y += PALETTE_BLOCK_HEIGHT + PALETTE_BLOCK_GAP;

        // 팔레트 → 메인 드래그 복사
        const root = demo.getSvgRoot();
        if (!root) return;
        root.addEventListener("mousedown", (downEv) => {
          downEv.preventDefault();

          // 유령 박스 (시각 피드백)
          const ghost = document.createElement("div");
          Object.assign(ghost.style, {
            position: "fixed",
            pointerEvents: "none",
            left: `${downEv.clientX}px`,
            top: `${downEv.clientY}px`,
            width: "140px",
            height: "38px",
            background: "#fafafa",
            border: "1px dashed #aaa",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,.15)",
            zIndex: 99999,
            transform: "translate(-50%,-50%)",
          });
          document.body.appendChild(ghost);

          const onMove = (mv) => {
            ghost.style.left = `${mv.clientX}px`;
            ghost.style.top = `${mv.clientY}px`;
          };
          const onUp = (upEv) => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            const overMain = isOverElement(upEv.clientX, upEv.clientY, workDiv);
            if (overMain) {
              try {
                const xml = Blockly.Xml.blockToDom(demo, true);
                const text = Blockly.Xml.domToText(xml);
                const dom = Blockly.Xml.textToDom(text);
                const nb = Blockly.Xml.domToBlock(dom, mainWs);
                const pt = clientToWsXY(mainWs, upEv.clientX, upEv.clientY);
                nb.moveTo(pt);
                nb.select();
              } catch (err) {
                console.warn("팔레트 → 작업영역 복사 실패:", err);
              }
            }
            ghost.remove();
          };

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        });
      } catch (err) {
        console.warn("[팔레트 렌더 실패] 항목:", entry, err);
      }
    });

    // 팔레트 스크롤 영역 갱신
    paletteWs.resizeContents();
  }, [activeCategory]);

  return <div ref={hostRef} style={{ width: "100%", height: "100%" }} />;
});

export default BlocklyArea;













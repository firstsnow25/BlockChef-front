// src/components/BlocklyArea.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import "../blockly/blockly.css";
import { CATALOG } from "../blockly/catalog";
import registerBlocks from "../blockly/blocks";

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
  const containerRef = useRef(null);
  const paletteDivRef = useRef(null);
  const workspaceDivRef = useRef(null);

  const paletteWsRef = useRef(null);
  const mainWsRef = useRef(null);

  const [paletteRightEdge, setPaletteRightEdge] = useState(0);

  useImperativeHandle(ref, () => ({
    getXml() {
      if (!mainWsRef.current) return "";
      const dom = Blockly.Xml.workspaceToDom(mainWsRef.current);
      return Blockly.Xml.domToText(dom);
    },
    loadXml(xml) {
      if (!mainWsRef.current) return;
      mainWsRef.current.clear();
      if (xml) {
        const dom = Blockly.Xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, mainWsRef.current);
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

  useEffect(() => {
    if (!containerRef.current) return;

    // ✅ 여기서 한 번만 블록 등록
    registerBlocks(Blockly);

    // 레이아웃 DOM
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

    const host = containerRef.current;
    host.innerHTML = "";
    host.style.display = "flex";
    host.appendChild(paletteDiv);
    host.appendChild(splitter);
    host.appendChild(workspaceDiv);

    // 팔레트 WS (readOnly)
    const paletteWs = Blockly.inject(paletteDiv, {
      readOnly: true,
      scrollbars: true,
      sounds: false,
      trashcan: false,
      move: { scrollbars: true, drag: false, wheel: true },
      zoom: { startScale: 0.95, controls: false, wheel: false, pinch: false },
      renderer: "zelos",
    });
    paletteWsRef.current = paletteWs;

    // 메인 WS
    const mainWs = Blockly.inject(workspaceDiv, {
      toolbox: null,
      scrollbars: true,
      move: { scrollbars: true, drag: true, wheel: false },
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

    const emitXml = () => {
      if (!onXmlChange) return;
      const dom = Blockly.Xml.workspaceToDom(mainWs);
      onXmlChange(Blockly.Xml.domToText(dom));
    };
    mainWs.addChangeListener(emitXml);

    // 경계 침범 시 원위치
    const prevXY = new Map();
    mainWs.addChangeListener((e) => {
      if (e.type === Blockly.Events.BLOCK_MOVE) {
        const b = mainWs.getBlockById(e.blockId);
        if (!b) return;
        if (e.isStart) {
          const { x, y } = b.getRelativeToSurfaceXY();
          prevXY.set(b.id, { x, y });
        }
        if (e.isEnd) {
          const palRect = paletteDiv.getBoundingClientRect();
          setPaletteRightEdge(palRect.right);
          const br = b.getSvgRoot().getBoundingClientRect();
          if (br.left < palRect.right) {
            const p = prevXY.get(b.id);
            if (p) b.moveTo(new Blockly.utils.Coordinate(p.x, p.y));
          }
        }
      }
    });

    // 초기 XML
    if (initialXml) {
      try {
        const dom = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, mainWs);
      } catch {}
    }

    return () => {
      mainWs.dispose();
      paletteWs.dispose();
    };
  }, []); // 최초 1회

  // 카테고리 전환 시 팔레트 다시 그림
  useEffect(() => {
    const paletteWs = paletteWsRef.current;
    const paletteDiv = paletteDivRef.current;
    const workspaceDiv = workspaceDivRef.current;
    if (!paletteWs || !paletteDiv || !workspaceDiv) return;

    paletteWs.clear();
    const list = CATALOG[activeCategory] || [];
    let y = 10;

    list.forEach((entry) => {
      try {
        // 정의되지 않은 타입을 호출하면 throw → 안전 처리
        const block = paletteWs.newBlock(entry.type);
        // 고정 필드 세팅
        if (entry.fields) {
          Object.entries(entry.fields).forEach(([k, v]) => {
            try {
              block.setFieldValue(String(v), k);
              if (entry.lockFields && entry.lockFields.includes(k)) {
                const f = block.getField(k);
                f && f.setEnabled(false);
              }
            } catch {}
          });
        }
        block.setMovable(false);
        block.setDeletable(false);
        block.initSvg();
        block.render();
        block.moveBy(12, y);
        y += PALETTE_BLOCK_HEIGHT + PALETTE_BLOCK_GAP;

        // 팔레트 → 메인 드래그 복사
        const root = block.getSvgRoot();
        if (!root) return;
        const onMouseDown = (ev) => {
          ev.preventDefault();

          const xml = Blockly.Xml.blockToDom(block, true);
          const xmlText = Blockly.Xml.domToText(xml);

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

          const onMove = (e2) => {
            ghost.style.left = e2.clientX + "px";
            ghost.style.top = e2.clientY + "px";
          };
          const onUp = (e2) => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            const overMain = isOverElement(
              e2.clientX,
              e2.clientY,
              workspaceDiv
            );
            if (overMain) {
              try {
                const ws = mainWsRef.current;
                const dom = Blockly.Xml.textToDom(xmlText);
                const nb = Blockly.Xml.domToBlock(dom, ws);
                const xy = clientToWsXY(ws, e2.clientX, e2.clientY);
                nb.moveTo(xy);
                nb.select();
              } catch (err) {
                console.warn("팔레트에서 블록 생성 실패:", err);
              }
            }
            ghost.remove();
          };

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        };
        root.addEventListener("mousedown", onMouseDown);
      } catch (err) {
        console.warn(
          `[팔레트] 정의되지 않은 블록 타입: ${entry?.type}. 건너뜀.`,
          err
        );
      }
    });

    // 경계선 캐시
    const palRect = paletteDiv.getBoundingClientRect();
    setPaletteRightEdge(palRect.right);
  }, [activeCategory]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
});

export default BlocklyArea;














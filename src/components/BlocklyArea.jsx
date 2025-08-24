// src/components/BlocklyArea.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/ko";

import "../blockly/blocks";                // 커스텀 블록 정의
import { CATALOG, CATEGORY_ORDER } from "../blockly/catalog";
import "../blockly/blockly.css";

/** =========================
 * BlockChef 테마
 * ========================= */
const BlockChefTheme = Blockly.Theme.defineTheme("blockchef", {
  base: Blockly.Themes.Classic,
  categoryStyles: {
    ingredient_category: { colour: "#b08968" },
    action_category:     { colour: "#d9776f" },
    flow_category:       { colour: "#6aa6e8" },
    combine_category:    { colour: "#c084fc" },
  },
  blockStyles: {
    ingredient_blocks: {
      colourPrimary:   "#b08968",
      colourSecondary: "#caa27e",
      colourTertiary:  "#8c6f56",
    },
    action_blocks: {
      colourPrimary:   "#d9776f",
      colourSecondary: "#eba39d",
      colourTertiary:  "#ba625b",
    },
    flow_blocks: {
      colourPrimary:   "#6aa6e8",
      colourSecondary: "#8fbaf0",
      colourTertiary:  "#4f89c5",
    },
  },
  componentStyles: {
    flyoutBackgroundColour: "#efefef",
    flyoutOpacity: 1,
    flyoutForegroundColour: "#d9d9d9",
    flyoutForegroundOpacity: 1,
    workspaceBackgroundColour: "transparent",
    toolboxBackgroundColour:  "transparent",
    toolboxForegroundColour:  "#666",
    insertionMarker: "#ffb703",
    insertionMarkerOpacity: 0.6,
    scrollbars: true,
  },
});

const PALETTE_MARGIN = 8;

/** 팔레트 컨텐츠에서 정의되지 않은 블록 타입은 제거 (하얀화 방지) */
function safeToolboxContents(list) {
  const out = [];
  list.forEach((e) => {
    const type = e.template;
    if (!type || !Blockly.Blocks[type]) return; // unknown type skip
    out.push({
      kind: "block",
      type,
      fields: e.fields || {},
      data: JSON.stringify({ lockFields: e.lockFields || [] }),
    });
  });
  return out;
}

/** 현재 카테고리의 flyoutToolbox JSON */
function makeToolboxJson(activeCategory) {
  const key = activeCategory ?? CATEGORY_ORDER[0];
  const entries = CATALOG[key] ?? [];
  return {
    kind: "flyoutToolbox",
    contents: safeToolboxContents(entries),
  };
}

const BlocklyArea = forwardRef(function BlocklyArea(
  { initialXml = "", onXmlChange, activeCategory = CATEGORY_ORDER[0] },
  ref
) {
  const hostRef = useRef(null);
  const workspaceRef = useRef(null);
  const changeListenerRef = useRef(null);

  // 드래그 시작 위치 저장 → 팔레트 드롭 시 원위치 복귀
  const dragStartPosRef = useRef(new Map());

  /** 워크스페이스 1회 생성 */
  useEffect(() => {
    if (!hostRef.current) return;

    const ws = Blockly.inject(hostRef.current, {
      theme: BlockChefTheme,
      toolbox: makeToolboxJson(activeCategory),
      renderer: "geras",              // 간격/겹침 안정
      toolboxPosition: "start",
      collapse: false,
      comments: false,
      disable: false,
      trashcan: true,
      grid: { spacing: 20, length: 3, colour: "#eeeeee", snap: true },
      zoom: { controls: true, wheel: true, startScale: 1, maxScale: 2, minScale: 0.4, pinch: true },
      move: { scrollbars: true, drag: true, wheel: true },
      sounds: false,
    });
    workspaceRef.current = ws;

    // 초기 XML
    if (initialXml) {
      try {
        const dom = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch (e) {
        console.error("초기 XML 로드 실패:", e);
      }
    }

    /** 1) 생성 시 lockFields 적용 */
    const lockOnCreate = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_CREATE) return;
      (ev.ids || []).forEach((id) => {
        const b = ws.getBlockById(id);
        if (!b) return;
        if (!b.data) return;
        try {
          const meta = JSON.parse(b.data);
          (meta.lockFields || []).forEach((fname) => {
            const field = b.getField(fname);
            if (field?.setEditable) field.setEditable(false);
          });
        } catch {}
      });
    };
    ws.addChangeListener(lockOnCreate);

    /** 2) 플라이아웃(팔레트) 설정: 삭제영역 비활성 + 간격/리플로우 */
    const flyout = ws.getFlyout?.();
    if (flyout) {
      if (typeof flyout.isDeleteArea === "function") {
        flyout.isDeleteArea = () => false; // 팔레트에 드롭해도 삭제되지 않게
      }
      if (typeof flyout.gap_ === "number") {
        flyout.gap_ = 16; // 겹침 방지용 간격
      }
      try {
        flyout.reflow?.();
      } catch {}
    }

    /** 3) 드래그 가드(원위치 복귀 + 경계 밖 밀어내기) */
    const onDrag = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_DRAG) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;

      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + PALETTE_MARGIN;

      if (ev.isStart) {
        const start = b.getRelativeToSurfaceXY();
        dragStartPosRef.current.set(ev.blockId, { x: start.x, y: start.y });
      } else {
        const xy = b.getRelativeToSurfaceXY();
        if (xy.x < minX) {
          const start = dragStartPosRef.current.get(ev.blockId);
          if (start) {
            b.moveBy(start.x - xy.x, start.y - xy.y); // 원위치
          } else {
            b.moveBy(minX - xy.x, 0); // 최소한 경계 밖으로
          }
        }
        dragStartPosRef.current.delete(ev.blockId);
      }
    };
    ws.addChangeListener(onDrag);

    /** 4) 이동 중에도 팔레트 침범 방지 */
    const onMove = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;
      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + PALETTE_MARGIN;
      const xy = b.getRelativeToSurfaceXY();
      if (xy.x < minX) b.moveBy(minX - xy.x, 0);
    };
    ws.addChangeListener(onMove);

    /** 5) 변경 → XML 전달 (rAF 디바운스) */
    let rafId = null;
    changeListenerRef.current = () => {
      if (!onXmlChange) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        try {
          const dom = Blockly.Xml.workspaceToDom(ws);
          const xml = Blockly.Xml.domToText(dom);
          onXmlChange(xml);
        } catch {}
      });
    };
    ws.addChangeListener(changeListenerRef.current);

    /** 리사이즈 싱크 */
    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(hostRef.current);

    return () => {
      try {
        if (changeListenerRef.current)
          ws.removeChangeListener(changeListenerRef.current);
        ws.dispose();
      } catch {}
      ro.disconnect();
      workspaceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 1회만

  /** 카테고리 전환: EMPTY → REAL 더블 스왑으로 하얀화 방지 */
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const REAL_TB = makeToolboxJson(activeCategory);
    const EMPTY_TB = { kind: "flyoutToolbox", contents: [{ kind: "label", text: "…" }] };

    const swapToolbox = () => {
      // A) 빈 툴박스로 초기화
      ws.updateToolbox(EMPTY_TB);
      const flyoutA = ws.getFlyout?.();
      try {
        flyoutA?.setVisible?.(false);
        flyoutA?.reflow?.();
      } catch {}

      // B) 다음 프레임에 실제 툴박스 주입
      requestAnimationFrame(() => {
        ws.updateToolbox(REAL_TB);
        const flyoutB = ws.getFlyout?.();
        try {
          if (typeof flyoutB?.gap_ === "number") flyoutB.gap_ = 16;
          flyoutB?.setVisible?.(true);
          flyoutB?.reflow?.();
          flyoutB?.scrollToStart?.();
        } catch {}

        // 드물게 빈 경우 다시 한 번 스왑
        const count =
          flyoutB?.getWorkspace?.()?.getTopBlocks(false).length ?? 0;
        if (REAL_TB.contents.length > 0 && count === 0) {
          setTimeout(() => {
            ws.updateToolbox(EMPTY_TB);
            setTimeout(() => {
              ws.updateToolbox(REAL_TB);
              try {
                if (typeof flyoutB?.gap_ === "number") flyoutB.gap_ = 16;
                flyoutB?.setVisible?.(true);
                flyoutB?.reflow?.();
                flyoutB?.scrollToStart?.();
              } catch {}
              Blockly.svgResize(ws);
            }, 0);
          }, 0);
        } else {
          Blockly.svgResize(ws);
        }
      });
    };

    swapToolbox();
  }, [activeCategory]);

  // 외부에서 제어할 API
  useImperativeHandle(ref, () => ({
    getXml() {
      const ws = workspaceRef.current;
      if (!ws) return "";
      const dom = Blockly.Xml.workspaceToDom(ws);
      return Blockly.Xml.domToText(dom);
    },
    loadXml(xmlText) {
      const ws = workspaceRef.current;
      if (!ws) return;
      ws.clear();
      if (xmlText) {
        const dom = Blockly.Xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(dom, ws);
      }
    },
    clear() {
      workspaceRef.current?.clear();
    },
    undo() {
      workspaceRef.current &&
        Blockly.Events.UndoRedo.undo(workspaceRef.current);
    },
    redo() {
      workspaceRef.current &&
        Blockly.Events.UndoRedo.redo(workspaceRef.current);
    },
  }));

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden", // 팔레트/작업영역 경계 침범 보이지 않게
      }}
    />
  );
});

export default BlocklyArea;









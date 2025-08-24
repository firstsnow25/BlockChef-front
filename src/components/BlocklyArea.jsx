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

import "../blockly/blocks";              // 커스텀 블록 정의
import { CATALOG, CATEGORY_ORDER } from "../blockly/catalog";
import "../blockly/blockly.css";

/** =========================
 * BlockChef 테마
 * ========================= */
const BlockChefTheme = Blockly.Theme.defineTheme("blockchef", {
  base: Blockly.Themes.Classic,
  categoryStyles: {
    ingredient_category: { colour: "#b08968" },
    action_category: { colour: "#d9776f" },
    flow_category: { colour: "#6aa6e8" },
  },
  blockStyles: {
    ingredient_blocks: {
      colourPrimary: "#b08968",
      colourSecondary: "#caa27e",
      colourTertiary: "#8c6f56",
    },
    action_blocks: {
      colourPrimary: "#d9776f",
      colourSecondary: "#eba39d",
      colourTertiary: "#ba625b",
    },
    flow_blocks: {
      colourPrimary: "#6aa6e8",
      colourSecondary: "#8fbaf0",
      colourTertiary: "#4f89c5",
    },
  },
  componentStyles: {
    flyoutBackgroundColour: "#efefef",
    flyoutOpacity: 1,
    flyoutForegroundColour: "#d9d9d9",
    flyoutForegroundOpacity: 1,
    workspaceBackgroundColour: "transparent",
    toolboxBackgroundColour: "transparent",
    toolboxForegroundColour: "#666",
    insertionMarker: "#ffb703",
    insertionMarkerOpacity: 0.6,
    scrollbars: true,
  },
});

const PALETTE_MARGIN = 8;

// 정의되지 않은 블록 타입 스킵
function safeToolboxContents(list) {
  const out = [];
  list.forEach((e) => {
    const type = e.template; // 블록 타입
    if (!type || !Blockly.Blocks[type]) return;
    out.push({
      kind: "block",
      type,
      fields: e.fields || {},
      data: JSON.stringify({ lockFields: e.lockFields || [] }),
    });
  });
  return out;
}

// 현재 카테고리의 툴박스 JSON
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
  const dragStartPosRef = useRef(new Map());

  useEffect(() => {
    if (!hostRef.current) return;

    const ws = Blockly.inject(hostRef.current, {
      theme: BlockChefTheme,
      toolbox: makeToolboxJson(activeCategory),
      renderer: "geras",
      toolboxPosition: "start",
      collapse: false,
      comments: false,
      disable: false,
      trashcan: true,
      grid: { spacing: 20, length: 3, colour: "#eeeeee", snap: true },
      zoom: { controls: true, wheel: true, startScale: 1, maxScale: 2, minScale: 0.4, pinch: true },
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: true, startScale: 1, maxScale: 2, minScale: 0.4, pinch: true },
      move: { scrollbars: true, drag: false, wheel: true }, // 캔버스 드래그 패닝 OFF
      sounds: false,
    });
    workspaceRef.current = ws;

    // 수평 휠/제스처 무시(수평 스크롤 체감 제거)
    const svg = ws.getParentSvg();
    const wheelBlocker = (e) => {
      // 수평 제스처가 우세하거나, Shift 드래그(수평 이동)인 경우 막기
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
      }
    };
    svg.addEventListener("wheel", wheelBlocker, { passive: false });

    // 수평 스크롤바 DOM 감추기 (시각적 제거)
    const hideHScroll = () => {
      const hBars = hostRef.current?.querySelectorAll(
        ".blocklyScrollbarHorizontal, .blocklyScrollbarKnobHorizontal"
      );
      hBars?.forEach((el) => (el.style.display = "none"));
    };
    hideHScroll();

    // 초기 XML
    if (initialXml) {
      try {
        const dom = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch (e) {
        console.error("초기 XML 로드 실패:", e);
      }
    }

    // 생성 시 lockFields 적용
    const lockOnCreate = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_CREATE) return;
      (ev.ids || []).forEach((id) => {
        const b = ws.getBlockById(id);
        if (!b) return;
        if (b.data) {
          try {
            const meta = JSON.parse(b.data);
            (meta.lockFields || []).forEach((fname) => {
              const field = b.getField(fname);
              if (field?.setEditable) field.setEditable(false);
            });
          } catch {}
        }
      });
    };
    ws.addChangeListener(lockOnCreate);

    // 팔레트 삭제영역 비활성화 + 간격 보정
    const flyout = ws.getFlyout?.();
    if (flyout) {
      if (typeof flyout.isDeleteArea === "function") {
        flyout.isDeleteArea = function () {
          return false;
        };
      }
      if (typeof flyout.gap_ === "number") flyout.gap_ = 16;
      try {
        flyout.reflow?.();
        flyout.reflowInternal?.();
      } catch {}
    }

    // 팔레트 쪽으로 들어가면 원위치
    const onDrag = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_DRAG) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;

      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + 8;

      if (ev.isStart) {
        const start = b.getRelativeToSurfaceXY();
        dragStartPosRef.current.set(ev.blockId, { x: start.x, y: start.y });
      } else {
        const xy = b.getRelativeToSurfaceXY();
        if (xy.x < minX) {
          const start = dragStartPosRef.current.get(ev.blockId);
          if (start) b.moveBy(start.x - xy.x, start.y - xy.y);
          else b.moveBy(minX - xy.x, 0);
        }
        dragStartPosRef.current.delete(ev.blockId);
      }
    };
    ws.addChangeListener(onDrag);

    // 이동 중 경계 가드(팔레트 침범 방지)
    const onMove = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;
      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + 8;
      const xy = b.getRelativeToSurfaceXY();
      if (xy.x < minX) b.moveBy(minX - xy.x, 0);
    };
    ws.addChangeListener(onMove);

    // 변경 → XML 반영
    let rafId = null;
    const emit = () => {
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
    ws.addChangeListener(emit);

    // 리사이즈 동기화 + 수평 스크롤바 숨김 유지
    const ro = new ResizeObserver(() => {
      Blockly.svgResize(ws);
      hideHScroll();
    });
    ro.observe(hostRef.current);

    return () => {
      try {
        ws.removeChangeListener(lockOnCreate);
        ws.removeChangeListener(onDrag);
        ws.removeChangeListener(onMove);
        ws.removeChangeListener(emit);
        svg.removeEventListener("wheel", wheelBlocker);
        ws.dispose();
      } catch {}
      ro.disconnect();
      workspaceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카테고리 전환: 안전하게 flyout 교체
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const tb = makeToolboxJson(activeCategory);
    let raf;
    try {
      raf = requestAnimationFrame(() => {
        const flyout = ws.getFlyout?.();
        try { flyout?.setVisible?.(false); } catch {}
        ws.updateToolbox(tb);
        try {
          flyout?.setVisible?.(true);
          if (typeof flyout?.gap_ === "number") flyout.gap_ = 16;
          flyout?.reflow?.();
          flyout?.reflowInternal?.();
          flyout?.scrollToStart?.();
        } catch {}
        Blockly.svgResize(ws);
      });
    } catch (e) {
      console.error("툴박스 업데이트 실패:", e);
    }
    return () => raf && cancelAnimationFrame(raf);
  }, [activeCategory]);

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
        overflow: "hidden",
      }}
    />
  );
});

export default BlocklyArea;















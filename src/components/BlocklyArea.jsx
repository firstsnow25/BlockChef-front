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

// 팔레트 좌우 경계 보정
const PALETTE_MARGIN = 8;

/** 팔레트 목록을 안전하게 구성(정의 안 된 타입은 제외) */
function safeToolboxContents(list) {
  const out = [];
  list.forEach((e) => {
    const type = e.template;
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

/** 현재 카테고리의 툴박스 JSON(flyout 전용) */
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

  // ⬇️ 막 생성된 블록(팔레트에서 방금 끌어낸 블록) ID 기억 → 첫 이동/드래그까지만 가드 제외
  const freshIds = useRef(new Set());
  // 드래그 시작 좌표 저장(팔레트 쪽에 떨어뜨리면 원위치 복귀용)
  const dragStartPosRef = useRef(new Map());

  /** 워크스페이스 1회 생성 */
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
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1,
        maxScale: 2,
        minScale: 0.4,
        pinch: true,
      },
      // ⬇️ 가로 스크롤 비활성
      move: { scrollbars: { horizontal: false, vertical: true }, drag: true, wheel: true },
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

    /** (A) 생성 시 잠금필드 적용 + freshIds 등록 */
    const onCreate = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_CREATE) return;
      (ev.ids || []).forEach((id) => {
        freshIds.current.add(id); // 첫 드롭 1회 허용
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
    ws.addChangeListener(onCreate);

    /** (B) 팔레트(Flyout) 보정: 삭제영역 OFF + 갭/리플로우 */
    const flyout = ws.getFlyout?.();
    if (flyout) {
      if (typeof flyout.isDeleteArea === "function") {
        flyout.isDeleteArea = function () {
          return false;
        };
      }
      if (typeof flyout.gap_ === "number") {
        flyout.gap_ = 16;
      }
      try {
        flyout.reflow?.();
        flyout.reflowInternal?.();
      } catch {}
    }

    /** (C) 드래그 가드 (팔레트 침범 방지) */
    const onDrag = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_DRAG) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;

      // 막 생성된 블록은 첫 드롭은 예외 허용
      if (freshIds.current.has(ev.blockId)) return;

      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + PALETTE_MARGIN;

      if (ev.isStart) {
        const start = b.getRelativeToSurfaceXY();
        dragStartPosRef.current.set(ev.blockId, { x: start.x, y: start.y });
      } else if (!ev.isStart) {
        const xy = b.getRelativeToSurfaceXY();
        if (xy.x < minX) {
          const start = dragStartPosRef.current.get(ev.blockId);
          if (start) {
            b.moveBy(start.x - xy.x, start.y - xy.y);
          } else {
            b.moveBy(minX - xy.x, 0);
          }
        }
        dragStartPosRef.current.delete(ev.blockId);
      }
    };
    ws.addChangeListener(onDrag);

    /** (D) 이동 가드 (팔레트로 파고들지 않기) */
    const onMove = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;

      // 막 생성된 블록은 첫 MOVE에서만 예외 허용하고 제거
      if (freshIds.current.has(ev.blockId)) {
        freshIds.current.delete(ev.blockId);
        return;
      }

      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + PALETTE_MARGIN;

      const xy = b.getRelativeToSurfaceXY();
      if (xy.x < minX) {
        b.moveBy(minX - xy.x, 0);
      }
    };
    ws.addChangeListener(onMove);

    /** (E) 변경 → XML 전달 (rAF 디바운스) */
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
  }, []); // 최초 1회만

  /** 카테고리 전환 시 팔레트 안전 교체 */
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

  // 외부 제어 API
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
        overflow: "hidden", // 경계 침범 내용 가림
      }}
    />
  );
});

export default BlocklyArea;


















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
    combine_category: { colour: "#c084fc" },
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

// 팔레트의 최소 여백
const PALETTE_MARGIN = 8;

// 정의되지 않은 블록 타입을 거르기 (팔레트가 "하얗게" 되는 주 원인 방지)
function safeToolboxContents(list) {
  const out = [];
  list.forEach((e) => {
    const type = e.template;
    if (!type || !Blockly.Blocks[type]) {
      // console.warn(`[toolbox] unknown block type skipped: ${type}`);
      return;
    }
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

  // 드래그 시작 위치 저장 → 팔레트 드롭 시 원위치 복귀용
  const dragStartPosRef = useRef(new Map());

  /** 워크스페이스 1회 생성 */
  useEffect(() => {
    if (!hostRef.current) return;

    const ws = Blockly.inject(hostRef.current, {
      theme: BlockChefTheme,
      toolbox: makeToolboxJson(activeCategory),
      renderer: "geras",                  // 겹침 줄이는 렌더러
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

    /** 2) 플라이아웃 삭제영역 비활성화 + 갭/리플로우 보정 */
    const flyout = ws.getFlyout?.();
    if (flyout) {
      // (A) 삭제영역 끄기: 팔레트로 드롭해도 삭제되지 않도록
      if (typeof flyout.isDeleteArea === "function") {
        flyout.isDeleteArea = function () {
          return false;
        };
      }
      // (B) 아이템 간격(겹침 방지)
      if (typeof flyout.gap_ === "number") {
        flyout.gap_ = 16; // 기본보다 넉넉히
      }
      // (C) 초기 리플로우
      try {
        flyout.reflow?.();
        flyout.reflowInternal?.();
      } catch {}
    }

    /** 3) 드래그 가드 & 팔레트 경계 처리 */
    const onDrag = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_DRAG) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;

      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + PALETTE_MARGIN;

      if (ev.isStart) {
        // 시작 위치 저장
        const start = b.getRelativeToSurfaceXY();
        dragStartPosRef.current.set(ev.blockId, { x: start.x, y: start.y });
      } else if (!ev.isStart) {
        // 종료: 팔레트 쪽에 놓으면 원위치로 복귀
        const xy = b.getRelativeToSurfaceXY();
        if (xy.x < minX) {
          const start = dragStartPosRef.current.get(ev.blockId);
          if (start) {
            b.moveBy(start.x - xy.x, start.y - xy.y);
          } else {
            // 최소한 경계 밖으로 밀어내기
            b.moveBy(minX - xy.x, 0);
          }
        }
        dragStartPosRef.current.delete(ev.blockId);
      }
    };
    ws.addChangeListener(onDrag);

    /** 4) 이동 중 경계 가드(팔레트로 파고들지 않기) */
    const onMove = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;
      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = flyoutWidth + PALETTE_MARGIN;
      const xy = b.getRelativeToSurfaceXY();
      if (xy.x < minX) {
        b.moveBy(minX - xy.x, 0);
      }
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
  }, []); // 최초 1회만

  /** 카테고리 전환 시 팔레트 교체 (하얀화 방지: 안전 업데이트) */
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    // 유효한 블록만 넣은 툴박스 JSON
    const tb = makeToolboxJson(activeCategory);

    let raf;
    try {
      raf = requestAnimationFrame(() => {
        // 업데이트 전에 잠깐 숨겼다가 다시 보이게 (렌더 리셋)
        const flyout = ws.getFlyout?.();
        try { flyout?.setVisible?.(false); } catch {}
        ws.updateToolbox(tb);
        try {
          // 겹침/빈 화면 방지용 reflow
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
        overflow: "hidden", // 팔레트/작업영역 경계 침범 가림
      }}
    />
  );
});

export default BlocklyArea;














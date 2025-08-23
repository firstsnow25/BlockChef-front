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

// 커스텀 블록/카탈로그/스타일
import "../blockly/blocks";
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

/** 팔레트 툴박스 JSON (탭 없음, 현재 카테고리만) */
function makeToolboxJson(activeCategory) {
  const key = activeCategory ?? CATEGORY_ORDER[0];
  const entries = CATALOG[key] ?? [];

  return {
    kind: "flyoutToolbox",
    contents: entries.map((e) => ({
      kind: "block",
      type: e.template,
      fields: e.fields || {},
      data: JSON.stringify({ lockFields: e.lockFields || [] }),
    })),
  };
}

const PALETTE_MARGIN = 8;

const BlocklyArea = forwardRef(function BlocklyArea(
  { initialXml = "", onXmlChange, activeCategory = CATEGORY_ORDER[0] },
  ref
) {
  const hostRef = useRef(null);
  const workspaceRef = useRef(null);
  const changeListenerRef = useRef(null);

  // 워크스페이스 1회 생성
  useEffect(() => {
    if (!hostRef.current) return;

    const options = {
      theme: BlockChefTheme,
      toolbox: makeToolboxJson(activeCategory),
      // 겹침/간격 문제 줄이려고 classic 렌더러 사용
      renderer: "geras",
      collapse: false,
      comments: false,
      disable: false,
      trashcan: true,
      grid: {
        spacing: 20,
        length: 3,
        colour: "#eeeeee",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.98,
        maxScale: 2,
        minScale: 0.4,
        pinch: true,
      },
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      sounds: false,
      rtl: false,
    };

    const ws = Blockly.inject(hostRef.current, options);
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
              if (field && field.setEditable) field.setEditable(false);
            });
          } catch {}
        }
      });
    };
    ws.addChangeListener(lockOnCreate);

    /** 2) 이동 가드: 팔레트(플라이아웃) 안/경계 침범 방지  */
    const moveGuard = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_MOVE) return;
      const id = ev.blockId;
      const b = ws.getBlockById(id);
      if (!b || b.isShadow()) return;
      // flyout 너비 + margin 보다 왼쪽으로 이동시키지 않기
      const flyout = ws.getFlyout?.();
      if (!flyout) return;
      const flyoutWidth = flyout.getWidth ? flyout.getWidth() : 0;
      const minX = flyoutWidth + PALETTE_MARGIN;
      const xy = b.getRelativeToSurfaceXY();
      if (xy.x < minX) {
        b.moveBy(minX - xy.x, 0);
      }
    };
    ws.addChangeListener(moveGuard);

    /** 3) 변경 → XML 전달 (rAF 디바운스) */
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
  }, []); // 재주입 금지

  // 카테고리 전환 시 toolbox 교체 (안전 디바운스)
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    let raf;
    try {
      const tb = makeToolboxJson(activeCategory);
      raf = requestAnimationFrame(() => {
        ws.updateToolbox(tb);
        // 새 팔레트 위치/스크롤 초기화
        try {
          ws.getFlyout()?.scrollToStart?.();
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
        overflow: "hidden", // 팔레트/작업영역 경계 침범 방지
      }}
    />
  );
});

export default BlocklyArea;







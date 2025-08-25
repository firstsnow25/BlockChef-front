// src/components/BlocklyArea.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/ko";

import "../blockly/blocks";
import { CATALOG, CATEGORY_ORDER } from "../blockly/catalog";
import "../blockly/blockly.css";

const BlockChefTheme = Blockly.Theme.defineTheme("blockchef", {
  base: Blockly.Themes.Classic,
  categoryStyles: {
    ingredient_category: { colour: "#b08968" },
    action_category: { colour: "#d9776f" },
    flow_category: { colour: "#6aa6e8" },
  },
  blockStyles: {
    ingredient_blocks: { colourPrimary: "#b08968", colourSecondary: "#caa27e", colourTertiary: "#8c6f56" },
    action_blocks: { colourPrimary: "#d9776f", colourSecondary: "#eba39d", colourTertiary: "#ba625b" },
    flow_blocks: { colourPrimary: "#6aa6e8", colourSecondary: "#8fbaf0", colourTertiary: "#4f89c5" },
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
function makeToolboxJson(activeCategory) {
  const key = activeCategory ?? CATEGORY_ORDER[0];
  const entries = CATALOG[key] ?? [];
  return { kind: "flyoutToolbox", contents: safeToolboxContents(entries) };
}

/* 안전 XML 파서 */
function toDom(xmlMaybe) {
  const xmlStr =
    typeof xmlMaybe === "string"
      ? xmlMaybe
      : typeof xmlMaybe === "object"
      ? new XMLSerializer().serializeToString(xmlMaybe)
      : "";
  if (!xmlStr) return null;
  try { if (Blockly.Xml?.textToDom) return Blockly.Xml.textToDom(xmlStr); } catch {}
  try { if (Blockly.utils?.xml?.textToDom) return Blockly.utils.xml.textToDom(xmlStr); } catch {}
  try { return new DOMParser().parseFromString(xmlStr, "text/xml").documentElement; } catch {}
  return null;
}

const BlocklyArea = forwardRef(function BlocklyArea(
  { initialXml = "", onXmlChange, onDirtyChange, activeCategory = CATEGORY_ORDER[0] },
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
      move: { scrollbars: { horizontal: false, vertical: true }, drag: true, wheel: true }, // 가로 스크롤 제거
      sounds: false,
    });
    workspaceRef.current = ws;

    // 초기 XML 로드
    if (initialXml) {
      try {
        const dom = toDom(initialXml);
        if (dom) Blockly.Xml.domToWorkspace(dom, ws);
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

    // 팔레트 튜닝
    const flyout = ws.getFlyout?.();
    if (flyout) {
      if (typeof flyout.isDeleteArea === "function") {
        flyout.isDeleteArea = function () { return false; };
      }
      if (typeof flyout.gap_ === "number") flyout.gap_ = 16;
      try { flyout.reflow?.(); flyout.reflowInternal?.(); } catch {}
    }

    // 드래그 종료 시 경계 보정(팔레트 첫 칼럼까지 허용)
    const onDrag = (ev) => {
      if (ev.type !== Blockly.Events.BLOCK_DRAG) return;
      const b = ws.getBlockById(ev.blockId);
      if (!b || b.isShadow()) return;
      const f = ws.getFlyout?.();
      const flyoutWidth = f?.getWidth ? f.getWidth() : 0;
      const minX = Math.max(0, flyoutWidth - 90 + PALETTE_MARGIN);
      if (ev.isStart) {
        const start = b.getRelativeToSurfaceXY();
        dragStartPosRef.current.set(ev.blockId, { x: start.x, y: start.y });
      } else if (ev.isEnd) {
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

    // 변경 → XML 반영 + dirty 통지
    let rafId = null;
    changeListenerRef.current = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        try {
          const dom = Blockly.Xml.workspaceToDom(ws);
          const xml = Blockly.Xml.domToText(dom);
          onXmlChange?.(xml);
          onDirtyChange?.(ws.getTopBlocks(false).length > 0);
        } catch {}
      });
    };
    ws.addChangeListener(changeListenerRef.current);

    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(hostRef.current);

    return () => {
      try { if (changeListenerRef.current) ws.removeChangeListener(changeListenerRef.current); ws.dispose(); } catch {}
      ro.disconnect();
      workspaceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // 카테고리 전환 시 팔레트 교체
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const tb = makeToolboxJson(activeCategory);
    const raf = requestAnimationFrame(() => {
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
    return () => cancelAnimationFrame(raf);
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
      if (!xmlText) return;
      try {
        const dom = toDom(xmlText);
        if (dom) Blockly.Xml.domToWorkspace(dom, ws);
      } catch (e) {
        console.error("XML 불러오기 실패:", e);
      }
    },
    clear() { workspaceRef.current?.clear(); },
    undo() { const ws = workspaceRef.current; if (ws?.undo) ws.undo(false); }, // 되돌리기
    redo() { const ws = workspaceRef.current; if (ws?.undo) ws.undo(true); },  // 다시하기
    hasAnyBlocks() {
      const ws = workspaceRef.current;
      if (!ws) return false;
      return ws.getTopBlocks(false).length > 0;
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






















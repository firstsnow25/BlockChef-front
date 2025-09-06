// src/components/BlocklyArea.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/ko";
import "../blockly/custom_renderer";

import "../blockly/blocks";
import { CATALOG, CATEGORY_ORDER } from "../blockly/catalog";
import "../blockly/blockly.css";
import { installSemantics } from "../blockly/semantics";

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

/* ─────────────────────────────────────────────
 * 플라이아웃(팔레트) 스크롤/메트릭스 보정
 *  - reflow + scrollbar 재계산
 *  - 휠 이벤트를 플라이아웃이 직접 처리
 * ───────────────────────────────────────────── */
function ensureFlyoutScroll(ws) {
  const flyout = ws?.getFlyout?.();
  if (!flyout) return;

  try {
    flyout.reflow?.();
    // 카테고리/검색 전환 시 시작 위치로
    flyout.scrollToStart?.();
    // 내부 워크스페이스 스크롤바 사이즈 갱신
    flyout.workspace_?.scrollbar?.resize?.();
  } catch {}

  // 루트 엘리먼트 찾아서 휠 이벤트 가로채기
  const rootEl =
    flyout.svgBackground_?.parentNode ||
    flyout.svgGroup_ ||
    flyout.workspace_?.getParentSvg?.() ||
    null;
  if (!rootEl) return;

  // 중복 등록 방지
  if (flyout.__wheelFix) {
    rootEl.removeEventListener("wheel", flyout.__wheelFix);
  }
  const wheelFix = (e) => {
    // 메인 워크스페이스로 전파/기본동작 막기
    e.stopPropagation();
    e.preventDefault();
    // 버전별 핸들러
    if (typeof flyout.wheel === "function") flyout.wheel(e);
    else if (typeof flyout.onMouseWheel_ === "function") flyout.onMouseWheel_(e);
  };
  rootEl.addEventListener("wheel", wheelFix, { passive: false });
  flyout.__wheelFix = wheelFix;
}

function safeToolboxContents(list) {
  const out = [];
  list.forEach((e) => {
    const type = e.template;
    if (!type || !Blockly.Blocks[type]) return;
    out.push({
      kind: "block",
      type,
      fields: e.fields || {},
      // NOTE: label은 툴박스 UI 노출엔 쓰지 않지만, 검색 필터링에 사용
      // data는 여기서 넣지 않고, 각 블록 정의(especially ingredient_name_*)에서 this.data 지정
    });
  });
  return out;
}

// activeCategory + 검색어로 entries 필터링
function getFilteredEntries(activeCategory, query) {
  const key = activeCategory ?? CATEGORY_ORDER[0];
  const entries = CATALOG[key] ?? [];
  const q = (query || "").trim();
  if (!q) return entries;

  const lower = q.toLowerCase();
  return entries.filter((e) => {
    const label = (e.label || e.type || e.template || "").toString();
    return (
      label.toLowerCase().includes(lower) ||
      label.includes(q) // 한글 직접 포함
    );
  });
}

function makeToolboxJson(activeCategory, query) {
  const filtered = getFilteredEntries(activeCategory, query);
  return { kind: "flyoutToolbox", contents: safeToolboxContents(filtered) };
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
  const [search, setSearch] = useState(""); // ✅ 팔레트 검색어

  useEffect(() => {
    if (!hostRef.current) return;

    const ws = Blockly.inject(hostRef.current, {
      theme: BlockChefTheme,
      toolbox: makeToolboxJson(activeCategory, search),
      renderer: "chef_geras",
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

    // ✅ semantics 설치 (연결 시 검증/토스트/차단)
    installSemantics(ws);

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

    // 팔레트 튜닝 + 스크롤 보정
    const flyout = ws.getFlyout?.();
    if (flyout) {
      if (typeof flyout.isDeleteArea === "function") {
        flyout.isDeleteArea = function () { return false; };
      }
      if (typeof flyout.gap_ === "number") flyout.gap_ = 16;
      try { flyout.reflow?.(); flyout.reflowInternal?.(); } catch {}
      ensureFlyoutScroll(ws);
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

  // 카테고리/검색어 전환 시 팔레트 교체
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const tb = makeToolboxJson(activeCategory, search);
    const raf = requestAnimationFrame(() => {
      const flyout = ws.getFlyout?.();
      try { flyout?.setVisible?.(false); } catch {}
      ws.updateToolbox(tb);
      try {
        flyout?.setVisible?.(true);
        if (typeof flyout?.gap_ === "number") flyout.gap_ = 16;
        flyout?.reflow?.();
        flyout?.reflowInternal?.();
        ensureFlyoutScroll(ws); // ★ 전환 후 스크롤/휠 보정 필수
      } catch {}
      Blockly.svgResize(ws);
    });
    return () => cancelAnimationFrame(raf);
  }, [activeCategory, search]);

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
    undo() {
      const ws = workspaceRef.current;
      if (ws?.undo) ws.undo(false);
    },
    redo() {
      const ws = workspaceRef.current;
      if (ws?.undo) ws.undo(true);
    },
    hasAnyBlocks() {
      const ws = workspaceRef.current;
      if (!ws) return false;
      return ws.getTopBlocks(false).length > 0;
    },
  }));

  // ✅ 팔레트 검색 입력 UI (아주 얇게)
  const SearchBox = () => (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="검색 (예: 감자/볶기)"
      style={{
        position: "absolute",
        left: 8,
        top: 8,
        width: 180,
        zIndex: 10,
        padding: "6px 8px",
        border: "1px solid #ddd",
        borderRadius: 8,
        fontSize: 12,
        background: "rgba(255,255,255,0.95)",
        outline: "none",
      }}
    />
  );

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 팔레트가 좌측이므로 좌상단에만 얇게 표시 */}
      <SearchBox />
    </div>
  );
});

export default BlocklyArea;


























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

// 우리의 커스텀 블록과 카탈로그
import "../blockly/blocks";
import { CATALOG, CATEGORY_ORDER } from "../blockly/catalog";

// 디자인용 커스텀 CSS
import "../blockly/blockly.css";

/** =========================
 *  BlockChef 테마 (색/배경/컨트롤)
 *  ========================= */
const BlockChefTheme = Blockly.Theme.defineTheme("blockchef", {
  base: Blockly.Themes.Classic,
  categoryStyles: {
    ingredient_category: { colour: "#b08968" }, // 재료(브론즈/브라운)
    action_category: { colour: "#d9776f" },     // 동작(살몬)
    flow_category: { colour: "#6aa6e8" },       // 흐름(블루)
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
    // 플라이아웃(블록 목록)
    flyoutBackgroundColour: "#efefef",
    flyoutOpacity: 1,
    flyoutForegroundColour: "#c7c7c7",
    flyoutForegroundOpacity: 1,

    // 작업영역 격자/배경
    workspaceBackgroundColour: "transparent",
    toolboxBackgroundColour: "transparent",
    toolboxForegroundColour: "#666",

    // 드래그 마커
    insertionMarker: "#ffb703",
    insertionMarkerOpacity: 0.6,
    scrollbars: true,
  },
});

/** =========================
 *  카탈로그 → 플라이아웃용 toolbox JSON
 *  =========================
 *  - 내부 탭(카테고리 탭) 없이, 현재 activeCategory 한 가지만 노출
 *  - fields/data를 JSON으로 직접 프리셋
 */
function makeToolboxJson(activeCategory) {
  const key = activeCategory ?? CATEGORY_ORDER[0];
  const entries = CATALOG[key] ?? [];

  return {
    kind: "flyoutToolbox", // ✅ 내부 탭 없는 순수 플라이아웃
    contents: entries.map((e) => ({
      kind: "block",
      type: e.template,        // 실제 블록 타입
      fields: e.fields || {},  // 초기 필드 프리셋
      data: JSON.stringify({   // 필드 잠금 같은 메타는 data에 저장
        lockFields: e.lockFields || [],
      }),
    })),
  };
}

const BlocklyArea = forwardRef(function BlocklyArea(
  { initialXml = "", onXmlChange, activeCategory = "재료" },
  ref
) {
  const hostRef = useRef(null);
  const workspaceRef = useRef(null);
  const changeListenerRef = useRef(null);

  // 워크스페이스 1회 생성 (재주입 금지)
  useEffect(() => {
    if (!hostRef.current) return;

    const options = {
      theme: BlockChefTheme,
      toolbox: makeToolboxJson(activeCategory),
      renderer: "thrasos",
      collapse: false,
      comments: false,
      disable: false,
      trashcan: true,
      grid: {
        spacing: 20,
        length: 3,
        colour: "#eee",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.95,
        maxScale: 2,
        minScale: 0.3,
        pinch: true,
      },
      move: {
        scrollbars: true, // 작업영역 스크롤
        drag: true,
        wheel: true,
      },
      sounds: false,
      rtl: false,
    };

    const ws = Blockly.inject(hostRef.current, options);
    workspaceRef.current = ws;

    // 초기 XML 로드
    if (initialXml) {
      try {
        const dom = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch (e) {
        console.error("초기 XML 로드 실패:", e);
      }
    }

    // 블록 생성 시 data(lockFields) 적용 → 필드 편집 잠금
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

    // 변경 감지 → XML 상위 전달 (가벼운 디바운스)
    let rafId = null;
    changeListenerRef.current = () => {
      if (!onXmlChange) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dom = Blockly.Xml.workspaceToDom(ws);
        const xml = Blockly.Xml.domToText(dom);
        onXmlChange(xml);
      });
    };
    ws.addChangeListener(changeListenerRef.current);

    // 리사이즈
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
  }, []); // ★ 한 번만

  // 카테고리 전환 시 toolbox만 교체 (워크스페이스 유지)
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    try {
      const tb = makeToolboxJson(activeCategory);
      ws.updateToolbox(tb);
      // flyout은 자동 오픈
    } catch (e) {
      console.error("툴박스 업데이트 실패:", e);
    }
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
        overflow: "hidden", // 경계 침범 방지
      }}
    />
  );
});

export default BlocklyArea;






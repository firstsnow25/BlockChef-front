// src/components/BlocklyArea.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/msg/ko';
import '../blockly/blocks';
import { CATALOG, CATEGORY_ORDER } from '../blockly/catalog';

// 카탈로그 → 툴박스 XML 문자열 생성
function buildToolboxXmlFromCatalog() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                              .replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const categories = CATEGORY_ORDER.map(cat => {
    const blocks = (CATALOG[cat] || []).map(item => {
      const fields = Object.entries(item.fields || {})
        .map(([name, val]) => `<field name="${esc(name)}">${esc(val)}</field>`)
        .join('');
      const data = item.lockFields?.length
        ? ` data="${esc(JSON.stringify({ lockFields: item.lockFields }))}"`
        : '';
      return `<block type="${esc(item.template)}"${data}>${fields}</block>`;
    }).join('');
    return `<category name="${esc(cat)}">${blocks}</category>`;
  }).join('');

  return `<xml id="toolbox" style="display:none">${categories}</xml>`;
}

const BlocklyArea = forwardRef(({ initialXml, onXmlChange, activeCategory }, ref) => {
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    const toolboxXml = buildToolboxXmlFromCatalog();

    workspaceRef.current = Blockly.inject(containerRef.current, {
      toolbox: toolboxXml,
      toolboxPosition: 'left',
      renderer: 'zelos',
      scrollbars: true,
      trashcan: true,
      grid: { spacing: 20, length: 3, colour: '#eee', snap: true },
      zoom: { wheel: true, startScale: 0.95, controls: true },
    });

    // 초기 XML 로드
    if (initialXml) {
      try {
        const xml = Blockly.Xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
      } catch (e) {
        console.warn('초기 XML 파싱 실패:', e);
      }
    }

    // 변경 이벤트: 필드 잠금 처리 + XML 콜백
    const onChange = (ev) => {
      if (ev?.type === Blockly.Events.BLOCK_CREATE) {
        const ws = workspaceRef.current;
        (ev.ids || []).forEach(id => {
          const b = ws.getBlockById(id);
          if (!b || !b.data) return;
          try {
            const meta = JSON.parse(b.data);
            (meta.lockFields || []).forEach(name => {
              const f = b.getField(name);
              if (f?.setEditable) f.setEditable(false);
            });
          } catch (_) {}
        });
      }

      const dom = Blockly.Xml.workspaceToDom(workspaceRef.current);
      onXmlChange?.(Blockly.Xml.domToText(dom));
    };

    workspaceRef.current.addChangeListener(onChange);
    return () => workspaceRef.current?.dispose();
  }, []);

  // 버튼으로 카테고리 전환
  useEffect(() => {
    const ws = workspaceRef.current;
    const toolbox = ws?.getToolbox?.();
    if (!ws || !toolbox || !activeCategory) return;
    const items = toolbox.getToolboxItems?.() || [];
    const target = items.find(it => it.getName?.() === activeCategory);
    if (target) toolbox.setSelectedItem(target);
  }, [activeCategory]);

  useImperativeHandle(ref, () => ({
    undo: () => workspaceRef.current?.undo(false),
    redo: () => workspaceRef.current?.undo(true),
    clear: () => workspaceRef.current?.clear(),
    loadXml: (xmlText) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      ws.clear();
      if (xmlText) {
        const xml = Blockly.Xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xml, ws);
      }
    },
    getXml: () => {
      const dom = Blockly.Xml.workspaceToDom(workspaceRef.current);
      return Blockly.Xml.domToText(dom);
    },
  }));

  return <div ref={containerRef} className="w-full h-full rounded-xl" />;
});

export default BlocklyArea;


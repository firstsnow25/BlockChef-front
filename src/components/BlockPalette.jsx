// src/components/BlockPalette.jsx
import React, { memo, useMemo } from 'react';

// 팔레트에 노출할 블록 목록 (카테고리별)
const BLOCK_CATALOG = {
  '재료': [
    { type: 'ingredient_value', label: '재료(값)' },
  ],
  '동작': [
    { type: 'action_cook', label: '조리(Statement, 재료 가변)' },
  ],
  '흐름': [
    { type: 'flow_repeat', label: '반복' },
    { type: 'flow_if_else', label: '조건(만약/아니면)' },
  ],
};

function BlockPalette({ activeTab, onCreate }) {
  const list = useMemo(() => BLOCK_CATALOG[activeTab] || [], [activeTab]);

  return (
    <div className="flex flex-col gap-2">
      {list.map((item) => (
        <button
          key={item.type}
          onClick={() => onCreate(item.type)}
          className="w-full text-left bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded px-3 py-2"
          title={`${activeTab} 블록: ${item.label}`}
        >
          {item.label}
        </button>
      ))}
      <div className="text-xs text-gray-400 mt-2">
        * 클릭하면 우측 레시피 작업영역에 블록이 생성됩니다.
      </div>
    </div>
  );
}

export default memo(BlockPalette);

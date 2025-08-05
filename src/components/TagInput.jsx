// components/TagInput.jsx
import React, { useState } from "react";

export default function TagInput({ tags, setTags }) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if ((e.key === " " || e.key === ",") && input.trim()) {
      const newTag = input.trim().startsWith("#") ? input.trim() : `#${input.trim()}`;
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap border border-gray-300 rounded px-2 py-1 min-h-[40px]">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm mr-1 mb-1"
        >
          {tag}
        </span>
      ))}
      <input
        type="text"
        className="outline-none flex-grow min-w-[100px] py-1 text-sm"
        placeholder="#태그를 입력하세요"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// src/components/InputField.jsx
import React, { useState } from "react";

export default function InputField({
  type = "text",
  placeholder = "",
  value,
  onChange,
  disabled = false,
  name = "",
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-black
        placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
        ${disabled ? "bg-gray-100 text-gray-400" : "bg-white"}`}
    />
  );
}

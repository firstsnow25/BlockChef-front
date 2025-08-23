import { useState } from "react";

export default function InputField({
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  className = "",
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full flex justify-center">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full px-3 py-2 border rounded-md text-sm transition-all placeholder-gray-400 mb-4
          ${disabled ? "bg-gray-100 text-gray-500" : "bg-white"}
          focus:outline-none focus:ring-2 focus:ring-black ${className}`}
      />

    </div>
  );
}

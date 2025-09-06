// src/components/LoginButton.jsx
import React from "react";

export default function LoginButton({
  text = "로그인",
  disabled = false,
  onClick,
  className = "",
  ...rest
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={rest.title ?? text}
      {...rest}
      className={`px-3 py-2 rounded-full font-semibold text-white
        text-[11px] leading-[1.15] md:text-[12px]
        inline-flex items-center justify-center
        whitespace-nowrap overflow-hidden text-ellipsis
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
        ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800 cursor-pointer"}
        ${className}`}
    >
      {text}
    </button>
  );
}


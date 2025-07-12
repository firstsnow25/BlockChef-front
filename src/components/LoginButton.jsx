// src/components/LoginButton.jsx
import React from "react";

export default function LoginButton({ text = "로그인", disabled = false, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-[30%] px-6 py-2 rounded-full font-semibold text-white text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
        ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800 cursor-pointer"} ${className}`}
    >
      {text}
    </button>
  );
}

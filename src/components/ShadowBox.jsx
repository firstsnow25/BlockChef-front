// src/components/ShadowBox.jsx
import React from "react";

export default function ShadowBox({ children }) {
  return (
    <div
      className="bg-white rounded-xl shadow-lg"
      style={{
        width: "639.97px",
        height: "610.24px",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

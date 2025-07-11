// src/components/CountdownTimer.jsx
import React, { useEffect, useState } from "react";

export default function CountdownTimer({ start = 180, onTimeout }) {
  const [seconds, setSeconds] = useState(start);

  useEffect(() => {
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeout) onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeout]);

  const formatTime = () => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return seconds > 0 ? (
    <p className="text-xs text-red-500 mt-1">남은 시간: {formatTime()}</p>
  ) : null;
}

import React from "react";

export default function LogoKentra({
  variant = "monogram",
  theme = "light",
  width = 140,
}: {
  variant?: "monogram" | "full";
  theme?: "light" | "dark";
  width?: number;
}) {
  const fill = theme === "light" ? "#FFFFFF" : "#1C1C1A";
  const moss = "#575D43";
  if (variant === "monogram") {
    return (
      <svg width={width} height={(width * 32) / 140} viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg" aria-label="Kentra">
        <rect x="0" y="0" width="32" height="32" rx="8" fill={fill} />
        <text x="8" y="22" fontFamily="Poppins, sans-serif" fontWeight={700} fontSize="20" fill={moss}>K</text>
      </svg>
    );
  }
  return (
    <div className="flex items-center gap-2" aria-label="Kentra">
      <div className="h-8 w-8 rounded-xl" style={{ background: fill }} />
      <span className="font-display text-xl" style={{ color: fill }}>Kentra</span>
    </div>
  );
}

"use client";

import React from "react";

interface BrandMarkProps {
  className?: string;
  size?: number; // px
}

export default function BrandMark({ className = "", size = 24 }: BrandMarkProps) {
  const px = `${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Zeni"
      width={px}
      height={px}
      className={className}
    >
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#0F172A" />
      <path
        d="M18 20 H46 L18 44 H46"
        stroke="#38BDF8"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

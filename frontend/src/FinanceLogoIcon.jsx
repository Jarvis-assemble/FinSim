import React from 'react'

export default function FinanceLogoIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="finShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="finGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Rounded Finance Shield */}
      <rect width="40" height="40" rx="10" fill="url(#finShieldGrad)" />

      {/* Ascending Growth Bars */}
      <rect x="8" y="24" width="4" height="8" rx="1.5" fill="#ffffff" opacity="0.8" />
      <rect x="14" y="19" width="4" height="13" rx="1.5" fill="#ffffff" opacity="0.9" />
      <rect x="20" y="15" width="4" height="17" rx="1.5" fill="url(#finGoldGrad)" />

      {/* Growth Trend Arrow */}
      <path
        d="M9 22L16 15L22 17L31 8"
        stroke="#34d399"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 8H31V13"
        stroke="#34d399"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Financial Currency Emblem (Rupee Symbol) */}
      <circle cx="28" cy="24" r="5.5" fill="url(#finGoldGrad)" />
      <text
        x="28"
        y="27.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="900"
        fill="#064e3b"
        fontFamily="system-ui, sans-serif"
      >
        ₹
      </text>
    </svg>
  )
}

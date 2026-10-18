import React from 'react'

export default function AIAdvisorIcon({ size = 20, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
    >
      <defs>
        <linearGradient id="aiCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="45%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="aiGlowSpark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Outer subtle orbital ring */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="url(#aiCoreGrad)"
        strokeWidth="1.2"
        strokeDasharray="2.5 2.5"
        opacity="0.65"
      />

      {/* Main 4-point Intelligence Star */}
      <path
        d="M12 2.5C12.4 7.2 14.8 9.6 19.5 10C14.8 10.4 12.4 12.8 12 17.5C11.6 12.8 9.2 10.4 4.5 10C9.2 9.6 11.6 7.2 12 2.5Z"
        fill="url(#aiCoreGrad)"
      />

      {/* Core Radiant Nodes */}
      <circle cx="12" cy="10" r="3.2" fill="#ffffff" opacity="0.95" />
      <circle cx="12" cy="10" r="2" fill="url(#aiGlowSpark)" />

      {/* Accent Micro-Star Sparkle */}
      <path
        d="M18.5 14C18.8 16 19.8 17 21.8 17.3C19.8 17.6 18.8 18.6 18.5 20.6C18.2 18.6 17.2 17.6 15.2 17.3C17.2 17 18.2 16 18.5 14Z"
        fill="url(#aiGlowSpark)"
      />

      {/* Bottom Intelligence Node */}
      <circle cx="6" cy="18" r="1.5" fill="#f59e0b" opacity="0.85" />
    </svg>
  )
}

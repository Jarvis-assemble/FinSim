import React, { useState } from 'react'

export default function VirtualCard({ account }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)
  const [copied, setCopied] = useState(false)

  const cardNumber = '5342 •••• •••• 4289'
  const fullCardNumber = '5342 8812 9043 4289'
  const cardHolder = 'DEMO STUDENT'
  const expiry = '09/30'
  const cvv = '842'

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard?.writeText?.(fullCardNumber.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleFreeze = (e) => {
    e.stopPropagation()
    setIsFrozen(!isFrozen)
  }

  return (
    <div className="virtual-card-container">
      <div className="card-perspective-wrapper" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`card-3d-inner ${isFlipped ? 'flipped' : ''} ${isFrozen ? 'frozen' : ''}`}>
          
          {/* ── CARD FRONT ── */}
          <div className="card-face card-front">
            <div className="card-shimmer-overlay" />
            <div className="card-mesh-glow" />

            {/* Top row: Brand & Contactless */}
            <div className="card-header-row">
              <div className="card-brand-mark">
                <span className="card-bank-logo">🏦 FinSim</span>
                <span className="card-tier-pill">PLATINUM</span>
              </div>
              <div className="card-contactless">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 16.5a5 5 0 0 1 0-9" strokeLinecap="round" />
                  <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
                  <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* EMV Chip & NFC */}
            <div className="card-chip-row">
              <div className="emv-chip">
                <div className="chip-line horizontal" />
                <div className="chip-line vertical" />
                <div className="chip-core" />
              </div>
              {isFrozen && (
                <div className="frozen-tag">
                  ❄️ Card Frozen
                </div>
              )}
            </div>

            {/* Card Number */}
            <div className="card-number-display">
              <span>5342</span>
              <span>••••</span>
              <span>••••</span>
              <span>4289</span>
            </div>

            {/* Bottom Row: Holder, Expiry & Network */}
            <div className="card-footer-row">
              <div className="card-holder-col">
                <span className="card-label">CARDHOLDER</span>
                <span className="card-val">{cardHolder}</span>
              </div>

              <div className="card-expiry-col">
                <span className="card-label">VALID THRU</span>
                <span className="card-val">{expiry}</span>
              </div>

              <div className="card-network-logo">
                <span className="rupay-brand">
                  <span className="rupay-ru">Ru</span>
                  <span className="rupay-pay">Pay</span>
                </span>
                <span className="platinum-text">GLOBAL</span>
              </div>
            </div>

            {/* Flip hint */}
            <div className="card-flip-prompt">
              ↻ Tap to flip & reveal CVV
            </div>
          </div>

          {/* ── CARD BACK ── */}
          <div className="card-face card-back">
            <div className="card-shimmer-overlay" />
            
            {/* Magnetic Stripe */}
            <div className="card-magstripe" />

            {/* Signature & CVV Row */}
            <div className="card-signature-row">
              <div className="signature-panel">
                <span className="signature-text">{cardHolder}</span>
              </div>
              <div className="cvv-box">
                <span className="cvv-label">CVV</span>
                <span className="cvv-val">{cvv}</span>
              </div>
            </div>

            {/* Security Disclaimers */}
            <div className="card-back-disclaimer">
              <p>For FinSim Student Sandbox use only. Not valid for real-world legal tender transactions.</p>
              <div className="card-back-meta">
                <span>Customer Care: 1800-FINSIM-AI</span>
                <span>Authorized User: demo</span>
              </div>
            </div>

            {/* Bottom Brand Stamp */}
            <div className="card-back-footer">
              <span className="hologram-seal">✦ SECURE CHIP & PIN ✦</span>
              <span className="card-back-logo">🏦 FinSim Neo</span>
            </div>

            {/* Flip back prompt */}
            <div className="card-flip-prompt">
              ↻ Tap to return to front
            </div>
          </div>

        </div>
      </div>

      {/* Card Quick Action Bar */}
      <div className="card-actions-bar">
        <button
          type="button"
          className="card-quick-btn"
          onClick={handleCopy}
          title="Copy Card Number for Payments"
        >
          {copied ? '✅ Number Copied!' : '📋 Copy Card No.'}
        </button>

        <button
          type="button"
          className={`card-quick-btn ${isFrozen ? 'active-freeze' : ''}`}
          onClick={handleToggleFreeze}
          title={isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
        >
          {isFrozen ? '🔥 Unfreeze' : '❄️ Freeze Card'}
        </button>

        <button
          type="button"
          className="card-quick-btn"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          ↻ Flip ({isFlipped ? 'CVV' : 'Front'})
        </button>
      </div>
    </div>
  )
}

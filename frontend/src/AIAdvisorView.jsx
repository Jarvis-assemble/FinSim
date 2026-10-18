import React, { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import AIAdvisorIcon from './AIAdvisorIcon'

const API = ''
const USER_ID = 'demo'
const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function FormattedMessage({ text }) {
  if (!text) return null

  // Clean LaTeX math and formatting artifacts
  let clean = text
    .replace(/\$\\rightarrow\$/g, '→')
    .replace(/\\rightarrow/g, '→')
    .replace(/\$\\times\$/g, '×')
    .replace(/\\times/g, '×')
    .replace(/\$\ge\$/g, '≥')
    .replace(/\$\le\$/g, '≤')
    .replace(/\$/g, '')

  // Extract Actionable Tip if present
  const tipRegex = /(\*\*Actionable Tip:\*\*|Actionable Tip:)([\s\S]*)$/i
  const tipMatch = clean.match(tipRegex)

  let mainBody = clean
  let tipBody = null

  if (tipMatch) {
    mainBody = clean.substring(0, tipMatch.index).trim()
    tipBody = tipMatch[2].trim()
  }

  const mainHtml = marked.parse(mainBody, { breaks: true })
  const tipHtml = tipBody ? marked.parse(tipBody, { breaks: true }) : null

  return (
    <div className="formatted-chat">
      <div className="formatted-body" dangerouslySetInnerHTML={{ __html: mainHtml }} />
      {tipHtml && (
        <div className="actionable-tip-box">
          <div className="tip-header">
            <span>💡</span> ACTIONABLE ADVISOR TIP
          </div>
          <div className="tip-content" dangerouslySetInnerHTML={{ __html: tipHtml }} />
        </div>
      )}
    </div>
  )
}

export default function AIAdvisorView({ account }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 **Hello! I'm your FinSim AI Advisor**, powered by Google Gemini.\n\nI have real-time visibility into your sandbox account: your liquid balance, active loan EMIs, investments, and CIBIL credit score.\n\nHow can I help optimize your financial journey today?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (msgToSend) => {
    const query = (typeof msgToSend === 'string' ? msgToSend : input).trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: query }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, message: query })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: '⚠️ Network connection hiccup. Please verify the backend connection and try again.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const promptPlaybooks = [
    {
      category: '📊 Portfolio & Wealth',
      prompts: [
        'How should I allocate ₹50,000 across FD and Mutual Funds?',
        'Is my portfolio diversified enough for high inflation?',
        'What is a safe emergency fund target for my current balance?'
      ]
    },
    {
      category: '🛡️ Loans & Credit Risk',
      prompts: [
        'What happens to my CIBIL score if I miss an EMI or credit card bill?',
        'Should I take a loan now or save up to pay in full?',
        'How does credit card 42% penalty interest really work?'
      ]
    },
    {
      category: '💡 Core Financial Rules',
      prompts: [
        'Explain the Rule of 72 with practical numbers',
        'Walk me through the 50/30/20 budgeting rule step by step',
        'What is the difference between SIP and Lumpsum investing?'
      ]
    }
  ]

  const totalInvestments = account ? Object.values(account.investments || {}).reduce((a, b) => a + b, 0) : 0
  const totalLoans = account ? account.loans?.reduce((a, l) => a + l.amount, 0) : 0
  const netWorth = account ? (account.balance + account.savings + totalInvestments - totalLoans) : 0

  return (
    <div className="ai-advisor-workspace">
      {/* ── LEFT PANEL: INTELLIGENCE HUB & PORTFOLIO SNAPSHOT ── */}
      <aside className="advisor-sidebar">
        {/* Model Badge Card */}
        <div className="card advisor-meta-card">
          <div className="advisor-meta-header">
            <div className="advisor-avatar-glow">
              <AIAdvisorIcon size={26} />
            </div>
            <div>
              <h4>FinSim Intelligence Core</h4>
              <span className="advisor-model-tag">Google Gemini 3.8 Flash</span>
            </div>
          </div>
          <div className="advisor-status-pill">
            <span className="live-pulse-dot" />
            <span>Live Account Telemetry Synced</span>
          </div>
        </div>

        {/* Live Account Snapshot Sent to Gemini */}
        <div className="card advisor-context-card">
          <h5>📡 Real-Time Account Telemetry</h5>
          <p className="context-desc">Streamed to Gemini with each prompt for personalized advice:</p>

          <div className="context-metrics-grid">
            <div className="context-metric">
              <span className="metric-label">Available Cash</span>
              <span className="metric-val">{formatCurrency(account?.balance || 0)}</span>
            </div>
            <div className="context-metric">
              <span className="metric-label">Net Worth</span>
              <span className="metric-val highlight">{formatCurrency(netWorth)}</span>
            </div>
            <div className="context-metric">
              <span className="metric-label">CIBIL Score</span>
              <span className="metric-val">{account?.credit_score || 750} / 900</span>
            </div>
            <div className="context-metric">
              <span className="metric-label">Risk Profile</span>
              <span className="metric-val">{account?.risk_score < 30 ? 'Low Risk' : account?.risk_score < 60 ? 'Moderate' : 'High Risk'}</span>
            </div>
          </div>
        </div>

        {/* Curated Financial Playbooks */}
        <div className="card advisor-playbooks-card">
          <h5>🎯 Advisor Playbooks</h5>
          <div className="playbooks-list">
            {promptPlaybooks.map((group, idx) => (
              <div key={idx} className="playbook-group">
                <span className="playbook-group-title">{group.category}</span>
                <div className="playbook-chips">
                  {group.prompts.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      className="playbook-chip-btn"
                      onClick={() => send(p)}
                      disabled={loading}
                    >
                      <span>💬</span> {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL: INTERACTIVE CHAT STREAM WORKSPACE ── */}
      <section className="advisor-chat-area">
        <div className="card advisor-chat-container">
          {/* Header */}
          <div className="chat-area-header">
            <div>
              <h3>AI Financial Advisory Cockpit</h3>
              <p className="chat-subtitle">Personalized guidance on investments, credit health, and spending habits.</p>
            </div>
            <button
              type="button"
              className="btn-clear-chat"
              onClick={() => setMessages([{
                role: 'assistant',
                text: "👋 Chat reset! Ask me anything about your current balance, investments, or financial strategies."
              }])}
            >
              🔄 Clear Chat
            </button>
          </div>

          {/* Messages Stream */}
          <div className="advisor-messages-scroller">
            {messages.map((m, i) => (
              <div key={i} className={`advisor-bubble-row ${m.role}`}>
                <div className="bubble-avatar">
                  {m.role === 'assistant' ? <AIAdvisorIcon size={18} /> : '👤'}
                </div>
                <div className="bubble-content-card">
                  <div className="bubble-author-row">
                    <span className="bubble-author-name">
                      {m.role === 'assistant' ? 'FinSim AI' : 'You (Student)'}
                    </span>
                  </div>
                  <div className="bubble-body">
                    {m.role === 'assistant' ? <FormattedMessage text={m.text} /> : m.text}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="advisor-bubble-row assistant">
                <div className="bubble-avatar">
                  <AIAdvisorIcon size={18} />
                </div>
                <div className="bubble-content-card typing-bubble">
                  <div className="typing-dots">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                  </div>
                  <span className="typing-label">Analyzing portfolio with Gemini 3.8...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Station with Golden Accent & Quick Prompts */}
          <div className="advisor-input-station">
            <div className="advisor-quick-pills">
              {[
                '💡 How to allocate ₹50,000?',
                '🛡️ How to boost my CIBIL score?',
                '📈 SIP vs Lumpsum investing?',
                '⚖️ Should I pay off loan or invest?'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-pill-btn"
                  onClick={() => send(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="input-bar-wrapper">
              <input
                type="text"
                className="advisor-chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask your AI Financial Advisor anything about money..."
                disabled={loading}
              />
              <button
                type="button"
                className="btn-advisor-send"
                onClick={() => send()}
                disabled={loading || !input.trim()}
              >
                <span>Ask AI</span>
                <span className="sparkle-icon">✨</span>
              </button>
            </div>
            <div className="input-station-footer">
              <span>💡 FinSim AI evaluates real financial principles to train your financial intuition.</span>
              <span className="key-hint">Press <b>Enter ↵</b> to send</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

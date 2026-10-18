import { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import CalculatorsView from './CalculatorsView'
import BudgetAndBillsView from './BudgetAndBillsView'
import AcademyView from './AcademyView'
import VirtualCard from './VirtualCard'
import NetWorthChart from './NetWorthChart'
import AIAdvisorView from './AIAdvisorView'
import AIAdvisorIcon from './AIAdvisorIcon'
import FinanceLogoIcon from './FinanceLogoIcon'
import './App.css'

const API = ''  // relative URLs: Vite proxy in dev, same-origin on Cloud Run
const USER_ID = 'demo'

const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const formatDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

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
          <div className="tip-header">💡 Actionable Tip</div>
          <div className="tip-content" dangerouslySetInnerHTML={{ __html: tipHtml }} />
        </div>
      )}
    </div>
  )
}

function RiskBadge({ score }) {
  const color = score < 30 ? '#22c55e' : score < 60 ? '#f59e0b' : '#ef4444'
  const label = score < 30 ? 'Low Risk' : score < 60 ? 'Moderate' : 'High Risk'
  return (
    <span style={{ background: color, color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
      {label} ({score}/100)
    </span>
  )
}

function MarketTicker({ market }) {
  if (!market) return null
  return (
    <div className="ticker-bar">
      <span>NIFTY50 <b>{market.NIFTY50?.toFixed(0)}</b></span>
      <span>SENSEX <b>{market.SENSEX?.toFixed(0)}</b></span>
      <span>USD/INR <b>{market.USDINR?.toFixed(2)}</b></span>
      <span>Gold/g <b>₹{market.gold_per_gram?.toFixed(0)}</b></span>
      {market.trending_stocks?.map(s => (
        <span key={s.name}>{s.name} <b style={{ color: s.change_percent >= 0 ? '#22c55e' : '#ef4444' }}>
          ₹{s.price} ({s.change_percent > 0 ? '+' : ''}{s.change_percent?.toFixed(2)}%)
        </b></span>
      ))}
    </div>
  )
}

function TransactionList({ transactions }) {
  return (
    <div className="card">
      <h3>📋 Recent Transactions</h3>
      {transactions?.length === 0 && <p style={{ color: '#888' }}>No transactions yet.</p>}
      <div className="tx-list">
        {[...transactions].reverse().slice(0, 10).map(tx => (
          <div key={tx.id} className={`tx-item ${tx.type}`}>
            <div>
              <b>{tx.description}</b>
              <span className="tx-date">{formatDate(tx.timestamp)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`tx-amount ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
              </span>
              <div style={{ fontSize: 11, color: '#888' }}>Bal: {formatCurrency(tx.balance_after)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TransferModal({ onClose, onSubmit, balance }) {
  const [form, setForm] = useState({ recipient: '', amount: '', description: 'General Money Transfer' })
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); onClose() }
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>💸 Send Money</h3>
        <form onSubmit={handleSubmit}>
          <label>Recipient Name</label>
          <input required value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} placeholder="e.g. Rahul Sharma" />
          <label style={{ marginTop: 12 }}>Amount (₹)</label>
          <input required type="number" min="1" max={balance} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Enter amount" />
          <label style={{ marginTop: 12 }}>Transfer Purpose / Category</label>
          <div className="custom-select-wrapper">
            <select
              className="fin-select"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            >
              <option value="General Money Transfer">💸 General Money Transfer</option>
              <option value="Apartment Rent">🏠 Apartment Rent & Housing</option>
              <option value="College Tuition">🎓 Tuition & Study Expenses</option>
              <option value="Grocery & Dining">🛒 Groceries & Dining</option>
              <option value="Emergency Reserve Deposit">🛡️ Emergency Buffer Deposit</option>
              <option value="Investment SIP Funding">📈 Investment SIP Funding</option>
            </select>
          </div>
          <div className="modal-hint">Available: {formatCurrency(balance)}</div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Send</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InvestModal({ onClose, onSubmit, balance, investments, initialType = 'stocks' }) {
  const [form, setForm] = useState({ type: initialType, action: 'buy', amount: '' })
  const maxSell = investments?.[form.type] || 0
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); onClose() }

  const investmentOptions = [
    { id: 'stocks', name: '📈 Stocks', sub: 'High Growth', cardClass: 'card-stocks' },
    { id: 'mutual_funds', name: '📊 Mutual Funds', sub: 'SIP 12-15%', cardClass: 'card-mf' },
    { id: 'fd', name: '🔒 Fixed Deposit', sub: 'Guaranteed 7%', cardClass: 'card-fd' },
  ]

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 460 }}>
        <h3>📈 Invest / Withdraw</h3>
        <form onSubmit={handleSubmit}>
          <label>Select Asset Class</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
            {investmentOptions.map(opt => (
              <div
                key={opt.id}
                onClick={() => setForm({ ...form, type: opt.id })}
                className={`invest-option-card ${opt.cardClass} ${form.type === opt.id ? 'selected' : ''}`}
                style={{ padding: '10px 6px', textAlign: 'center', cursor: 'pointer', minHeight: 68, justifyContent: 'center', gap: 2 }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{opt.name}</div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>{opt.sub}</div>
              </div>
            ))}
          </div>

          <label>Investment Vehicle (Dropdown)</label>
          <div className="custom-select-wrapper">
            <select className="fin-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="stocks">📈 Equity Stocks (High Growth, Market Volatility)</option>
              <option value="mutual_funds">📊 Mutual Funds (Diversified SIP, 12-15% p.a.)</option>
              <option value="fd">🔒 Fixed Deposit (Guaranteed, 6.5-7.5% p.a.)</option>
            </select>
          </div>

          <label style={{ marginTop: 12 }}>Action</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className={`btn-toggle-action ${form.action === 'buy' ? 'buy-active' : ''}`} onClick={() => setForm({ ...form, action: 'buy' })}>🟢 Buy / Invest</button>
            <button type="button" className={`btn-toggle-action ${form.action === 'sell' ? 'sell-active' : ''}`} onClick={() => setForm({ ...form, action: 'sell' })}>🔴 Sell / Liquidate</button>
          </div>

          <label style={{ marginTop: 12 }}>Amount (₹)</label>
          <input required type="number" min="100" max={form.action === 'buy' ? balance : maxSell} value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Enter amount" />
          <div className="modal-hint">
            {form.action === 'buy' ? `Available cash: ${formatCurrency(balance)}` : `Current holding: ${formatCurrency(maxSell)}`}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoanModal({ onClose, onSubmit, initialPurpose = 'Personal Loan' }) {
  const [form, setForm] = useState({ amount: '', purpose: initialPurpose, tenure_months: 12 })

  const loanRates = {
    'Personal Loan': 0.12,
    'Education Loan': 0.095,
    'Vehicle Loan': 0.085,
    'Home Loan': 0.0875,
    'Business Loan': 0.115
  }
  const annualRate = loanRates[form.purpose] || 0.12
  const monthlyRate = annualRate / 12

  const emi = form.amount && form.tenure_months ?
    Math.round(form.amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -form.tenure_months))) : 0

  const totalRepayment = emi > 0 ? emi * form.tenure_months : 0
  const totalInterest = emi > 0 ? totalRepayment - form.amount : 0

  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); onClose() }

  const loanCards = [
    { id: 'Personal Loan', name: '💳 Personal', rate: '12% p.a.', class: 'loan-personal' },
    { id: 'Education Loan', name: '🎓 Education', rate: '9.5% p.a.', class: 'loan-edu' },
    { id: 'Vehicle Loan', name: '🚗 Vehicle', rate: '8.5% p.a.', class: 'loan-vehicle' },
    { id: 'Home Loan', name: '🏠 Home', rate: '8.75% p.a.', class: 'loan-home' },
  ]

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <h3>🏦 Apply for Loan</h3>
        <form onSubmit={handleSubmit}>
          <label>Select Loan Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
            {loanCards.map(l => (
              <div
                key={l.id}
                onClick={() => setForm({ ...form, purpose: l.id })}
                className={`loan-option-card ${l.class} ${form.purpose === l.id ? 'selected' : ''}`}
                style={{ padding: '8px 4px', textAlign: 'center', cursor: 'pointer', minHeight: 64, justifyContent: 'center', gap: 2 }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{l.name}</div>
                <div style={{ fontSize: 10, color: '#6b21a8', fontWeight: 700 }}>{l.rate}</div>
              </div>
            ))}
          </div>

          <label>Loan Category & Purpose (Dropdown)</label>
          <div className="custom-select-wrapper">
            <select className="fin-select" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
              <option value="Personal Loan">💳 Personal Loan (Quick Unsecured Credit @ 12% p.a.)</option>
              <option value="Education Loan">🎓 Higher Education Loan (Tax Benefit Sec 80E @ 9.5% p.a.)</option>
              <option value="Vehicle Loan">🚗 Vehicle / Bike Loan (Secured Asset @ 8.5% p.a.)</option>
              <option value="Home Loan">🏠 Home Loan (Long Tenure Asset @ 8.75% p.a.)</option>
              <option value="Business Loan">💼 Student Venture / MSME Loan (@ 11.5% p.a.)</option>
            </select>
          </div>

          <label style={{ marginTop: 12 }}>Loan Amount (₹)</label>
          <input required type="number" min="1000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000" />

          <label style={{ marginTop: 12 }}>Tenure: {form.tenure_months} months</label>
          <input type="range" min="6" max="60" step="6" value={form.tenure_months} onChange={e => setForm({ ...form, tenure_months: +e.target.value })} />

          {form.amount > 0 && (
            <div className="loan-metrics-row" style={{ marginTop: 12 }}>
              <div className="loan-metric-item">
                <span>Monthly EMI:</span>
                <b style={{ color: '#ef4444' }}>{formatCurrency(emi)} /mo</b>
              </div>
              <div className="loan-metric-item">
                <span>Total Repayment:</span>
                <b>{formatCurrency(totalRepayment)}</b>
              </div>
              <div className="loan-metric-item">
                <span>Total Interest:</span>
                <b style={{ color: '#d97706' }}>{formatCurrency(totalInterest)}</b>
              </div>
              <div className="loan-metric-item">
                <span>Annual Rate:</span>
                <b style={{ color: '#4338ca' }}>{(annualRate * 100).toFixed(2)}% p.a.</b>
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Apply</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WhatIfModal({ onClose, account }) {
  const [form, setForm] = useState({ scenario_type: 'invest', amount: '', years: 5, rate: 12 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/whatif`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, ...form, amount: +form.amount, years: +form.years, rate: +form.rate })
      })
      setResult(await res.json())
    } finally { setLoading(false) }
  }
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <h3>🔮 What-If Financial Engine</h3>
        <form onSubmit={handleSubmit}>
          <label>Simulation Scenario</label>
          <div className="custom-select-wrapper">
            <select className="fin-select" value={form.scenario_type} onChange={e => setForm({ ...form, scenario_type: e.target.value })}>
              <option value="invest">📈 Investment Growth (Compound SIP & Lumpsum)</option>
              <option value="save">💰 Savings Goal & Emergency Buffer</option>
              <option value="loan">🏦 Loan Cost & Debt Interest Impact</option>
            </select>
          </div>
          <label>Amount (₹)</label>
          <input required type="number" min="1000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <label>Time Period: {form.years} years</label>
          <input type="range" min="1" max="30" value={form.years} onChange={e => setForm({ ...form, years: +e.target.value })} />
          <label>Expected Rate: {form.rate}% p.a.</label>
          <input type="range" min="4" max="25" value={form.rate} onChange={e => setForm({ ...form, rate: +e.target.value })} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '⏳ Analyzing...' : 'Simulate'}</button>
          </div>
        </form>
        {result && (
          <div className="whatif-result">
            <div className="projected-value">Projected: {formatCurrency(result.projected_value)}</div>
            <p>{result.analysis}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [account, setAccount] = useState(null)
  const [market, setMarket] = useState(null)
  const [modal, setModal] = useState(null)
  const [modalVehicle, setModalVehicle] = useState('stocks')
  const [modalLoanPurpose, setModalLoanPurpose] = useState('Personal Loan')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleOpenInvest = (type = 'stocks') => {
    setModalVehicle(type)
    setModal('invest')
  }

  const handleOpenLoan = (purpose = 'Personal Loan') => {
    setModalLoanPurpose(purpose)
    setModal('loan')
  }

  const fetchAccount = async () => {
    try {
      const res = await fetch(`${API}/api/account/${USER_ID}`)
      const data = await res.json()
      setAccount(data)
      try { localStorage.setItem('finsim_account', JSON.stringify(data)) } catch (e) {}
    } catch (e) {
      try {
        const cached = localStorage.getItem('finsim_account')
        if (cached) setAccount(JSON.parse(cached))
      } catch (err) {}
    }
  }
  const fetchMarket = async () => {
    const res = await fetch(`${API}/api/market`)
    setMarket(await res.json())
  }

  useEffect(() => {
    fetchAccount()
    fetchMarket()
    const interval = setInterval(fetchMarket, 10000)
    return () => clearInterval(interval)
  }, [])

  const showAlert = (msg, type = 'info') => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleTransfer = async (form) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/transfer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, ...form, amount: +form.amount })
      })
      const data = await res.json()
      if (data.error) { showAlert(data.error, 'error'); return }
      setAccount(data.account)
      if (data.risk_alert) showAlert(`⚠️ ${data.risk_alert}`, 'warning')
      else showAlert(`✅ Sent ${formatCurrency(form.amount)} to ${form.recipient}`, 'success')
    } finally { setLoading(false) }
  }

  const handleInvest = async (form) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/invest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, ...form, amount: +form.amount })
      })
      const data = await res.json()
      if (data.error) { showAlert(data.error, 'error'); return }
      setAccount(data.account)
      showAlert(`✅ ${form.action === 'buy' ? 'Invested' : 'Sold'} ${formatCurrency(form.amount)} in ${form.type.replace('_', ' ')}`, 'success')
    } finally { setLoading(false) }
  }

  const handleLoan = async (form) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/loan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, ...form, amount: +form.amount, tenure_months: +form.tenure_months })
      })
      const data = await res.json()
      if (data.error) { showAlert(data.error, 'error'); return }
      setAccount(data.account)
      if (data.ai_advice) showAlert(`💡 ${data.ai_advice}`, 'info')
      else showAlert(`✅ Loan of ${formatCurrency(form.amount)} approved!`, 'success')
    } finally { setLoading(false) }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset your account to default? All transactions will be cleared.')) return
    await fetch(`${API}/api/reset/${USER_ID}`, { method: 'POST' })
    try { localStorage.removeItem('finsim_account') } catch (e) {}
    await fetchAccount()
    showAlert('🔄 Account reset to starting state!', 'info')
  }

  const handlePayBill = async (bill) => {
    try {
      const res = await fetch(`${API}/api/bills/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          bill_id: bill.id
        })
      })
      const data = await res.json()
      if (data.account) {
        setAccount(data.account)
        try { localStorage.setItem('finsim_account', JSON.stringify(data.account)) } catch (e) {}
      }
      showAlert(`💳 Paid ${bill.name} (${formatCurrency(bill.amount)})!`, 'success')
      return data
    } catch (e) {
      console.error(e)
    }
  }

  const handleSimulateMissedBill = async (bill, lateFee) => {
    try {
      const res = await fetch(`${API}/api/bills/miss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          bill_id: bill.id,
          late_fee: lateFee || 500
        })
      })
      const data = await res.json()
      if (data.account) {
        setAccount(data.account)
        try { localStorage.setItem('finsim_account', JSON.stringify(data.account)) } catch (e) {}
      }
      showAlert(`⚠️ Missed Due Date: ₹${lateFee} late penalty fee debited!`, 'warning')
      return data
    } catch (e) {
      console.error(e)
    }
  }

  const handleEarnBonus = async (amount, description) => {
    try {
      const res = await fetch(`${API}/api/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          amount,
          description
        })
      })
      const data = await res.json()
      if (data.account) {
        setAccount(data.account)
        showAlert(`🎉 +${formatCurrency(amount)} added to your balance for passing the quiz!`, 'success')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const totalInvestments = account ? Object.values(account.investments || {}).reduce((a, b) => a + b, 0) : 0
  const totalLoans = account ? account.loans?.reduce((a, l) => a + l.amount, 0) : 0
  const netWorth = account ? (account.balance + account.savings + totalInvestments - totalLoans) : 0

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <FinanceLogoIcon size={38} />
          </span>
          <div>
            <h1>FinSim</h1>
            <span className="tagline">Financial Literacy Sandbox</span>
          </div>
        </div>
        <div className="header-meta">
          <span className="demo-badge">🎓 Demo Mode — Fake Money</span>
          {account && <RiskBadge score={account.risk_score} />}
          <button className="btn-ghost" onClick={handleReset}>Reset</button>
        </div>
      </header>

      {/* Market Ticker */}
      <MarketTicker market={market} />

      {/* Alert */}
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* Nav Tabs */}
      <nav className="tabs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
          { id: 'advisor', label: 'AI Advisor', icon: <AIAdvisorIcon size={16} /> },
          { id: 'calculators', label: 'Calculators', icon: '🧮' },
          { id: 'budget', label: 'Budget & Bills', icon: '📅' },
          { id: 'invest', label: 'Invest & Loans', icon: '📈' },
          { id: 'academy', label: 'Academy', icon: '🎓' },
        ].map(t => (
          <button
            key={t.id}
            className={`tab tab-${t.id} ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {typeof t.icon === 'string' ? <span>{t.icon}</span> : t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className={`main-content tab-scope-${activeTab}`}>
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && account && (
          <>
            {/* HERO: 3D SHIMMER VIRTUAL CARD & NET WORTH AREA CHART */}
            <div className="dashboard-hero-grid">
              <VirtualCard account={account} />
              <NetWorthChart account={account} netWorth={netWorth} />
            </div>

            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-label">💰 Balance</div>
                <div className="stat-value">{formatCurrency(account.balance)}</div>
              </div>
              <div className="stat-card success">
                <div className="stat-label">🏦 Savings</div>
                <div className="stat-value">{formatCurrency(account.savings)}</div>
              </div>
              <div className="stat-card info">
                <div className="stat-label">📈 Investments</div>
                <div className="stat-value">{formatCurrency(totalInvestments)}</div>
              </div>
              <div className="stat-card networth">
                <div className="stat-label">💎 Net Worth</div>
                <div className="stat-value">{formatCurrency(netWorth)}</div>
              </div>
            </div>

            <div className="action-row">
              <button className="action-btn" onClick={() => setModal('transfer')}>💸 Send Money</button>
              <button className="action-btn" onClick={() => setModal('invest')}>📈 Invest</button>
              <button className="action-btn" onClick={() => setModal('loan')}>🏦 Get Loan</button>
              <button className="action-btn" onClick={() => setModal('whatif')}>🔮 What-If</button>
            </div>

            <div className="two-col">
              <div className="card">
                <h3>📊 Portfolio Breakdown</h3>
                <div className="portfolio-items">
                  {Object.entries(account.investments || {}).map(([key, val]) => (
                    <div key={key} className="portfolio-item">
                      <div className="portfolio-label">{key.replace('_', ' ').toUpperCase()}</div>
                      <div className="portfolio-bar-wrap">
                        <div className="portfolio-bar" style={{ width: `${totalInvestments > 0 ? (val / totalInvestments * 100) : 0}%` }} />
                      </div>
                      <div className="portfolio-val">{formatCurrency(val)}</div>
                    </div>
                  ))}
                </div>
                {account.loans?.length > 0 && (
                  <>
                    <h4 style={{ marginTop: 16, color: '#ef4444' }}>⚠️ Active Loans</h4>
                    {account.loans.map((l, i) => (
                      <div key={i} className="loan-item">
                        <span>{l.purpose}</span>
                        <span>{formatCurrency(l.amount)} @ EMI {formatCurrency(l.emi)}/mo</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="card financial-health-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>🎓 Financial Health Score</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                      Composite safety rating evaluating liquidity, leverage, and diversification.
                    </p>
                  </div>
                  {(() => {
                    const healthScore = Math.max(0, Math.min(100, 100 - (account.risk_score || 45)))
                    return (
                      <span className="health-rating-pill" style={{
                        background: healthScore >= 70 ? 'rgba(16, 185, 129, 0.12)' : healthScore >= 45 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: healthScore >= 70 ? '#065f46' : healthScore >= 45 ? '#92400e' : '#991b1b',
                        border: `1.5px solid ${healthScore >= 70 ? '#86efac' : healthScore >= 45 ? '#fde68a' : '#fca5a5'}`
                      }}>
                        {healthScore >= 75 ? '● PRIME STABILITY' : healthScore >= 50 ? '● MODERATE HEALTH' : '● ACTION REQUIRED'}
                      </span>
                    )
                  })()}
                </div>

                {(() => {
                  const healthScore = Math.max(0, Math.min(100, 100 - (account.risk_score || 45)))
                  const radius = 48
                  const circumference = 2 * Math.PI * radius
                  const dashOffset = circumference * (1 - healthScore / 100)

                  return (
                    <div className="health-score-container">
                      {/* SVG Emerald Circular Pie Donut */}
                      <div className="health-donut-wrapper">
                        <svg width="124" height="124" viewBox="0 0 120 120" className="health-gauge-svg">
                          <defs>
                            <linearGradient id="emeraldHealthGauge" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#064e3b" />
                              <stop offset="40%" stopColor="#047857" />
                              <stop offset="75%" stopColor="#059669" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                            <filter id="emeraldGaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#064e3b" floodOpacity="0.35" />
                            </filter>
                          </defs>
                          {/* Background Track Ring */}
                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="11"
                          />
                          {/* Dark Emerald Gradient Meter */}
                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke="url(#emeraldHealthGauge)"
                            strokeWidth="11"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 60 60)"
                            filter="url(#emeraldGaugeGlow)"
                            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                          />
                        </svg>
                        <div className="health-donut-center">
                          <span className="health-score-number">{healthScore}</span>
                          <span className="health-score-max">/ 100</span>
                        </div>
                      </div>

                      {/* Health Breakdown & Insights */}
                      <div className="health-metrics-column">
                        <div className="health-subfactor">
                          <div className="subfactor-header">
                            <span>💰 Savings Cushion</span>
                            <b>88% (Optimal)</b>
                          </div>
                          <div className="subfactor-track">
                            <div className="subfactor-fill emerald" style={{ width: '88%' }} />
                          </div>
                        </div>

                        <div className="health-subfactor">
                          <div className="subfactor-header">
                            <span>🛡️ Debt Load (EMI / Cashflow)</span>
                            <b>{account.loans?.length > 0 ? '24% (Manageable)' : '0% (Debt Free)'}</b>
                          </div>
                          <div className="subfactor-track">
                            <div className="subfactor-fill emerald" style={{ width: account.loans?.length > 0 ? '76%' : '100%' }} />
                          </div>
                        </div>

                        <div className="health-subfactor">
                          <div className="subfactor-header">
                            <span>📈 Asset Allocation</span>
                            <b>{Object.keys(account.investments || {}).filter(k => account.investments[k] > 0).length >= 3 ? 'Diversified (3/3)' : 'Standard (2/3)'}</b>
                          </div>
                          <div className="subfactor-track">
                            <div className="subfactor-fill emerald" style={{ width: '82%' }} />
                          </div>
                        </div>

                        <div className="health-action-tip">
                          {account.risk_score < 30 && <span>✅ <b>Status:</b> Outstanding financial buffer. You have strong liquid reserves to compound in equity and mutual funds.</span>}
                          {account.risk_score >= 30 && account.risk_score < 60 && <span>⚠️ <b>Status:</b> Moderate stability. Prepay high-interest loans early to reduce monthly obligations.</span>}
                          {account.risk_score >= 60 && <span>🚨 <b>Status:</b> High risk exposure. Direct surplus cashflow toward loan closure before expanding speculative trades.</span>}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <button className="btn-secondary" style={{ width: '100%', marginTop: 14, borderRadius: 10, padding: '9px 16px' }} onClick={() => setModal('whatif')}>
                  🔮 Try Financial What-If Simulator
                </button>
              </div>
            </div>

            <TransactionList transactions={account.transactions} />
          </>
        )}

        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && account && (
          <TransactionList transactions={account.transactions} />
        )}

        {/* CALCULATORS */}
        {activeTab === 'calculators' && (
          <CalculatorsView />
        )}

        {/* BUDGET & BILLS CALENDAR */}
        {activeTab === 'budget' && (
          <BudgetAndBillsView
            account={account}
            onPayBill={handlePayBill}
            onSimulateMissedBill={handleSimulateMissedBill}
          />
        )}

        {/* INVEST & LOANS */}
        {activeTab === 'invest' && account && (
          <>
            {/* ── INVESTMENT VEHICLE OPTION CARDS (SUBTLE GRADIENTS) ── */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 850, margin: 0 }}>📈 My Investment Portfolio</h3>
                  <p className="card-subtitle" style={{ margin: '4px 0 0' }}>
                    Select an asset class to inspect allocation, historical yields, or buy/sell positions.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Portfolio</span>
                  <div style={{ fontSize: 22, fontWeight: 850, color: '#0f172a' }}>{formatCurrency(totalInvestments)}</div>
                </div>
              </div>

              <div className="invest-options-grid">
                {/* 1. Equity Stocks Option Card */}
                <div className="invest-option-card card-stocks" onClick={() => handleOpenInvest('stocks')}>
                  <div className="invest-card-header">
                    <div className="invest-card-title-group">
                      <h4>📈 Equity Stocks</h4>
                      <span className="invest-card-risk-pill high">High Growth · 14-18% p.a.</span>
                    </div>
                    <span style={{ fontSize: 22 }}>🚀</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#334155', margin: 0, lineHeight: 1.45 }}>
                    Ownership shares in high-performing companies. High volatility with highest long-term compounding potential.
                  </p>
                  <div className="invest-card-holding-row">
                    <span className="invest-holding-label">Current Holding:</span>
                    <span className="invest-holding-val">{formatCurrency(account.investments?.stocks || 0)}</span>
                  </div>
                  <div className="invest-card-actions">
                    <button type="button" className="btn-invest-action primary" onClick={(e) => { e.stopPropagation(); handleOpenInvest('stocks') }}>
                      + Trade Stocks
                    </button>
                  </div>
                </div>

                {/* 2. Mutual Funds Option Card */}
                <div className="invest-option-card card-mf" onClick={() => handleOpenInvest('mutual_funds')}>
                  <div className="invest-card-header">
                    <div className="invest-card-title-group">
                      <h4>📊 Mutual Funds</h4>
                      <span className="invest-card-risk-pill moderate">Balanced SIP · 12-15% p.a.</span>
                    </div>
                    <span style={{ fontSize: 22 }}>🌱</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#334155', margin: 0, lineHeight: 1.45 }}>
                    Professionally managed, basket-diversified index and equity funds. Ideal for regular monthly SIP wealth creation.
                  </p>
                  <div className="invest-card-holding-row">
                    <span className="invest-holding-label">Current Holding:</span>
                    <span className="invest-holding-val">{formatCurrency(account.investments?.mutual_funds || 0)}</span>
                  </div>
                  <div className="invest-card-actions">
                    <button type="button" className="btn-invest-action primary" onClick={(e) => { e.stopPropagation(); handleOpenInvest('mutual_funds') }}>
                      + Start SIP / Buy
                    </button>
                  </div>
                </div>

                {/* 3. Fixed Deposit Option Card */}
                <div className="invest-option-card card-fd" onClick={() => handleOpenInvest('fd')}>
                  <div className="invest-card-header">
                    <div className="invest-card-title-group">
                      <h4>🔒 Fixed Deposit (FD)</h4>
                      <span className="invest-card-risk-pill low">Guaranteed Capital · 6.5-7.5% p.a.</span>
                    </div>
                    <span style={{ fontSize: 22 }}>🛡️</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#334155', margin: 0, lineHeight: 1.45 }}>
                    Bank-backed capital security with guaranteed quarterly compounding. Perfect safe harbor for emergency funds.
                  </p>
                  <div className="invest-card-holding-row">
                    <span className="invest-holding-label">Current Holding:</span>
                    <span className="invest-holding-val">{formatCurrency(account.investments?.fd || 0)}</span>
                  </div>
                  <div className="invest-card-actions">
                    <button type="button" className="btn-invest-action primary" onClick={(e) => { e.stopPropagation(); handleOpenInvest('fd') }}>
                      + Open / Liquidate FD
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE MARKET & VOLATILITY ALERT */}
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>📰 Live Financial Market Indices</h3>
                <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>● Live Stream Synced</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {market?.trending_stocks?.map(s => (
                  <div key={s.name} className="stock-row" style={{ margin: 0, background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <b>{s.name}</b>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 750 }}>₹{s.price}</span>
                      <span style={{ marginLeft: 6, color: s.change_percent >= 0 ? '#16a34a' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
                        {s.change_percent > 0 ? '▲' : '▼'} {Math.abs(s.change_percent).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: 12, background: '#f5f3ff', borderRadius: 10, fontSize: 13, color: '#4c1d95', border: '1px solid #ddd6fe' }}>
                💡 <b>Market Wisdom:</b> Asset allocation across Stocks, Mutual Funds, and FDs reduces volatility risk by over 60% compared to holding individual stocks alone.
              </div>
            </div>

            {/* ── LOANS & CREDIT LINES (GRADIENT-ENHANCED OPTION CARDS) ── */}
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 850, margin: 0 }}>🏦 Loan Products & Credit Lines</h3>
                  <p className="card-subtitle" style={{ margin: '4px 0 0' }}>
                    Compare interest rates, tenure options, and estimated monthly EMIs before applying.
                  </p>
                </div>
                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => handleOpenLoan('Personal Loan')}>
                  + Custom Loan Application
                </button>
              </div>

              {/* 4 Soft Gradient Loan Option Cards */}
              <div className="loans-options-grid">
                {/* 1. Personal Loan Card */}
                <div className="loan-option-card loan-personal" onClick={() => handleOpenLoan('Personal Loan')}>
                  <div className="loan-card-top">
                    <div>
                      <div className="loan-type-title">💳 Personal Loan</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Quick Unsecured Credit</div>
                    </div>
                    <span className="loan-rate-badge">12.0% p.a.</span>
                  </div>
                  <div className="loan-metrics-row">
                    <div className="loan-metric-item">
                      <span>Max Tenure:</span>
                      <b>36 Months</b>
                    </div>
                    <div className="loan-metric-item">
                      <span>Sample EMI (₹50k):</span>
                      <b>₹4,442/mo</b>
                    </div>
                  </div>
                  <button type="button" className="btn-loan-select" onClick={(e) => { e.stopPropagation(); handleOpenLoan('Personal Loan') }}>
                    Apply for Personal Loan →
                  </button>
                </div>

                {/* 2. Higher Education Loan Card */}
                <div className="loan-option-card loan-edu" onClick={() => handleOpenLoan('Education Loan')}>
                  <div className="loan-card-top">
                    <div>
                      <div className="loan-type-title">🎓 Education Loan</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Sec 80E Tax Deduction</div>
                    </div>
                    <span className="loan-rate-badge" style={{ color: '#4338ca', background: '#e0e7ff' }}>9.5% p.a.</span>
                  </div>
                  <div className="loan-metrics-row">
                    <div className="loan-metric-item">
                      <span>Max Tenure:</span>
                      <b>60 Months</b>
                    </div>
                    <div className="loan-metric-item">
                      <span>Sample EMI (₹50k):</span>
                      <b>₹4,383/mo</b>
                    </div>
                  </div>
                  <button type="button" className="btn-loan-select" onClick={(e) => { e.stopPropagation(); handleOpenLoan('Education Loan') }}>
                    Apply for Education Loan →
                  </button>
                </div>

                {/* 3. Vehicle Loan Card */}
                <div className="loan-option-card loan-vehicle" onClick={() => handleOpenLoan('Vehicle Loan')}>
                  <div className="loan-card-top">
                    <div>
                      <div className="loan-type-title">🚗 Vehicle Loan</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Secured Asset Financing</div>
                    </div>
                    <span className="loan-rate-badge" style={{ color: '#0369a1', background: '#e0f2fe' }}>8.5% p.a.</span>
                  </div>
                  <div className="loan-metrics-row">
                    <div className="loan-metric-item">
                      <span>Max Tenure:</span>
                      <b>48 Months</b>
                    </div>
                    <div className="loan-metric-item">
                      <span>Sample EMI (₹50k):</span>
                      <b>₹4,361/mo</b>
                    </div>
                  </div>
                  <button type="button" className="btn-loan-select" onClick={(e) => { e.stopPropagation(); handleOpenLoan('Vehicle Loan') }}>
                    Apply for Vehicle Loan →
                  </button>
                </div>

                {/* 4. Home Loan Card */}
                <div className="loan-option-card loan-home" onClick={() => handleOpenLoan('Home Loan')}>
                  <div className="loan-card-top">
                    <div>
                      <div className="loan-type-title">🏠 Home Loan</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Long-Term Wealth Asset</div>
                    </div>
                    <span className="loan-rate-badge" style={{ color: '#334155', background: '#f1f5f9' }}>8.75% p.a.</span>
                  </div>
                  <div className="loan-metrics-row">
                    <div className="loan-metric-item">
                      <span>Max Tenure:</span>
                      <b>60 Months</b>
                    </div>
                    <div className="loan-metric-item">
                      <span>Sample EMI (₹50k):</span>
                      <b>₹4,366/mo</b>
                    </div>
                  </div>
                  <button type="button" className="btn-loan-select" onClick={(e) => { e.stopPropagation(); handleOpenLoan('Home Loan') }}>
                    Apply for Home Loan →
                  </button>
                </div>
              </div>
            </div>

            {/* ACTIVE LOANS & DEBT PRUDENCE RULES */}
            <div className="two-col" style={{ marginTop: 16 }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>🏦 Active Loans & Credit Line</h3>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                    {account.loans?.length || 0} Active
                  </span>
                </div>
                {account.loans?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: '#166534', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 4 }}>🎉</span>
                    <b>Debt-Free Status Achieved!</b>
                    <p style={{ margin: 0, fontSize: 12, color: '#15803d' }}>No active liabilities draining your monthly cash flow.</p>
                  </div>
                )}
                {account.loans?.map((l, i) => (
                  <div key={i} className="invest-row" style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 10 }}>
                    <div>
                      <b style={{ fontSize: 15, color: '#0f172a' }}>{l.purpose}</b>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{l.tenure_months} months tenure @ 12% p.a.</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 850, color: '#ef4444' }}>{formatCurrency(l.amount)}</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>EMI: {formatCurrency(l.emi)}/mo</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3>📚 Loan & Debt Rules</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                  <div style={{ padding: 14, background: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a' }}>
                    <b style={{ color: '#92400e' }}>📐 Monthly EMI Formula</b><br />
                    <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                      EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)
                    </code><br />
                    <span style={{ fontSize: 12, color: '#78350f' }}>where P = principal, r = monthly interest rate, n = tenure in months</span>
                  </div>
                  <div style={{ padding: 14, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                    <b style={{ color: '#1e40af' }}>⚠️ 40% Debt-to-Income Limit</b><br />
                    <span style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
                      Never allow total monthly loan EMIs to exceed 40% of net monthly earnings. Going above 40% invites debt spirals and damages your CIBIL score.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ACADEMY */}
        {activeTab === 'academy' && (
          <AcademyView onEarnBonus={handleEarnBonus} />
        )}

        {/* AI ADVISOR */}
        {activeTab === 'advisor' && (
          <AIAdvisorView account={account} />
        )}
      </main>

      {/* Modals */}
      {modal === 'transfer' && <TransferModal onClose={() => setModal(null)} onSubmit={handleTransfer} balance={account?.balance} />}
      {modal === 'invest' && <InvestModal onClose={() => setModal(null)} onSubmit={handleInvest} balance={account?.balance} investments={account?.investments} initialType={modalVehicle} />}
      {modal === 'loan' && <LoanModal onClose={() => setModal(null)} onSubmit={handleLoan} initialPurpose={modalLoanPurpose} />}
      {modal === 'whatif' && <WhatIfModal onClose={() => setModal(null)} account={account} />}
    </div>
  )
}

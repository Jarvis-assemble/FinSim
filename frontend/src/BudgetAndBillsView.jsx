import React, { useState } from 'react'

const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

// Helper to calculate ISO date string from today + days
const getOffsetDateString = (daysOffset) => {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function BudgetAndBillsView({ account, onPayBill, onSimulateMissedBill }) {
  // Monthly income assumption
  const [monthlyIncome, setMonthlyIncome] = useState(40000)

  // 50/30/20 targets
  const needsTarget = monthlyIncome * 0.50
  const wantsTarget = monthlyIncome * 0.30
  const savingsTarget = monthlyIncome * 0.20

  // Simulated current monthly expenses
  const [expenses, setExpenses] = useState({
    needs: 16500, // Rent, Groceries, Electricity
    wants: 7200,  // Dining, Netflix, shopping
    savings: 8000 // SIP, Emergency fund
  })

  // Today's date object & string
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Default bills fallback with explicit due dates
  const defaultBills = [
    { id: 'b1', name: 'HDFC Millennia Credit Card', amount: 4850, dueInDays: 3, dueDate: getOffsetDateString(3), category: '💳 Credit Card', isPaid: false, isLate: false },
    { id: 'b2', name: 'Apartment Monthly Rent', amount: 3500, dueInDays: 6, dueDate: getOffsetDateString(6), category: '🏠 Rent', isPaid: false, isLate: false },
    { id: 'b3', name: 'BESCOM Electricity Bill', amount: 780, dueInDays: 10, dueDate: getOffsetDateString(10), category: '⚡ Utility', isPaid: false, isLate: false },
    { id: 'b4', name: 'Education Loan EMI', amount: 1500, dueInDays: 14, dueDate: getOffsetDateString(14), category: '🏦 Loan', isPaid: false, isLate: false },
  ]

  // Custom bills added by the user
  const [customBills, setCustomBills] = useState(() => {
    try {
      const saved = localStorage.getItem('finsim_custom_bills')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  // State for Add Bill form
  const [showAddBillForm, setShowAddBillForm] = useState(false)
  const [newBillForm, setNewBillForm] = useState({
    name: '',
    amount: '',
    category: '💳 Credit Card',
    dueDate: todayStr
  })

  // Live state from account (persists across tab switches and refreshes)
  const baseBills = account?.bills && account.bills.length > 0 ? account.bills : defaultBills
  // Merge base bills with any custom bills
  const bills = [
    ...baseBills.map(b => ({
      ...b,
      dueDate: b.dueDate || getOffsetDateString(b.dueInDays || 3)
    })),
    ...customBills
  ]

  const creditScore = account?.credit_score ?? 750
  const [statusMessage, setStatusMessage] = useState(null)

  // ── CALENDAR STATE ──
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState(todayStr)

  // Calendar Navigation
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(prev => prev - 1)
    } else {
      setCalMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(prev => prev + 1)
    } else {
      setCalMonth(prev => prev + 1)
    }
  }

  const handleGoToday = () => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setSelectedDate(todayStr)
  }

  // Handle Add Bill
  const handleAddBill = (e) => {
    e.preventDefault()
    if (!newBillForm.name || !newBillForm.amount || !newBillForm.dueDate) return

    const newBill = {
      id: `custom_${Date.now()}`,
      name: newBillForm.name,
      amount: parseFloat(newBillForm.amount),
      category: newBillForm.category,
      dueDate: newBillForm.dueDate,
      dueInDays: Math.ceil((new Date(newBillForm.dueDate) - new Date()) / 86400000),
      isPaid: false,
      isLate: false
    }

    const updated = [...customBills, newBill]
    setCustomBills(updated)
    try {
      localStorage.setItem('finsim_custom_bills', JSON.stringify(updated))
    } catch (err) {}

    setShowAddBillForm(false)
    setNewBillForm({ name: '', amount: '', category: '💳 Credit Card', dueDate: selectedDate })
    setStatusMessage({
      type: 'success',
      text: `📅 Scheduled bill "${newBill.name}" (${formatCurrency(newBill.amount)}) due on ${newBill.dueDate}!`
    })
  }

  const handlePay = async (bill) => {
    if (bill.isPaid) return
    if (account && account.balance < bill.amount) {
      setStatusMessage({ type: 'error', text: `❌ Insufficient balance to pay ${bill.name} (${formatCurrency(bill.amount)})` })
      return
    }

    if (bill.id.startsWith('custom_')) {
      // Update custom bill state locally
      const updated = customBills.map(b => b.id === bill.id ? { ...b, isPaid: true, isLate: false } : b)
      setCustomBills(updated)
      try { localStorage.setItem('finsim_custom_bills', JSON.stringify(updated)) } catch (e) {}
    } else if (onPayBill) {
      await onPayBill(bill)
    }

    const newScore = Math.min(850, creditScore + 5)
    setStatusMessage({
      type: 'success',
      text: `✅ Paid ${bill.name} (${formatCurrency(bill.amount)}). On-time payment reported to CIBIL! Credit Score +5 points (Now ${newScore}).`
    })
  }

  const handleMiss = async (bill) => {
    if (bill.isPaid || bill.isLate) return
    const lateFee = 500

    if (bill.id.startsWith('custom_')) {
      const updated = customBills.map(b => b.id === bill.id ? { ...b, isLate: true } : b)
      setCustomBills(updated)
      try { localStorage.setItem('finsim_custom_bills', JSON.stringify(updated)) } catch (e) {}
    } else if (onSimulateMissedBill) {
      await onSimulateMissedBill(bill, lateFee)
    }

    const newScore = Math.max(300, creditScore - 45)
    setStatusMessage({
      type: 'warning',
      text: `⚠️ Missed due date for ${bill.name}! A ₹${lateFee} late fee was added, and 42% annualized penalty interest applies. CIBIL Score dropped by -45 points to ${newScore} (Loan rejection risk!).`
    })
  }

  // Credit score rating
  const getScoreRating = (score) => {
    if (score >= 780) return { label: 'Excellent', color: '#16a34a' }
    if (score >= 700) return { label: 'Good', color: '#65a30d' }
    if (score >= 650) return { label: 'Average (Higher Interest)', color: '#d97706' }
    return { label: 'Poor (High Rejection Risk)', color: '#dc2626' }
  }

  // Interactive CIBIL scenario simulation
  const [simScenario, setSimScenario] = useState(null)
  const simOffset = simScenario === 'early_pay' ? 15 : simScenario === 'high_util' ? -35 : simScenario === 'miss_emi' ? -50 : 0
  const displayScore = Math.max(300, Math.min(900, creditScore + simOffset))
  const rating = getScoreRating(displayScore)

  // ── BUILD CALENDAR DAYS ──
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const firstDayWeekday = new Date(calYear, calMonth, 1).getDay()
  const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate()

  const calendarDays = []

  // Trailing days from previous month
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    const prevMonth = calMonth === 0 ? 11 : calMonth - 1
    const prevYear = calMonth === 0 ? calYear - 1 : calYear
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    calendarDays.push({
      dayNum,
      dateStr,
      isCurrentMonth: false
    })
  }

  // Days in current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarDays.push({
      dayNum: d,
      dateStr,
      isCurrentMonth: true
    })
  }

  // Leading days into next month to complete row of 7
  const remainingCells = (7 - (calendarDays.length % 7)) % 7
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = calMonth === 11 ? 0 : calMonth + 1
    const nextYear = calMonth === 11 ? calYear + 1 : calYear
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarDays.push({
      dayNum: d,
      dateStr,
      isCurrentMonth: false
    })
  }

  // Bills matching the currently selected date
  const selectedDateBills = bills.filter(b => b.dueDate === selectedDate)

  // Formatted date string for selected date
  const formatSelectedDateHeader = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="budget-calendar-container">
      {statusMessage && (
        <div className={`alert alert-${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {/* TOP ROW: 50/30/20 BUDGET + CREDIT SCORE CARD */}
      <div className="two-col">
        {/* 50/30/20 BUDGET PLANNER */}
        <div className="card budget-planner-card">
          <div className="budget-header-row">
            <div>
              <h3>📊 50/30/20 Monthly Budget</h3>
              <p className="card-subtitle">Gold standard budgeting rule for young earners & students.</p>
            </div>
            <div className="income-badge">
              <span>Income:</span>
              <b>{formatCurrency(monthlyIncome)}</b>
            </div>
          </div>

          {/* SVG Donut Visualizer */}
          <div className="budget-donut-section">
            <div className="donut-chart-container">
              <svg width="150" height="150" viewBox="0 0 120 120" className="budget-donut-svg">
                <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                <circle
                  cx="60" cy="60" r="45" fill="none" stroke="#3b82f6" strokeWidth="16"
                  strokeDasharray="141.37 141.37" strokeDashoffset="0"
                  transform="rotate(-90 60 60)" className="donut-segment"
                />
                <circle
                  cx="60" cy="60" r="45" fill="none" stroke="#f59e0b" strokeWidth="16"
                  strokeDasharray="84.82 197.92" strokeDashoffset="-141.37"
                  transform="rotate(-90 60 60)" className="donut-segment"
                />
                <circle
                  cx="60" cy="60" r="45" fill="none" stroke="#10b981" strokeWidth="16"
                  strokeDasharray="56.55 226.19" strokeDashoffset="-226.19"
                  transform="rotate(-90 60 60)" className="donut-segment"
                />
                <text x="60" y="56" textAnchor="middle" className="donut-center-title" fill="#64748b" fontSize="9" fontWeight="600">TOTAL</text>
                <text x="60" y="70" textAnchor="middle" className="donut-center-val" fill="#1e293b" fontSize="12" fontWeight="800">100%</text>
              </svg>
            </div>

            <div className="donut-legend-col">
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }} />
                <span className="legend-name">Needs (50%)</span>
                <b className="legend-val">{formatCurrency(needsTarget)}</b>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }} />
                <span className="legend-name">Wants (30%)</span>
                <b className="legend-val">{formatCurrency(wantsTarget)}</b>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }} />
                <span className="legend-name">Savings (20%)</span>
                <b className="legend-val">{formatCurrency(savingsTarget)}</b>
              </div>
            </div>
          </div>

          <div className="budget-items">
            {/* Needs Card */}
            <div className="budget-category-card needs">
              <div className="budget-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="envelope-tag needs">50% Needs</span>
                  <span className="category-essential-pill">Essential</span>
                </div>
                <div className="budget-amount-track">
                  <b>{formatCurrency(expenses.needs)}</b> <span className="budget-target-sub">/ {formatCurrency(needsTarget)}</span>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill needs-fill"
                  style={{ width: `${Math.min(100, (expenses.needs / needsTarget) * 100)}%` }}
                />
              </div>
              <div className="budget-caption">🏠 Rent, groceries, utilities, basic travel, medicines</div>
            </div>

            {/* Wants Card */}
            <div className="budget-category-card wants">
              <div className="budget-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="envelope-tag wants">30% Wants</span>
                  <span className="category-lifestyle-pill">Lifestyle</span>
                </div>
                <div className="budget-amount-track">
                  <b>{formatCurrency(expenses.wants)}</b> <span className="budget-target-sub">/ {formatCurrency(wantsTarget)}</span>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill wants-fill"
                  style={{ width: `${Math.min(100, (expenses.wants / wantsTarget) * 100)}%` }}
                />
              </div>
              <div className="budget-caption">☕ Dining out, Netflix, shopping, hobbies, weekend trips</div>
            </div>

            {/* Savings Card */}
            <div className="budget-category-card savings">
              <div className="budget-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="envelope-tag savings">20% Savings</span>
                  <span className="category-wealth-pill">Wealth & Debt</span>
                </div>
                <div className="budget-amount-track">
                  <b>{formatCurrency(expenses.savings)}</b> <span className="budget-target-sub">/ {formatCurrency(savingsTarget)}</span>
                </div>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill savings-fill"
                  style={{ width: `${Math.min(100, (expenses.savings / savingsTarget) * 100)}%` }}
                />
              </div>
              <div className="budget-caption">📈 Mutual Fund SIP, Emergency reserve, loan prepayments</div>
            </div>
          </div>

          <div className="budget-rule-tip">
            💡 <b>Pro-Tip:</b> If your Needs exceed 50%, downsize recurring subscriptions before touching your 20% savings cushion!
          </div>
        </div>

        {/* CIBIL CREDIT SCORE MONITOR */}
        <div className="card cibil-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3>🛡️ CIBIL Credit Score Simulator</h3>
              <p className="card-subtitle">Real-time simulation of loan eligibility, inquiry risks, and repayment discipline.</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 750, padding: '3px 10px', borderRadius: 12, background: 'rgba(99, 102, 241, 0.12)', color: '#4338ca', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
              ● Bureau Synced
            </span>
          </div>

          {/* Credit Score Gauge + Spectrum */}
          <div className="credit-score-widget">
            <div className="cibil-meter">
              <div className="cibil-score-val" style={{ color: rating.color }}>
                {displayScore}
              </div>
              <div className="cibil-label">out of 900</div>
              <div className="cibil-badge" style={{ backgroundColor: rating.color }}>
                {rating.label}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Range Spectrum Bar */}
              <div className="cibil-spectrum-container">
                <div className="cibil-spectrum-labels">
                  <span>300 (Poor)</span>
                  <span>650</span>
                  <span>750</span>
                  <span>900 (Excellent)</span>
                </div>
                <div className="cibil-spectrum-track">
                  <div className="spectrum-segment red" style={{ width: '35%' }} title="Poor: 300-649" />
                  <div className="spectrum-segment amber" style={{ width: '20%' }} title="Average: 650-699" />
                  <div className="spectrum-segment lime" style={{ width: '20%' }} title="Good: 700-749" />
                  <div className="spectrum-segment green" style={{ width: '25%' }} title="Excellent: 750-900" />
                  {/* Pin Indicator */}
                  <div
                    className="spectrum-pin"
                    style={{ left: `${Math.min(96, Math.max(4, ((displayScore - 300) / 600) * 100))}%` }}
                    title={`Current Score: ${displayScore}`}
                  >
                    ▼
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div style={{ fontSize: 12, color: '#334155', background: 'rgba(255,255,255,0.85)', padding: '7px 12px', borderRadius: 8, border: '1px solid #e0e7ff', lineHeight: 1.4 }}>
                💡 <b>Profile:</b> {displayScore >= 750 ? 'Prime Borrower. Eligible for lowest loan rates & pre-approved credit cards.' : displayScore >= 680 ? 'Standard Borrower. Good chances for loan approvals with standard fees.' : 'High Risk. Frequent loan rejections or higher interest margins (14%+).'}
              </div>
            </div>
          </div>

          {/* 5-Pillar CIBIL Scoring Breakdown */}
          <div className="cibil-factors-box">
            <div className="cibil-factors-header">
              <span style={{ fontWeight: 800, fontSize: 12.5, color: '#1e1b4b' }}>📊 5 Core Credit Health Pillars</span>
              <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>Bureau Weightage</span>
            </div>

            <div className="cibil-factor-item">
              <div className="factor-main-info">
                <span>⏱️ Payment History (35%)</span>
                <span className={`factor-status-tag ${displayScore >= 700 ? 'good' : 'alert'}`}>
                  {displayScore >= 700 ? '98% On-Time (Healthy)' : 'Late Dues Detected'}
                </span>
              </div>
              <div className="factor-progress-bg">
                <div className="factor-progress-bar" style={{ width: displayScore >= 700 ? '98%' : '55%', background: displayScore >= 700 ? '#10b981' : '#ef4444' }} />
              </div>
            </div>

            <div className="cibil-factor-item">
              <div className="factor-main-info">
                <span>💳 Credit Utilization (30%)</span>
                <span className="factor-status-tag good">24% of ₹75k Limit (Optimal &lt;30%)</span>
              </div>
              <div className="factor-progress-bg">
                <div className="factor-progress-bar" style={{ width: '24%', background: '#3b82f6' }} />
              </div>
            </div>

            <div className="cibil-factor-item">
              <div className="factor-main-info">
                <span>📅 Credit History Age (15%)</span>
                <span className="factor-status-tag medium">2.4 Years Average (Moderate)</span>
              </div>
              <div className="factor-progress-bg">
                <div className="factor-progress-bar" style={{ width: '65%', background: '#8b5cf6' }} />
              </div>
            </div>

            <div className="cibil-factor-item">
              <div className="factor-main-info">
                <span>🏦 Credit Mix (10%)</span>
                <span className="factor-status-tag good">Balanced (1 Card + 1 Edu Loan)</span>
              </div>
              <div className="factor-progress-bg">
                <div className="factor-progress-bar" style={{ width: '85%', background: '#10b981' }} />
              </div>
            </div>

            <div className="cibil-factor-item">
              <div className="factor-main-info">
                <span>🔍 Hard Inquiries (10%)</span>
                <span className="factor-status-tag good">0 Pulls in 6 Mos (Low Risk)</span>
              </div>
              <div className="factor-progress-bg">
                <div className="factor-progress-bar" style={{ width: '100%', background: '#10b981' }} />
              </div>
            </div>
          </div>

          {/* Interactive What-If Scenario Levers */}
          <div className="cibil-sim-levers-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1e1b4b' }}>🧪 Interactive "What-If" Levers</span>
              {simScenario && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 11.5, fontWeight: 750, cursor: 'pointer', padding: 0 }}
                  onClick={() => setSimScenario(null)}
                >
                  ↺ Reset Score
                </button>
              )}
            </div>

            <div className="sim-buttons-grid">
              <button
                type="button"
                className={`btn-sim-lever ${simScenario === 'early_pay' ? 'active' : ''}`}
                onClick={() => setSimScenario(simScenario === 'early_pay' ? null : 'early_pay')}
              >
                <span>💳 Pay ₹15k Balance Early</span>
                <b style={{ color: '#16a34a' }}>+15 pts</b>
              </button>

              <button
                type="button"
                className={`btn-sim-lever ${simScenario === 'high_util' ? 'active' : ''}`}
                onClick={() => setSimScenario(simScenario === 'high_util' ? null : 'high_util')}
              >
                <span>⚠️ Max Out Card to 85%</span>
                <b style={{ color: '#dc2626' }}>-35 pts</b>
              </button>

              <button
                type="button"
                className={`btn-sim-lever ${simScenario === 'miss_emi' ? 'active' : ''}`}
                onClick={() => setSimScenario(simScenario === 'miss_emi' ? null : 'miss_emi')}
              >
                <span>❌ Miss Loan EMI (30d)</span>
                <b style={{ color: '#dc2626' }}>-50 pts</b>
              </button>
            </div>

            {simScenario && (
              <div className="sim-feedback-box">
                {simScenario === 'early_pay' && (
                  <div>
                    🌟 <b>Early Payment Impact:</b> Paying down your card balance before the statement generation date drops your reported credit utilization from 24% down to 6%. Lenders see zero credit distress! <b>Simulated Score: {displayScore} (+15 pts)</b>.
                  </div>
                )}
                {simScenario === 'high_util' && (
                  <div>
                    ⚠️ <b>Over-Utilization Penalty:</b> Spending &gt;80% of your credit limit signals financial strain to bureaus, even if you intend to pay later. <b>Simulated Score: {displayScore} (-35 pts)</b>.
                  </div>
                )}
                {simScenario === 'miss_emi' && (
                  <div>
                    🚨 <b>Default Notice:</b> Missing an EMI for 30+ days causes a DPD (Days Past Due) flag across CIBIL, Experian, and CRIF. Can take 18-24 months of on-time payments to recover. <b>Simulated Score: {displayScore} (-50 pts)</b>.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bank Loan Eligibility Grid */}
          <div className="cibil-eligibility-row">
            <div className="eligibility-box">
              <div className="el-title">🏠 Home Loan</div>
              <div className="el-val" style={{ color: displayScore >= 750 ? '#16a34a' : '#d97706' }}>
                {displayScore >= 750 ? 'Pre-Approved (8.4%)' : displayScore >= 680 ? 'Approved (9.2%)' : 'Co-signer Required'}
              </div>
            </div>
            <div className="eligibility-box">
              <div className="el-title">💳 Card Pre-Approval</div>
              <div className="el-val" style={{ color: displayScore >= 720 ? '#16a34a' : '#64748b' }}>
                {displayScore >= 720 ? '₹3.5L Limit · Lifetime Free' : 'Standard Limit'}
              </div>
            </div>
            <div className="eligibility-box">
              <div className="el-title">🚗 Car Loan</div>
              <div className="el-val" style={{ color: displayScore >= 700 ? '#16a34a' : '#dc2626' }}>
                {displayScore >= 700 ? 'Instant Disbursal (8.9%)' : 'Higher Margin (12%)'}
              </div>
            </div>
          </div>

          <div className="calc-tip-card alert-blue" style={{ marginTop: 12 }}>
            🎯 <b>CIBIL Golden Rule:</b> Always clear 100% of your Total Amount Due before the billing deadline. Setting an automatic debit 3 days before due date safeguards your score forever!
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE PAYMENT DUE-DATE CALENDAR ─────────────────── */}
      <div className="calendar-card">
        <div className="calendar-header-row">
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 850, color: '#0f172a', margin: 0 }}>
              📅 Interactive Bill Due-Date Calendar
            </h3>
            <p className="card-subtitle" style={{ margin: '4px 0 0' }}>
              Track payment deadlines, schedule upcoming bills, and avoid CIBIL score penalties.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="calendar-month-nav">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handlePrevMonth}
                title="Previous Month"
                aria-label="Previous Month"
              >
                ◀
              </button>
              <div className="calendar-month-title">
                {monthNames[calMonth]} {calYear}
              </div>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handleNextMonth}
                title="Next Month"
                aria-label="Next Month"
              >
                ▶
              </button>
            </div>

            <button
              type="button"
              className="calendar-today-btn"
              onClick={handleGoToday}
            >
              Today
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: 13 }}
              onClick={() => {
                setNewBillForm(prev => ({ ...prev, dueDate: selectedDate }))
                setShowAddBillForm(!showAddBillForm)
              }}
            >
              {showAddBillForm ? '✕ Close Form' : '+ Add Bill'}
            </button>
          </div>
        </div>

        {/* Dedicated Spacious Add Bill Form Card */}
        {showAddBillForm && (
          <form className="add-bill-form-card" onSubmit={handleAddBill}>
            <div className="add-bill-card-header">
              <div className="add-bill-icon-wrapper">🧾</div>
              <div className="add-bill-header-text">
                <h4>Add a New Bill</h4>
                <p>Schedule a one-time or recurring payment to track on your calendar.</p>
              </div>
            </div>

            <div className="add-bill-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="bill-name-input">
                  Bill or Service Name <span className="req-star">*</span>
                </label>
                <input
                  id="bill-name-input"
                  required
                  type="text"
                  className="fin-input"
                  placeholder="e.g. Jio Fiber, HDFC Card, Rent"
                  value={newBillForm.name}
                  onChange={e => setNewBillForm({ ...newBillForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bill-cat-select">
                  Category <span className="req-star">*</span>
                </label>
                <div className="custom-select-wrapper" style={{ margin: 0, width: '100%' }}>
                  <select
                    id="bill-cat-select"
                    className="fin-select"
                    value={newBillForm.category}
                    onChange={e => setNewBillForm({ ...newBillForm, category: e.target.value })}
                  >
                    <option value="💳 Credit Card">💳 Credit Card</option>
                    <option value="🏠 Rent">🏠 Rent</option>
                    <option value="⚡ Utility">⚡ Utility / Electricity</option>
                    <option value="🏦 Loan">🏦 Loan EMI</option>
                    <option value="🌐 Internet">🌐 Mobile / Broadband</option>
                    <option value="🛡️ Insurance">🛡️ Insurance Premium</option>
                    <option value="🎬 Subscription">🎬 OTT Subscription</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bill-amount-input">
                  Amount (₹) <span className="req-star">*</span>
                </label>
                <input
                  id="bill-amount-input"
                  required
                  type="number"
                  min="10"
                  className="fin-input"
                  placeholder="e.g. 1999"
                  value={newBillForm.amount}
                  onChange={e => setNewBillForm({ ...newBillForm, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bill-date-input">
                  Payment Due Date <span className="req-star">*</span>
                </label>
                <input
                  id="bill-date-input"
                  required
                  type="date"
                  className="fin-input"
                  value={newBillForm.dueDate}
                  onChange={e => setNewBillForm({ ...newBillForm, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="add-bill-footer-actions">
              <button
                type="button"
                className="btn-cancel-bill"
                onClick={() => setShowAddBillForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save-bill"
              >
                ➕ Schedule Bill
              </button>
            </div>
          </form>
        )}

        {/* Calendar Layout: Month Grid + Selected Date Panel */}
        <div className="calendar-layout-grid">
          {/* Calendar Surface */}
          <div className="calendar-grid-surface">
            {/* Weekday Labels */}
            <div className="calendar-weekdays-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="calendar-days-grid">
              {calendarDays.map((cell, idx) => {
                const dateBills = bills.filter(b => b.dueDate === cell.dateStr)
                const isSelected = selectedDate === cell.dateStr
                const isToday = cell.dateStr === todayStr

                return (
                  <div
                    key={idx}
                    className={`calendar-day-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                  >
                    <div className="day-header">
                      <span className="day-number">{cell.dayNum}</span>
                      {isToday && <span className="today-pill-dot">Today</span>}
                    </div>

                    {dateBills.length > 0 && (
                      <div className="day-indicators-container">
                        {dateBills.map((b, bIdx) => {
                          const dotClass = b.isPaid ? 'paid' : b.isLate ? 'overdue' : 'upcoming'
                          return (
                            <span
                              key={bIdx}
                              className={`bill-status-dot ${dotClass}`}
                              title={`${b.name} (${formatCurrency(b.amount)}) — ${b.isPaid ? 'Paid' : b.isLate ? 'Overdue' : 'Upcoming'}`}
                            />
                          )
                        })}
                        {dateBills.length > 1 && (
                          <span className="day-bill-count">{dateBills.length}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Calendar Legend */}
            <div className="calendar-legend-bar">
              <span style={{ fontWeight: 750, color: '#334155' }}>Status:</span>
              <div className="legend-item">
                <span className="bill-status-dot upcoming" />
                <span>Upcoming Pending</span>
              </div>
              <div className="legend-item">
                <span className="bill-status-dot paid" />
                <span>Paid On-Time</span>
              </div>
              <div className="legend-item">
                <span className="bill-status-dot overdue" />
                <span>Overdue (Late)</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details Panel */}
          <div className="calendar-details-panel">
            <div className="details-panel-header">
              <div>
                <span style={{ fontSize: 11, fontWeight: 750, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Selected Date
                </span>
                <h4>{formatSelectedDateHeader(selectedDate)}</h4>
              </div>
              <span className="day-badge-count">
                {selectedDateBills.length} {selectedDateBills.length === 1 ? 'Bill' : 'Bills'}
              </span>
            </div>

            {selectedDateBills.length > 0 ? (
              <div className="details-bills-list">
                {selectedDateBills.map(b => (
                  <div
                    key={b.id}
                    className={`detail-bill-card ${b.isPaid ? 'paid' : b.isLate ? 'overdue' : ''}`}
                  >
                    <div className="detail-bill-top">
                      <span className="bill-cat">{b.category}</span>
                      <span className={`bill-status-pill ${b.isPaid ? 'paid' : b.isLate ? 'late' : 'pending'}`}>
                        {b.isPaid ? '✓ Paid On-Time' : b.isLate ? '⚠️ Overdue (Late)' : '⏱️ Due'}
                      </span>
                    </div>

                    <div className="detail-bill-name">{b.name}</div>
                    <div className="detail-bill-amount">{formatCurrency(b.amount)}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {b.isPaid ? (
                        <div className="bill-paid-text" style={{ width: '100%' }}>
                          ✓ Settled on-time. CIBIL score protected.
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn-pay-now"
                              style={{ flex: 1, padding: '8px 12px' }}
                              onClick={() => handlePay(b)}
                            >
                              💳 Pay Now
                            </button>
                            <button
                              className="btn-mark-missed"
                              style={{ flex: 1.3, padding: '8px 10px' }}
                              onClick={() => handleMiss(b)}
                              title="Simulate what happens if you miss this bill payment"
                            >
                              ⚠️ Mark Missed Due Date
                            </button>
                          </div>
                          <div className="missed-helper-text">
                            Simulate a missed bill payment to see its impact on credit score.
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 14px', color: '#64748b' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '1.5px solid #a7f3d0',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p style={{ margin: 0, fontWeight: 750, color: '#0f172a', fontSize: 15 }}>No bills due on this date.</p>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  All clear! You have no payment deadlines scheduled for this day.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: 14, fontSize: 12.5, borderRadius: 10, padding: '7px 16px' }}
                  onClick={() => {
                    setNewBillForm(prev => ({ ...prev, dueDate: selectedDate }))
                    setShowAddBillForm(true)
                  }}
                >
                  + Add Bill on this Date
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── ALL UPCOMING BILLS COMPACT SUMMARY LIST ── */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              📋 All Scheduled Dues & Bills ({bills.length})
            </h4>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
              {bills.filter(b => !b.isPaid).length} Pending
            </span>
          </div>

          <div className="bills-grid">
            {bills.map(b => (
              <div key={b.id} className={`bill-card ${b.isPaid ? 'paid' : ''} ${b.isLate ? 'late' : ''}`}>
                <div className="bill-top">
                  <span className="bill-cat">{b.category}</span>
                  <span className={`bill-status-pill ${b.isPaid ? 'paid' : b.isLate ? 'late' : 'pending'}`}>
                    {b.isPaid ? '✓ Paid On-Time' : b.isLate ? '⚠️ Overdue (Late)' : `⏱️ Due ${b.dueDate}`}
                  </span>
                </div>

                <div className="bill-name">{b.name}</div>
                <div className="bill-amount">{formatCurrency(b.amount)}</div>

                <div className="bill-actions">
                  {b.isPaid ? (
                    <div className="bill-paid-text">✓ Payment settled on-time. CIBIL score protected.</div>
                  ) : (
                    <>
                      <button
                        className="btn-pay-now"
                        onClick={() => handlePay(b)}
                      >
                        💳 Pay Now
                      </button>
                      <button
                        className="btn-mark-missed"
                        onClick={() => handleMiss(b)}
                        title="Simulate what happens if you miss this bill payment"
                      >
                        ⚠️ Mark Missed Due Date
                      </button>
                      <div className="missed-helper-text">
                        Simulate a missed payment to see score impact.
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

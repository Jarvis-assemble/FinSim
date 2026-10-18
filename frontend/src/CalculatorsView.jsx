import React, { useState } from 'react'

const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function CalculatorsView() {
  const [calcType, setCalcType] = useState('sip') // 'sip' | 'fd' | 'stepup'

  // SIP states
  const [sipMonthly, setSipMonthly] = useState(5000)
  const [sipRate, setSipRate] = useState(12)
  const [sipYears, setSipYears] = useState(10)

  // FD states
  const [fdPrincipal, setFdPrincipal] = useState(100000)
  const [fdRate, setFdRate] = useState(7.0)
  const [fdYears, setFdYears] = useState(5)
  const [fdCompoundFreq, setFdCompoundFreq] = useState(4) // 4 = quarterly
  const [adjustInflation, setAdjustInflation] = useState(false)

  // Step-Up states
  const [stepMonthly, setStepMonthly] = useState(5000)
  const [stepRate, setStepRate] = useState(12)
  const [stepYears, setStepYears] = useState(10)
  const [stepPercent, setStepPercent] = useState(10)

  // Calculations
  // SIP: M = P * ((1+i)^n - 1)/i * (1+i)
  const i = (sipRate / 100) / 12
  const n = sipYears * 12
  const sipTotalInvested = sipMonthly * n
  const sipMaturity = i > 0 ? Math.round(sipMonthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)) : sipTotalInvested
  const sipReturns = sipMaturity - sipTotalInvested

  // FD: Compounding A = P * (1 + r/(100*n))^(n*t)
  const fdNominal = Math.round(fdPrincipal * Math.pow(1 + (fdRate / (100 * fdCompoundFreq)), fdCompoundFreq * fdYears))
  const fdInflationAdjusted = Math.round(fdNominal / Math.pow(1.06, fdYears))
  const fdFinalValue = adjustInflation ? fdInflationAdjusted : fdNominal
  const fdReturns = fdFinalValue - fdPrincipal

  // Step-Up SIP
  let currentMonthly = stepMonthly
  let stepTotalInvested = 0
  let stepMaturity = 0
  const stepMonthlyRate = (stepRate / 100) / 12
  for (let y = 1; y <= stepYears; y++) {
    for (let m = 1; m <= 12; m++) {
      stepTotalInvested += currentMonthly
      stepMaturity = (stepMaturity + currentMonthly) * (1 + stepMonthlyRate)
    }
    currentMonthly += currentMonthly * (stepPercent / 100)
  }
  stepMaturity = Math.round(stepMaturity)
  stepTotalInvested = Math.round(stepTotalInvested)
  const stepReturns = stepMaturity - stepTotalInvested

  return (
    <div className="calculators-container">
      {/* Sub tabs */}
      <div className="calc-tabs">
        <button
          className={`calc-tab-btn ${calcType === 'sip' ? 'active' : ''}`}
          onClick={() => setCalcType('sip')}
        >
          📈 SIP Calculator
        </button>
        <button
          className={`calc-tab-btn ${calcType === 'fd' ? 'active' : ''}`}
          onClick={() => setCalcType('fd')}
        >
          🔒 Fixed Deposit (FD)
        </button>
        <button
          className={`calc-tab-btn ${calcType === 'stepup' ? 'active' : ''}`}
          onClick={() => setCalcType('stepup')}
        >
          🚀 Step-Up SIP
        </button>
      </div>

      {/* SIP CALCULATOR */}
      {calcType === 'sip' && (
        <div className="calc-grid">
          <div className="card calc-controls">
            <h3>📈 Systematic Investment Plan (SIP)</h3>
            <p className="calc-subtitle">See how investing small amounts monthly multiplies with compound interest.</p>

            <div className="slider-group">
              <div className="slider-label">
                <span>Monthly Investment</span>
                <b>{formatCurrency(sipMonthly)}</b>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={sipMonthly}
                onChange={(e) => setSipMonthly(+e.target.value)}
              />
              <div className="slider-limits"><span>₹500</span><span>₹50,000</span></div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                🎯 Fund Category & Strategy Preset
              </label>
              <div className="custom-select-wrapper" style={{ marginTop: 0 }}>
                <select
                  className="fin-select"
                  value={sipRate}
                  onChange={(e) => setSipRate(+e.target.value)}
                >
                  <option value={12}>📊 NIFTY 50 Large-Cap Index Fund (12% p.a.)</option>
                  <option value={15}>🚀 Mid & Small Cap Equity Funds (15% p.a.)</option>
                  <option value={10}>⚖️ Balanced Hybrid Advantage Fund (10% p.a.)</option>
                  <option value={7}>🔒 Corporate Debt / Liquid Fund (7% p.a.)</option>
                  <option value={20}>🔥 Aggressive Sectoral Tech / Pharma (20% p.a.)</option>
                </select>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span>Expected Return Rate (p.a)</span>
                <b>{sipRate}%</b>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="0.5"
                value={sipRate}
                onChange={(e) => setSipRate(+e.target.value)}
              />
              <div className="slider-limits"><span>5% (Debt)</span><span>12% (Nifty)</span><span>25% (High Growth)</span></div>
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span>Time Period</span>
                <b>{sipYears} Years</b>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={sipYears}
                onChange={(e) => setSipYears(+e.target.value)}
              />
              <div className="slider-limits"><span>1 Yr</span><span>15 Yrs</span><span>30 Yrs</span></div>
            </div>
          </div>

          <div className="card calc-results">
            <h3>📊 Wealth Projection</h3>
            <div className="result-stat-box highlight">
              <div className="stat-caption">Total Expected Future Value</div>
              <div className="stat-big-val">{formatCurrency(sipMaturity)}</div>
            </div>

            <div className="calc-breakdown-row">
              <div>
                <span className="dot dot-invested"></span> Total Invested:
              </div>
              <b>{formatCurrency(sipTotalInvested)}</b>
            </div>
            <div className="calc-breakdown-row">
              <div>
                <span className="dot dot-returns"></span> Estimated Returns (Wealth Gained):
              </div>
              <b style={{ color: '#16a34a' }}>+{formatCurrency(sipReturns)}</b>
            </div>

            {/* Visual ratio bar */}
            <div className="visual-bar-wrap">
              <div
                className="visual-bar-invested"
                style={{ width: `${(sipTotalInvested / sipMaturity) * 100}%` }}
                title="Invested"
              />
              <div
                className="visual-bar-returns"
                style={{ width: `${(sipReturns / sipMaturity) * 100}%` }}
                title="Wealth Gained"
              />
            </div>
            <div className="bar-legend">
              <span>🟦 Invested ({Math.round((sipTotalInvested / sipMaturity) * 100)}%)</span>
              <span>🟩 Profit ({Math.round((sipReturns / sipMaturity) * 100)}%)</span>
            </div>

            <div className="calc-tip-card">
              💡 <b>Compounding Secret:</b> In {sipYears} years, your money multiplied by <b>{(sipMaturity / sipTotalInvested).toFixed(1)}x</b>. Time in the market always beats timing the market!
            </div>
          </div>
        </div>
      )}

      {/* FD CALCULATOR */}
      {calcType === 'fd' && (
        <div className="calc-grid">
          <div className="card calc-controls">
            <h3>🔒 Fixed Deposit (FD) vs Inflation</h3>
            <p className="calc-subtitle">Calculate guaranteed returns and see what inflation really does to your purchasing power.</p>

            <div className="slider-group">
              <div className="slider-label">
                <span>Total Deposit</span>
                <b>{formatCurrency(fdPrincipal)}</b>
              </div>
              <input
                type="range"
                min="10000"
                max="1000000"
                step="5000"
                value={fdPrincipal}
                onChange={(e) => setFdPrincipal(+e.target.value)}
              />
              <div className="slider-limits"><span>₹10,000</span><span>₹10 Lakh</span></div>
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span>Annual Interest Rate</span>
                <b>{fdRate}%</b>
              </div>
              <input
                type="range"
                min="4"
                max="9.5"
                step="0.1"
                value={fdRate}
                onChange={(e) => setFdRate(+e.target.value)}
              />
              <div className="slider-limits"><span>4% (Savings)</span><span>7% (Standard FD)</span><span>9.5% (Senior/NBFC)</span></div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                🏦 Compounding Frequency
              </label>
              <div className="custom-select-wrapper" style={{ marginTop: 0 }}>
                <select
                  className="fin-select"
                  value={fdCompoundFreq}
                  onChange={(e) => setFdCompoundFreq(+e.target.value)}
                >
                  <option value={4}>Quarterly (Standard Indian Bank FD)</option>
                  <option value={12}>Monthly Compounding (Corporate/NBFC FDs)</option>
                  <option value={2}>Half-Yearly Compounding</option>
                  <option value={1}>Annual Compounding (Simple Cumulative)</option>
                </select>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span>Tenure</span>
                <b>{fdYears} Years</b>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={fdYears}
                onChange={(e) => setFdYears(+e.target.value)}
              />
              <div className="slider-limits"><span>1 Yr</span><span>5 Yrs</span><span>10 Yrs</span></div>
            </div>

            {/* Inflation Toggle */}
            <div className="inflation-toggle-card">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <div>
                <b>Adjust for 6% Average Inflation</b>
                <p>Shows actual purchasing power in today's money terms.</p>
              </div>
            </div>
          </div>

          <div className="card calc-results">
            <h3>📊 Maturity Value</h3>
            <div className={`result-stat-box ${adjustInflation ? 'warning' : 'highlight'}`}>
              <div className="stat-caption">
                {adjustInflation ? 'Real Purchasing Power (Inflation Adjusted)' : 'Maturity Amount (Nominal)'}
              </div>
              <div className="stat-big-val">{formatCurrency(fdFinalValue)}</div>
            </div>

            <div className="calc-breakdown-row">
              <div>Principal Deposited:</div>
              <b>{formatCurrency(fdPrincipal)}</b>
            </div>
            <div className="calc-breakdown-row">
              <div>Interest Earned:</div>
              <b style={{ color: fdReturns >= 0 ? '#16a34a' : '#ef4444' }}>
                {fdReturns >= 0 ? `+${formatCurrency(fdReturns)}` : formatCurrency(fdReturns)}
              </b>
            </div>

            {adjustInflation ? (
              <div className="calc-tip-card alert-amber">
                ⚠️ <b>Inflation Insight:</b> At 6% inflation, a 7% FD gives only ~1% real return! While FDs are 100% safe for emergency funds, they won't beat inflation for long-term retirement or wealth creation.
              </div>
            ) : (
              <div className="calc-tip-card">
                🛡️ <b>FD Security:</b> In India, bank deposits up to ₹5,00,000 are insured by DICGC (RBI subsidiary). Perfect for short-term goals and emergency funds!
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP-UP SIP CALCULATOR */}
      {calcType === 'stepup' && (
        <div className="calc-grid">
          <div className="card calc-controls">
            <h3>🚀 Step-Up SIP (Annual Salary Increment)</h3>
            <p className="calc-subtitle">As your income increases each year, increase your monthly investment by 5–15%.</p>

            <div className="slider-group">
              <div className="slider-label">
                <span>Initial Monthly Investment</span>
                <b>{formatCurrency(stepMonthly)}</b>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={stepMonthly}
                onChange={(e) => setStepMonthly(+e.target.value)}
              />
              <div className="slider-limits"><span>₹1,000</span><span>₹50,000</span></div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                🚀 Expected Annual Career Increment / Step-Up Hike
              </label>
              <div className="custom-select-wrapper" style={{ marginTop: 0 }}>
                <select
                  className="fin-select"
                  value={stepPercent}
                  onChange={(e) => setStepPercent(+e.target.value)}
                >
                  <option value={5}>+5% Annual Hike (Conservative Career Progression)</option>
                  <option value={10}>+10% Annual Hike (Standard Corporate Growth Benchmark)</option>
                  <option value={15}>+15% Annual Hike (Fast-Track Promotion / Tech Role)</option>
                  <option value={20}>+20% Annual Hike (Aggressive Wealth Acceleration)</option>
                </select>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span>Annual Step-Up (% hike per year)</span>
                <b>{stepPercent}% per year</b>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={stepPercent}
                onChange={(e) => setStepPercent(+e.target.value)}
              />
              <div className="slider-limits"><span>5%</span><span>10% (Typical Hike)</span><span>25%</span></div>
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span>Time Period</span>
                <b>{stepYears} Years</b>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={stepYears}
                onChange={(e) => setStepYears(+e.target.value)}
              />
              <div className="slider-limits"><span>1 Yr</span><span>15 Yrs</span><span>30 Yrs</span></div>
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span>Expected Return</span>
                <b>{stepRate}% p.a.</b>
              </div>
              <input
                type="range"
                min="8"
                max="18"
                step="0.5"
                value={stepRate}
                onChange={(e) => setStepRate(+e.target.value)}
              />
              <div className="slider-limits"><span>8%</span><span>12%</span><span>18%</span></div>
            </div>
          </div>

          <div className="card calc-results">
            <h3>📊 Step-Up Advantage</h3>
            <div className="result-stat-box highlight">
              <div className="stat-caption">Step-Up Maturity Value</div>
              <div className="stat-big-val">{formatCurrency(stepMaturity)}</div>
            </div>

            <div className="calc-breakdown-row">
              <div>Total Invested:</div>
              <b>{formatCurrency(stepTotalInvested)}</b>
            </div>
            <div className="calc-breakdown-row">
              <div>Total Wealth Generated:</div>
              <b style={{ color: '#16a34a' }}>+{formatCurrency(stepReturns)}</b>
            </div>

            {/* Comparison with normal SIP */}
            <div className="stepup-comparison-box">
              <div className="comp-row">
                <span>Regular SIP ({formatCurrency(stepMonthly)}/mo flat):</span>
                <b>{formatCurrency(sipMaturity)}</b>
              </div>
              <div className="comp-row highlight-green">
                <span>Step-Up SIP (+{stepPercent}%/yr):</span>
                <b>{formatCurrency(stepMaturity)}</b>
              </div>
              <div className="comp-delta">
                🎉 Extra Wealth Created: <b>+{formatCurrency(Math.max(0, stepMaturity - sipMaturity))}</b>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

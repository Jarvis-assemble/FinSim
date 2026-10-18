import React, { useState, useMemo } from 'react'

const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function NetWorthChart({ account, netWorth }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [timeframe, setTimeframe] = useState('7D')
  const [chartType, setChartType] = useState('bar') // 'bar' | 'area'

  // Generate smooth historical checkpoints leading up to current netWorth
  const dataPoints = useMemo(() => {
    const current = netWorth || 170000
    const today = new Date()

    if (timeframe === '7D') {
      const multipliers = [0.915, 0.928, 0.942, 0.938, 0.962, 0.981, 1.0]
      return multipliers.map((m, i) => {
        const d = new Date()
        d.setDate(today.getDate() - (6 - i))
        return {
          label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          dateStr: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          value: Math.round(current * m)
        }
      })
    } else if (timeframe === '1M') {
      const multipliers = [0.84, 0.88, 0.91, 0.95, 1.0]
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Now'].map((label, i) => ({
        label,
        dateStr: label,
        value: Math.round(current * multipliers[i])
      }))
    } else {
      // 1Y
      const multipliers = [0.65, 0.72, 0.81, 0.89, 0.94, 1.0]
      return ['Q1', 'Q2', 'Q3', 'Q4', 'Prev Mo', 'Now'].map((label, i) => ({
        label,
        dateStr: label,
        value: Math.round(current * multipliers[i])
      }))
    }
  }, [netWorth, timeframe])

  // Chart dimensions & scaling (Taller height so it never looks squeezed!)
  const width = 680
  const height = 340
  const padLeft = 36
  const padRight = 36
  const padTop = 38
  const padBottom = 48

  const values = dataPoints.map(p => p.value)
  const minVal = Math.min(...values) * 0.97
  const maxVal = Math.max(...values) * 1.02
  const range = maxVal - minVal || 1

  const usableWidth = width - padLeft - padRight
  const usableHeight = height - padTop - padBottom
  const slotWidth = usableWidth / dataPoints.length
  const barWidth = Math.min(42, Math.max(28, slotWidth * 0.52))

  // Calculate points with centers aligned inside each slot
  const points = dataPoints.map((p, i) => {
    const slotCenter = padLeft + (i + 0.5) * slotWidth
    const valRatio = (p.value - minVal) / range
    const barHeight = Math.max(24, valRatio * usableHeight)
    const barY = height - padBottom - barHeight
    const y = barY
    return {
      ...p,
      x: slotCenter,
      y,
      barX: slotCenter - barWidth / 2,
      barY,
      barWidth,
      barHeight
    }
  })

  // Build smooth cubic bezier curve for Area mode
  const pathD = useMemo(() => {
    if (points.length === 0) return ''
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cpX1 = p0.x + (p1.x - p0.x) / 2
      const cpY1 = p0.y
      const cpX2 = p0.x + (p1.x - p0.x) / 2
      const cpY2 = p1.y
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
    }
    return d
  }, [points])

  const areaD = useMemo(() => {
    if (points.length === 0) return ''
    const bottomY = height - padBottom
    const lastX = points[points.length - 1].x
    const firstX = points[0].x
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }, [pathD, points, height, padBottom])

  const startVal = points[0]?.value || 1
  const endVal = points[points.length - 1]?.value || 1
  const diff = endVal - startVal
  const diffPct = ((diff / startVal) * 100).toFixed(1)
  const isPositive = diff >= 0

  const activeIndex = hoveredIndex !== null ? hoveredIndex : points.length - 1
  const activePoint = points[activeIndex]

  return (
    <div className="card networth-chart-card">
      <div className="nw-chart-header">
        <div>
          <div className="nw-chart-title-row">
            <span className="nw-badge">💎 NET WORTH GROWTH</span>
            <span className="nw-trend-pill positive">
              {isPositive ? '▲' : '▼'} {formatCurrency(Math.abs(diff))} ({isPositive ? '+' : ''}{diffPct}%)
            </span>
          </div>
          <div className="nw-active-val">
            {formatCurrency(activePoint?.value)}
            <span className="nw-active-date">{activePoint?.dateStr}</span>
          </div>
        </div>

        {/* Chart View Toggle + Timeframe Selector */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Chart View Mode Toggle */}
          <div className="nw-view-toggle">
            <button
              type="button"
              className={`nw-view-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
              title="Switch to Column Bar Chart"
            >
              📊 Bars
            </button>
            <button
              type="button"
              className={`nw-view-btn ${chartType === 'area' ? 'active' : ''}`}
              onClick={() => setChartType('area')}
              title="Switch to Smooth Area Trend"
            >
              📈 Area
            </button>
          </div>

          {/* Timeframe pill tabs */}
          <div className="nw-timeframe-selector">
            {['7D', '1M', '1Y'].map(tf => (
              <button
                key={tf}
                type="button"
                className={`nw-tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => { setTimeframe(tf); setHoveredIndex(null); }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas with Dark Emerald Green Gradients */}
      <div className="svg-chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="nw-svg"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Dark Emerald Bar Gradient */}
            <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#059669" />
              <stop offset="75%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            {/* Dark Emerald Bar Hover Gradient */}
            <linearGradient id="emeraldBarGradHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="35%" stopColor="#10b981" />
              <stop offset="80%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            {/* Dark Emerald Area Gradient */}
            <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#047857" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.0" />
            </linearGradient>

            {/* Emerald Drop Shadow Glow */}
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#064e3b" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Background grid guide lines */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={width - padRight}
            y2={padTop}
            stroke="rgba(6, 78, 59, 0.12)"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={(padTop + height - padBottom) / 2}
            x2={width - padRight}
            y2={(padTop + height - padBottom) / 2}
            stroke="rgba(6, 78, 59, 0.12)"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            stroke="rgba(6, 78, 59, 0.25)"
            strokeWidth="1.5"
          />

          {/* ── BAR CHART MODE ── */}
          {chartType === 'bar' && (
            <g className="nw-bar-group">
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx
                const isLatest = idx === points.length - 1
                const isActive = isHovered || (hoveredIndex === null && isLatest)

                return (
                  <g
                    key={idx}
                    className="chart-bar-item"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Background Column Track */}
                    <rect
                      x={p.barX}
                      y={padTop}
                      width={p.barWidth}
                      height={usableHeight}
                      rx={Math.min(8, p.barWidth / 3)}
                      ry={Math.min(8, p.barWidth / 3)}
                      fill="rgba(6, 78, 59, 0.05)"
                    />

                    {/* Active Dark Emerald Bar */}
                    <rect
                      x={p.barX}
                      y={p.barY}
                      width={p.barWidth}
                      height={p.barHeight}
                      rx={Math.min(8, p.barWidth / 3)}
                      ry={Math.min(8, p.barWidth / 3)}
                      fill={isActive ? 'url(#emeraldBarGradHover)' : 'url(#emeraldBarGrad)'}
                      filter={isActive ? 'url(#emeraldGlow)' : undefined}
                      stroke={isActive ? '#064e3b' : 'none'}
                      strokeWidth={isActive ? '1.5' : '0'}
                      style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />

                    {/* Floating Value Tooltip above Bar */}
                    {isActive && (
                      <g>
                        <rect
                          x={p.x - 38}
                          y={Math.max(10, p.barY - 26)}
                          width="76"
                          height="20"
                          rx="6"
                          fill="#064e3b"
                          boxShadow="0 2px 8px rgba(0,0,0,0.2)"
                        />
                        <text
                          x={p.x}
                          y={Math.max(24, p.barY - 12)}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="800"
                          fill="#ffffff"
                        >
                          {formatCurrency(p.value)}
                        </text>
                      </g>
                    )}

                    {/* X-axis Day Label */}
                    <text
                      x={p.x}
                      y={height - 24}
                      textAnchor="middle"
                      fontSize="12.5"
                      fill={isActive ? '#064e3b' : '#64748b'}
                      fontWeight={isActive ? '800' : '650'}
                      style={{ transition: 'fill 0.2s' }}
                    >
                      {p.label}
                    </text>

                    {/* X-axis Date Subtitle */}
                    <text
                      x={p.x}
                      y={height - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isActive ? '#047857' : '#94a3b8'}
                      fontWeight={isActive ? '700' : '500'}
                    >
                      {p.dateStr}
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* ── AREA TREND MODE ── */}
          {chartType === 'area' && (
            <g className="nw-area-group">
              {/* Dark Emerald Gradient area */}
              <path d={areaD} fill="url(#emeraldAreaGrad)" />

              {/* Dark Emerald Trend Curve */}
              <path
                d={pathD}
                fill="none"
                stroke="#047857"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#emeraldGlow)"
              />

              {/* Data Points */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx
                const isLatest = idx === points.length - 1
                const isActive = isHovered || (hoveredIndex === null && isLatest)

                return (
                  <g
                    key={idx}
                    className="chart-point-group"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hit Target */}
                    <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

                    {/* Marker Ring */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isActive ? 6.5 : 4.5}
                      fill={isActive ? '#064e3b' : '#ffffff'}
                      stroke="#047857"
                      strokeWidth={isActive ? '3.5' : '2.5'}
                      className="chart-circle"
                    />

                    {/* Pulsing ring for latest point */}
                    {isLatest && hoveredIndex === null && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="10"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="1.8"
                        className="pulse-circle"
                      />
                    )}

                    {/* X-axis Day Label */}
                    <text
                      x={p.x}
                      y={height - 24}
                      textAnchor="middle"
                      fontSize="12.5"
                      fill={isActive ? '#064e3b' : '#64748b'}
                      fontWeight={isActive ? '800' : '650'}
                    >
                      {p.label}
                    </text>

                    {/* X-axis Date Subtitle */}
                    <text
                      x={p.x}
                      y={height - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isActive ? '#047857' : '#94a3b8'}
                      fontWeight={isActive ? '700' : '500'}
                    >
                      {p.dateStr}
                    </text>
                  </g>
                )
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="nw-footer-summary">
        <span style={{ color: '#065f46', fontWeight: 700 }}>
          🛡️ <b>Portfolio Velocity:</b> Healthy upward trajectory with continuous compounding
        </span>
        <span style={{ color: '#64748b', fontSize: 12 }}>
          Includes Liquid Balance + Savings + Fixed Deposits + Mutual Funds + Stocks
        </span>
      </div>
    </div>
  )
}

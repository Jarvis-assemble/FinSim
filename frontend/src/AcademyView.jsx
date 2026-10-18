import React, { useState } from 'react'

const TUTORIALS = [
  {
    id: 1,
    title: 'The Power of Compound Interest: Exponential Growth Explained',
    duration: '8 mins',
    level: 'Beginner',
    category: 'Investing',
    channel: 'Khan Academy',
    summary: 'Learn why starting a monthly SIP early creates exponential wealth compared to waiting, illustrated with clear mathematical timelines.',
    youtubeId: 'Rm6UdfRs3gw',
    keyTakeaway: 'Time in the market and compounding frequency multiply wealth far more than market timing.'
  },
  {
    id: 2,
    title: 'Are Credit Cards Bad? Consumer Debt & Interest Traps',
    duration: '9 mins',
    level: 'Intermediate',
    category: 'Debt & Credit',
    channel: 'Khan Academy',
    summary: 'How banks structure revolving credit, why "Minimum Amount Due" causes debt spirals, and how to use cards for free perks without paying interest.',
    youtubeId: 'W542XW9JPlc',
    keyTakeaway: 'Always pay 100% of the Total Outstanding statement balance before the due date, never the Minimum Due.'
  },
  {
    id: 3,
    title: 'How Does the Stock Market Actually Work?',
    duration: '5 mins',
    level: 'Beginner',
    category: 'Stock Market',
    channel: 'TED-Ed',
    summary: 'An animated masterclass on why companies issue shares, how stock exchanges price equities, and what causes bulls and bears.',
    youtubeId: 'p7HKvqRI_Bo',
    keyTakeaway: 'A stock is not a lottery ticket; it represents fractional ownership in a real operating company with real cash flows.'
  },
  {
    id: 4,
    title: 'Index Funds & ETFs: The Ultimate Low-Cost Strategy',
    duration: '11 mins',
    level: 'Beginner',
    category: 'Investing',
    channel: 'Khan Academy',
    summary: 'Why buying the whole market via low-cost index funds mathematically beats 85% of active fund managers over long horizons.',
    youtubeId: 'SFdsY9Rdh6w',
    keyTakeaway: 'Diversify instantly with low-cost index funds to capture economic growth with rock-bottom expense ratios.'
  },
  {
    id: 5,
    title: 'Debt Payoff Strategies: Avalanche vs Snowball Methods',
    duration: '7 mins',
    level: 'Intermediate',
    category: 'Debt Management',
    channel: 'Khan Academy',
    summary: 'A side-by-side comparison of the mathematical Avalanche method (highest interest first) versus the psychological Snowball method to eradicate personal loans.',
    youtubeId: 'TZErzDOZc1k',
    keyTakeaway: 'Eliminating 15-20% high-interest loans is equivalent to earning a guaranteed, risk-free, tax-free return on your money.'
  },
  {
    id: 6,
    title: 'Finance & Investing Masterclass in Under an Hour',
    duration: '44 mins',
    level: 'Comprehensive',
    category: 'Masterclass',
    channel: 'Big Think (Bill Ackman)',
    summary: 'Renowned investor Bill Ackman breaks down balance sheets, debt vs equity financing, competitive moats, and long-term compounding.',
    youtubeId: 'WEDIj9JBTC8',
    keyTakeaway: 'Invest in businesses with wide economic moats, predictable earnings, and high returns on invested capital.'
  }
]

const FINANCIAL_BOOKS = [
  {
    id: 'psychology-money',
    title: 'The Psychology of Money',
    subtitle: 'Timeless Lessons on Wealth, Greed, and Happiness',
    author: 'Morgan Housel',
    category: 'Behavioral Finance',
    rating: '4.8 ★',
    reviews: '185k+ ratings',
    pages: '256 pages',
    readTime: '~5 hrs read',
    level: 'All Levels',
    accentColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    tagColor: '#3b82f6',
    summary: "Doing well with money isn't necessarily about what you know. It's about how you behave. Housel shares 19 short stories exploring the strange ways people think about money and teaches you how to make better sense of one of life's most important topics.",
    goldenTakeaway: 'Spending money to show people how much money you have is the fastest way to have less money.',
    whyInFinSim: 'Helps you resist panic-selling during stock market dips and prevents taking reckless loans just to inflate status.',
    topics: ['Behavioral Biases', 'Compounding Patience', 'Frugality vs Wealth', 'Risk Perception']
  },
  {
    id: 'lets-talk-money',
    title: "Let's Talk Money",
    subtitle: "You've Worked Hard for It, Now Make It Work for You",
    author: 'Monika Halan',
    category: 'Indian Personal Finance',
    rating: '4.7 ★',
    reviews: '16k+ ratings',
    pages: '224 pages',
    readTime: '~4.5 hrs read',
    level: 'Beginner',
    accentColor: 'linear-gradient(135deg, #065f46, #10b981)',
    tagColor: '#10b981',
    summary: "India's most trusted personal finance guide. Lays out a systematic, jargon-free framework to organize your finances with the practical 3-account system, term insurance essentials, and low-cost mutual fund portfolios.",
    goldenTakeaway: 'Separate your finances into 3 segregated bank accounts: The Spending Account, the Emergency Shock-Absorber, and the Future Wealth Machine.',
    whyInFinSim: "Directly mirrors FinSim's architecture: keeping an Emergency Savings reserve separate from your everyday Checking balance and SIP Investments.",
    topics: ['3-Account System', 'Term Insurance', 'Index SIPs', 'Emergency Reserves']
  },
  {
    id: 'bogle-common-sense',
    title: 'The Little Book of Common Sense Investing',
    subtitle: 'The Only Way to Guarantee Your Fair Share of Stock Market Returns',
    author: 'John C. Bogle',
    category: 'Index Investing',
    rating: '4.7 ★',
    reviews: '38k+ ratings',
    pages: '240 pages',
    readTime: '~5 hrs read',
    level: 'Beginner to Intermediate',
    accentColor: 'linear-gradient(135deg, #581c87, #8b5cf6)',
    tagColor: '#8b5cf6',
    summary: 'Written by Vanguard founder John Bogle, this definitive classic demonstrates why low-cost broad index funds mathematically beat 85%+ of active fund managers over long horizons after accounting for fees, churn, and taxes.',
    goldenTakeaway: "Don't look for the needle in the haystack. Just buy the haystack.",
    whyInFinSim: 'Proves why consistent allocation into broad Mutual Funds and NIFTY 50 yields safer long-term gains than trying to time volatile single stocks.',
    topics: ['Index Funds', 'Low Expense Ratios', 'Market Diversification', 'Boglehead Method']
  },
  {
    id: 'millionaire-next-door',
    title: 'The Millionaire Next Door',
    subtitle: 'The Surprising Secrets of America\'s Wealthy',
    author: 'Thomas J. Stanley & William D. Danko',
    category: 'Wealth Building',
    rating: '4.6 ★',
    reviews: '48k+ ratings',
    pages: '272 pages',
    readTime: '~6 hrs read',
    level: 'All Levels',
    accentColor: 'linear-gradient(135deg, #78350f, #f59e0b)',
    tagColor: '#f59e0b',
    summary: 'A landmark multi-decade empirical study examining who real millionaires actually are. Spoiler: they rarely drive flashy supercars or wear designer labels; they live below their means, budget religiously, and invest heavily.',
    goldenTakeaway: 'Wealth is what you accumulate and invest, not what you spend on display.',
    whyInFinSim: 'Inspires disciplined budgeting and shows why building a high net worth requires keeping expenses low even as your balance grows.',
    topics: ['Frugal Living', 'Budget Discipline', 'Net Worth vs Income', 'Long-term Investing']
  },
  {
    id: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    subtitle: 'What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!',
    author: 'Robert T. Kiyosaki',
    category: 'Financial Mindset',
    rating: '4.7 ★',
    reviews: '125k+ ratings',
    pages: '336 pages',
    readTime: '~6.5 hrs read',
    level: 'Beginner',
    accentColor: 'linear-gradient(135deg, #831843, #ec4899)',
    tagColor: '#ec4899',
    summary: 'Explodes the myth that you need to earn a high income to be rich. Explains the critical difference between working for a paycheck and acquiring income-producing assets that work for you 24/7.',
    goldenTakeaway: 'An asset is something that puts money into your pocket. A liability is something that takes money out of your pocket.',
    whyInFinSim: 'Clearly distinguishes assets (stocks, FDs, mutual funds) from liabilities (loans, interest, unpaid bills) in your dashboard.',
    topics: ['Assets vs Liabilities', 'Cash Flow Thinking', 'Financial Literacy', 'Passive Wealth']
  },
  {
    id: 'richest-man-babylon',
    title: 'The Richest Man in Babylon',
    subtitle: 'The Success Secrets of the Ancients',
    author: 'George S. Clason',
    category: 'Classic Parable',
    rating: '4.7 ★',
    reviews: '70k+ ratings',
    pages: '144 pages',
    readTime: '~3 hrs read',
    level: 'Beginner',
    accentColor: 'linear-gradient(135deg, #991b1b, #ef4444)',
    tagColor: '#ef4444',
    summary: 'Set in ancient Babylon, these timeless parables lay down foundational laws of wealth: paying yourself first, living within your means, seeking counsel from experts, and protecting your capital from reckless speculation.',
    goldenTakeaway: 'A part of all you earn is yours to keep. Pay yourself at least 10% of your earnings before paying any expenses.',
    whyInFinSim: 'Reminds you to deposit 10-20% of every incoming transfer straight into Savings or Investments before spending.',
    topics: ['Pay Yourself First', 'Control Expenditures', 'Compound Earnings', 'Shield Capital']
  }
]

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What actually happens if you only pay the 'Minimum Amount Due' on your credit card bill?",
    options: [
      "Your bill is completely settled without any extra charges",
      "You avoid immediate late fees, but the rest incurs up to 42% annualized interest from day one",
      "Your CIBIL score automatically increases to 800+",
      "The bank waives off the remaining balance as a reward"
    ],
    correctIndex: 1,
    explanation: "Paying only the Minimum Due is how credit card debt snowballs. High interest (36-42% p.a.) is charged on the entire unpaid balance!"
  },
  {
    id: 2,
    question: "Why is maintaining an Emergency Fund of 3-6 months' expenses crucial before buying volatile stocks?",
    options: [
      "Because bank savings interest is always higher than stock returns",
      "So you are never forced to sell your stocks at a loss during a sudden market crash or medical emergency",
      "It is a legal requirement mandated by SEBI for all retail investors",
      "To pay higher income taxes on stock gains"
    ],
    correctIndex: 1,
    explanation: "An emergency fund acts as a financial shock absorber, allowing your equity investments the time they need to recover from downturns."
  },
  {
    id: 3,
    question: "You receive an SMS: 'Your bank account will be blocked today. Click this link to update PAN and enter OTP'. What is this?",
    options: [
      "Standard RBI banking protocol that you must follow immediately",
      "A phishing fraud attempting to steal your credentials and drain your funds",
      "A routine system notification from your college or employer",
      "An exclusive invitation to upgrade to a premium savings account"
    ],
    correctIndex: 1,
    explanation: "Banks and official authorities will NEVER send suspicious shortened links asking for OTPs or PINs. Always contact your branch directly!"
  }
]

export default function AcademyView({ onEarnBonus }) {
  const [selectedVideo, setSelectedVideo] = useState(TUTORIALS[0])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [selectedBookCategory, setSelectedBookCategory] = useState('All')
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [expandedBookId, setExpandedBookId] = useState(null)

  const handleSelectOption = (questionId, optionIndex) => {
    if (quizSubmitted) return
    setQuizAnswers({ ...quizAnswers, [questionId]: optionIndex })
  }

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true)
    const isAllCorrect = QUIZ_QUESTIONS.every(q => quizAnswers[q.id] === q.correctIndex)
    if (isAllCorrect && !rewardClaimed) {
      setRewardClaimed(true)
      if (onEarnBonus) {
        onEarnBonus(5000, 'FinSim Academy: Financial Literacy Certification Reward')
      }
    }
  }

  const handleResetQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
  }

  const score = QUIZ_QUESTIONS.filter(q => quizAnswers[q.id] === q.correctIndex).length

  // Filter books
  const filteredBooks = FINANCIAL_BOOKS.filter(book => {
    const matchesCategory = selectedBookCategory === 'All' || book.category === selectedBookCategory
    const query = bookSearchQuery.toLowerCase()
    const matchesSearch = !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.summary.toLowerCase().includes(query) ||
      book.topics.some(t => t.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  })

  const bookCategories = ['All', 'Behavioral Finance', 'Indian Personal Finance', 'Index Investing', 'Wealth Building', 'Financial Mindset', 'Classic Parable']

  return (
    <div className="academy-container">
      {/* HEADER BANNER */}
      <div className="academy-hero">
        <div className="academy-hero-text">
          <h2>🎓 FinSim Financial Academy & Reading Room</h2>
          <p>Master real-world banking, learn from timeless financial classics, and earn ₹5,000 in sandbox cash by passing the certification quiz!</p>
        </div>
        <div className="academy-badge-card">
          <div className="badge-icon">🏅</div>
          <div>
            <b>Certificate Quiz</b>
            <span>Reward: ₹5,000 Cash</span>
          </div>
        </div>
      </div>

      {/* TOP ROW: VIDEO PLAYER & CURATED LESSONS + QUIZ */}
      <div className="two-col" style={{ marginTop: 16 }}>
        {/* VIDEO PLAYER & CURATED LESSONS */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <h3>🎥 Video Masterclasses</h3>
              <p className="card-subtitle">{selectedVideo.title}</p>
            </div>
            <span className="pill-category" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 700 }}>
              {selectedVideo.channel}
            </span>
          </div>

          {/* Responsive Video Container */}
          <div className="video-player-wrapper">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="video-key-takeaway">
            💡 <b>Key Rule:</b> {selectedVideo.keyTakeaway}
          </div>

          <h4 style={{ marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📺 Curated Video Playlist ({TUTORIALS.length})</span>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Select a video to play</span>
          </h4>
          <div className="playlist-list">
            {TUTORIALS.map(tut => (
              <div
                key={tut.id}
                className={`playlist-item ${selectedVideo.id === tut.id ? 'active' : ''}`}
                onClick={() => setSelectedVideo(tut)}
              >
                <div className="playlist-info">
                  <b>{tut.title}</b>
                  <div className="playlist-meta">
                    <span className="pill-category">{tut.category}</span>
                    <span>📺 {tut.channel}</span>
                    <span>⏱️ {tut.duration}</span>
                    <span>• {tut.level}</span>
                  </div>
                </div>
                <button className="btn-watch-pill">
                  {selectedVideo.id === tut.id ? '▶ Watching' : 'Play'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FINANCIAL KNOWLEDGE CHECK QUIZ */}
        <div className="card">
          <div className="quiz-header-row">
            <div>
              <h3>📝 Financial Health Quiz</h3>
              <p className="card-subtitle">Test your practical money instincts. Score 3/3 to win ₹5,000!</p>
            </div>
            {quizSubmitted && (
              <span className={`quiz-score-pill ${score === 3 ? 'perfect' : 'partial'}`}>
                Score: {score} / 3
              </span>
            )}
          </div>

          {rewardClaimed && (
            <div className="reward-celebration-card">
              🎉 <b>Congratulations!</b> You scored 3/3 and earned <b>₹5,000</b> in sandbox cash deposited directly into your balance!
            </div>
          )}

          <div className="quiz-questions-list">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const selected = quizAnswers[q.id]
              const isAnswered = selected !== undefined
              const isCorrect = isAnswered && selected === q.correctIndex

              return (
                <div key={q.id} className="quiz-question-card">
                  <div className="quiz-q-title">
                    <span className="q-num">Q{idx + 1}</span> {q.question}
                  </div>

                  <div className="quiz-options">
                    {q.options.map((opt, optIdx) => {
                      let optionClass = ''
                      if (selected === optIdx) optionClass += ' selected'
                      if (quizSubmitted) {
                        if (optIdx === q.correctIndex) optionClass += ' correct'
                        else if (selected === optIdx) optionClass += ' incorrect'
                      }

                      return (
                        <button
                          key={optIdx}
                          className={`quiz-opt-btn ${optionClass}`}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          disabled={quizSubmitted}
                        >
                          <span className="opt-letter">{String.fromCharCode(65 + optIdx)}</span>
                          <span className="opt-text">{opt}</span>
                        </button>
                      )
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className={`quiz-explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
                      {isCorrect ? '✅ Correct! ' : '❌ Incorrect. '}
                      {q.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="quiz-actions-row">
            {!quizSubmitted ? (
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
              >
                Submit Answers & Claim ₹5,000 Reward
              </button>
            ) : (
              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={handleResetQuiz}
              >
                🔄 Retake Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── NEW SECTION: ESSENTIAL FINANCIAL BOOKSHELF ──────────────── */}
      <div className="card bookshelf-card" style={{ marginTop: 20 }}>
        <div className="bookshelf-header-row">
          <div>
            <div className="bookshelf-pill-tag">📚 Curated Reading Library</div>
            <h3 style={{ fontSize: 22, marginTop: 4, marginBottom: 4 }}>Essential Financial Bookshelf</h3>
            <p className="card-subtitle">
              Foundational books recommended by world-class economists and seasoned investors to build long-term wealth, master behavioral biases, and avoid costly money pitfalls.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="bookshelf-summary-stats">
            <div className="bs-stat">
              <b>6</b>
              <span>Classics</span>
            </div>
            <div className="bs-divider" />
            <div className="bs-stat">
              <b>4.7+ ★</b>
              <span>Rating</span>
            </div>
            <div className="bs-divider" />
            <div className="bs-stat">
              <b>100%</b>
              <span>Actionable</span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bookshelf-controls">
          <div className="bookshelf-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by title, author, or topic (e.g., Bogle, compounding, India)..."
              value={bookSearchQuery}
              onChange={(e) => setBookSearchQuery(e.target.value)}
              className="bookshelf-search-input"
            />
            {bookSearchQuery && (
              <button className="bookshelf-clear-btn" onClick={() => setBookSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="bookshelf-category-chips">
            {bookCategories.map(cat => (
              <button
                key={cat}
                className={`category-chip ${selectedBookCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedBookCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="books-grid">
          {filteredBooks.map(book => {
            const isExpanded = expandedBookId === book.id

            return (
              <div key={book.id} className="book-card">
                {/* Book Spine / Header Accent */}
                <div className="book-card-accent" style={{ background: book.accentColor }}>
                  <div className="book-badge-category">{book.category}</div>
                  <div className="book-rating-badge">{book.rating}</div>
                </div>

                <div className="book-card-body">
                  <div className="book-header-info">
                    <h4 className="book-title">{book.title}</h4>
                    <div className="book-subtitle">{book.subtitle}</div>
                    <div className="book-author">✍️ <b>{book.author}</b></div>
                  </div>

                  <div className="book-meta-pills">
                    <span className="book-pill">📖 {book.pages}</span>
                    <span className="book-pill">⏱️ {book.readTime}</span>
                    <span className="book-pill">🎯 {book.level}</span>
                  </div>

                  <p className="book-summary">{book.summary}</p>

                  {/* Golden Rule Callout */}
                  <div className="book-golden-rule">
                    <div className="rule-title">💡 The Golden Rule:</div>
                    <blockquote className="rule-quote">"{book.goldenTakeaway}"</blockquote>
                  </div>

                  {/* Connection to FinSim Sandbox */}
                  <div className="book-finsim-link">
                    <b>🎮 In FinSim:</b> {book.whyInFinSim}
                  </div>

                  {/* Expandable Topics & Details */}
                  {isExpanded && (
                    <div className="book-expanded-content">
                      <div className="book-topics-label">Key Concepts & Mental Models:</div>
                      <div className="book-topics-list">
                        {book.topics.map((topic, i) => (
                          <span key={i} className="topic-tag">#{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="book-card-footer">
                    <span className="book-reviews-count">💬 {book.reviews}</span>
                    <button
                      className="btn-book-expand"
                      onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                    >
                      {isExpanded ? 'Hide Details ▲' : 'Key Concepts ▼'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredBooks.length === 0 && (
          <div className="books-empty-state">
            <span style={{ fontSize: 36 }}>🔍</span>
            <p>No books match your search "<b>{bookSearchQuery}</b>" in the selected category.</p>
            <button
              className="btn-secondary"
              onClick={() => { setSelectedBookCategory('All'); setBookSearchQuery(''); }}
              style={{ marginTop: 8 }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

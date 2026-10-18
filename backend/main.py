"""
FinSim – Financial Literacy Simulator  |  FastAPI Backend
==========================================================
Endpoints:
  GET  /api/account/{user_id}
  POST /api/transfer
  POST /api/invest
  POST /api/loan
  POST /api/chat
  POST /api/whatif
  GET  /api/market
  POST /api/reset/{user_id}
"""

from __future__ import annotations

import json
import math
import os
import random
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Gemini setup (optional – graceful fallback when key is absent)
# ---------------------------------------------------------------------------
_gemini_client = None

GEMINI_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
]

try:
    from google import genai  # type: ignore

    _api_key = os.environ.get("GEMINI_API_KEY", "")
    if not _api_key:
        for _env_path in [".env", "../.env", os.path.join(os.path.dirname(__file__), "..", ".env"), os.path.join(os.path.dirname(__file__), ".env")]:
            if os.path.exists(_env_path):
                with open(_env_path, "r", encoding="utf-8") as _f:
                    for _line in _f:
                        if _line.strip().startswith("GEMINI_API_KEY="):
                            _api_key = _line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                            break
            if _api_key:
                break
    if _api_key:
        _gemini_client = genai.Client(api_key=_api_key)
        print("Gemini client initialized successfully with model failover support.")
except Exception as e:
    print(f"Failed to initialize Gemini client: {e}")
    _gemini_client = None


def _gemini_generate(prompt: str, fallback: str) -> str:
    """Call Gemini across candidate models with automatic quota failover, or return fallback."""
    if _gemini_client is None:
        return fallback

    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            response = _gemini_client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            last_error = e
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "404" in err_str:
                print(f"Gemini {model_name} rate limit or 404, failing over: {e}")
                continue
            else:
                print(f"Gemini generation error with {model_name}: {e}")
                continue

    print(f"All Gemini models exhausted. Returning fallback. Last error: {last_error}")
    return fallback


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="FinSim API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Default account factory
# ---------------------------------------------------------------------------
_DEFAULT_TRANSACTIONS: List[Dict[str, Any]] = [
    {
        "id": "txn-001",
        "type": "credit",
        "amount": 100000.0,
        "description": "Initial deposit – FinSim welcome bonus",
        "timestamp": "2024-01-01T09:00:00Z",
        "balance_after": 100000.0,
    },
    {
        "id": "txn-002",
        "type": "debit",
        "amount": 3500.0,
        "description": "Monthly rent payment",
        "timestamp": "2024-01-05T10:30:00Z",
        "balance_after": 96500.0,
    },
    {
        "id": "txn-003",
        "type": "debit",
        "amount": 1200.0,
        "description": "Grocery shopping – Big Bazaar",
        "timestamp": "2024-01-10T14:20:00Z",
        "balance_after": 95300.0,
    },
    {
        "id": "txn-004",
        "type": "credit",
        "amount": 5000.0,
        "description": "Freelance project payment",
        "timestamp": "2024-01-15T18:00:00Z",
        "balance_after": 100300.0,
    },
    {
        "id": "txn-005",
        "type": "debit",
        "amount": 300.0,
        "description": "Netflix & OTT subscriptions",
        "timestamp": "2024-01-20T09:15:00Z",
        "balance_after": 100000.0,
    },
]


_DEFAULT_BILLS: List[Dict[str, Any]] = [
    {"id": "b1", "name": "HDFC Millennia Credit Card", "amount": 4850.0, "dueInDays": 3, "category": "💳 Credit Card", "isPaid": False, "isLate": False},
    {"id": "b2", "name": "Apartment Monthly Rent", "amount": 3500.0, "dueInDays": 6, "category": "🏠 Rent", "isPaid": False, "isLate": False},
    {"id": "b3", "name": "BESCOM Electricity Bill", "amount": 780.0, "dueInDays": 10, "category": "⚡ Utility", "isPaid": False, "isLate": False},
    {"id": "b4", "name": "Education Loan EMI", "amount": 1500.0, "dueInDays": 14, "category": "🏦 Loan", "isPaid": False, "isLate": False},
]


def _make_default_account() -> Dict[str, Any]:
    return {
        "balance": 100000.0,
        "transactions": deepcopy(_DEFAULT_TRANSACTIONS),
        "savings": 25000.0,
        "investments": {"stocks": 15000.0, "mutual_funds": 10000.0, "fd": 20000.0},
        "loans": [],
        "risk_score": 45,
        "credit_score": 750,
        "bills": deepcopy(_DEFAULT_BILLS),
    }


# ---------------------------------------------------------------------------
# File-backed persistence store
# ---------------------------------------------------------------------------
_DATA_FILE = os.path.join(os.path.dirname(__file__), "finsim_data.json")


def _save_sessions() -> None:
    try:
        with open(_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(_sessions, f, indent=2)
    except Exception as e:
        print(f"Error saving data: {e}")


def _load_sessions() -> Dict[str, Dict[str, Any]]:
    if os.path.isfile(_DATA_FILE):
        try:
            with open(_DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "demo" in data:
                    # ensure bills & credit_score exist in loaded data
                    if "bills" not in data["demo"]:
                        data["demo"]["bills"] = deepcopy(_DEFAULT_BILLS)
                    if "credit_score" not in data["demo"]:
                        data["demo"]["credit_score"] = 750
                return data
        except Exception as e:
            print(f"Error loading data: {e}")
    return {"demo": _make_default_account()}


_sessions: Dict[str, Dict[str, Any]] = _load_sessions()


def _get_account(user_id: str) -> Dict[str, Any]:
    """Return existing account or auto-create one for new users."""
    if user_id not in _sessions:
        _sessions[user_id] = _make_default_account()
        _save_sessions()
    return _sessions[user_id]


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _append_transaction(
    account: Dict[str, Any],
    txn_type: str,
    amount: float,
    description: str,
) -> Dict[str, Any]:
    """Append a transaction record and return it."""
    txn = {
        "id": f"txn-{uuid.uuid4().hex[:8]}",
        "type": txn_type,
        "amount": round(amount, 2),
        "description": description,
        "timestamp": _now_iso(),
        "balance_after": round(account["balance"], 2),
    }
    account["transactions"].append(txn)
    _save_sessions()
    return txn


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------
class TransferRequest(BaseModel):
    user_id: str
    amount: float = Field(gt=0)
    recipient: str
    description: str = ""


class DepositRequest(BaseModel):
    user_id: str
    amount: float = Field(gt=0)
    description: str = "Reward Deposit"


class BillPayRequest(BaseModel):
    user_id: str
    bill_id: str


class BillMissRequest(BaseModel):
    user_id: str
    bill_id: str
    late_fee: float = 500.0


class InvestRequest(BaseModel):
    user_id: str
    amount: float = Field(gt=0)
    type: str  # stocks | mutual_funds | fd
    action: str  # buy | sell


class LoanRequest(BaseModel):
    user_id: str
    amount: float = Field(gt=0)
    purpose: str
    tenure_months: int = Field(gt=0)


class ChatRequest(BaseModel):
    user_id: str
    message: str


class WhatIfRequest(BaseModel):
    user_id: str
    scenario_type: str  # invest | save | loan
    amount: float = Field(gt=0)
    years: float = Field(gt=0)
    rate: float = Field(gt=0)  # annual percentage, e.g. 12 for 12%


# ---------------------------------------------------------------------------
# Helper: EMI calculation
# ---------------------------------------------------------------------------
def _calculate_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
    r = annual_rate_pct / 100 / 12  # monthly interest rate
    emi = principal * r / (1 - math.pow(1 + r, -tenure_months))
    return round(emi, 2)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/account/{user_id}", summary="Get full account state")
def get_account(user_id: str) -> Dict[str, Any]:
    return _get_account(user_id)


@app.post("/api/transfer", summary="Transfer money")
def transfer(req: TransferRequest) -> Dict[str, Any]:
    account = _get_account(req.user_id)

    if req.amount > account["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient balance.")

    # Deduct
    account["balance"] = round(account["balance"] - req.amount, 2)
    desc = req.description or f"Transfer to {req.recipient}"
    _append_transaction(account, "debit", req.amount, desc)

    # AI risk comment if amount > 30% of original balance
    ai_warning: Optional[str] = None
    original_balance = account["balance"] + req.amount  # balance before deduction
    if req.amount > 0.30 * original_balance:
        prompt = (
            f"A student just transferred ₹{req.amount:,.0f} which is more than 30% of their "
            f"bank balance of ₹{original_balance:,.0f} to '{req.recipient}'. "
            "Give a brief 1-sentence financial risk warning in simple language."
        )
        ai_warning = _gemini_generate(
            prompt,
            fallback=(
                "⚠️ Transferring more than 30% of your balance at once is risky – "
                "always keep an emergency fund."
            ),
        )

    response: Dict[str, Any] = {"account": account}
    if ai_warning:
        response["risk_alert"] = ai_warning
    return response


@app.post("/api/deposit", summary="Deposit money or credit reward")
def deposit(req: DepositRequest) -> Dict[str, Any]:
    account = _get_account(req.user_id)
    account["balance"] = round(account["balance"] + req.amount, 2)
    _append_transaction(account, "credit", req.amount, req.description)
    _save_sessions()
    return {"account": account}


@app.post("/api/bills/pay", summary="Pay an upcoming bill")
def pay_bill(req: BillPayRequest) -> Dict[str, Any]:
    account = _get_account(req.user_id)
    bill = next((b for b in account.get("bills", []) if b["id"] == req.bill_id), None)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill.get("isPaid"):
        return {"account": account, "message": "Bill already paid", "bill": bill}
    if bill["amount"] > account["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient balance to pay bill.")
    account["balance"] = round(account["balance"] - bill["amount"], 2)
    bill["isPaid"] = True
    bill["isLate"] = False
    account["credit_score"] = min(850, account.get("credit_score", 750) + 5)
    _append_transaction(account, "debit", bill["amount"], f"Bill Payment – {bill['name']}")
    _save_sessions()
    return {"account": account, "bill": bill}


@app.post("/api/bills/miss", summary="Simulate missing a bill due date")
def miss_bill(req: BillMissRequest) -> Dict[str, Any]:
    account = _get_account(req.user_id)
    bill = next((b for b in account.get("bills", []) if b["id"] == req.bill_id), None)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill.get("isPaid"):
        return {"account": account, "message": "Bill already paid", "bill": bill}
    bill["isLate"] = True
    bill["amount"] = round(bill["amount"] + req.late_fee, 2)
    account["credit_score"] = max(300, account.get("credit_score", 750) - 45)
    _append_transaction(account, "debit", req.late_fee, f"Late Penalty Fee – Missed {bill['name']}")
    _save_sessions()
    return {"account": account, "bill": bill}



@app.post("/api/invest", summary="Buy or sell an investment")
def invest(req: InvestRequest) -> Dict[str, Any]:
    valid_types = {"stocks", "mutual_funds", "fd"}
    if req.type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Investment type must be one of {sorted(valid_types)}.",
        )
    if req.action not in {"buy", "sell"}:
        raise HTTPException(status_code=400, detail="Action must be 'buy' or 'sell'.")

    account = _get_account(req.user_id)

    if req.action == "buy":
        if req.amount > account["balance"]:
            raise HTTPException(status_code=400, detail="Insufficient balance to invest.")
        account["balance"] = round(account["balance"] - req.amount, 2)
        account["investments"][req.type] = round(
            account["investments"].get(req.type, 0) + req.amount, 2
        )
        _append_transaction(
            account,
            "debit",
            req.amount,
            f"Investment – {req.type.replace('_', ' ').title()} purchase",
        )
    else:  # sell
        current = account["investments"].get(req.type, 0)
        if req.amount > current:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot sell more than current holding of ₹{current:,.2f}.",
            )
        account["investments"][req.type] = round(current - req.amount, 2)
        account["balance"] = round(account["balance"] + req.amount, 2)
        _append_transaction(
            account,
            "credit",
            req.amount,
            f"Investment – {req.type.replace('_', ' ').title()} sold",
        )

    return {"account": account}


@app.post("/api/loan", summary="Take a loan")
def loan(req: LoanRequest) -> Dict[str, Any]:
    account = _get_account(req.user_id)

    emi = _calculate_emi(req.amount, 12.0, req.tenure_months)
    loan_record = {
        "id": f"loan-{uuid.uuid4().hex[:8]}",
        "amount": round(req.amount, 2),
        "purpose": req.purpose,
        "tenure_months": req.tenure_months,
        "emi": emi,
        "annual_rate_pct": 12.0,
        "taken_on": _now_iso(),
        "status": "active",
    }
    account["loans"].append(loan_record)

    # Credit balance (loan disbursement)
    account["balance"] = round(account["balance"] + req.amount, 2)
    _append_transaction(
        account,
        "credit",
        req.amount,
        f"Loan disbursement – {req.purpose}",
    )

    # AI advice
    prompt = (
        f"A student took a loan of ₹{req.amount:,.0f} for '{req.purpose}' "
        f"over {req.tenure_months} months at 12% annual interest. "
        f"The EMI is ₹{emi:,.2f}/month. "
        "Give a 2-3 sentence practical financial advice for a beginner. "
        "Use simple language and ₹ for currency."
    )
    ai_advice = _gemini_generate(
        prompt,
        fallback=(
            f"Your EMI of ₹{emi:,.2f}/month should ideally be under 40% of your monthly income. "
            "Always pay on time to protect your credit score."
        ),
    )

    return {"account": account, "loan": loan_record, "ai_advice": ai_advice}


@app.post("/api/chat", summary="Chat with the AI financial assistant")
def chat(req: ChatRequest) -> Dict[str, Any]:
    account = _get_account(req.user_id)
    account_json = json.dumps(account, indent=2)

    system_prompt = (
        "You are a friendly financial literacy AI assistant for FinSim, "
        "a banking simulator for students.\n"
        f"The user has the following account state:\n{account_json}\n"
        "Help them understand financial concepts, risks, and make better decisions.\n"
        "Formatting instructions:\n"
        "- Use clear, friendly formatting with short paragraphs and bullet points.\n"
        "- NEVER use LaTeX syntax (like $\\rightarrow$, $\\times$, etc.) — use clean Unicode symbols like →, ×, %.\n"
        "- Always use ₹ for Indian Rupee amounts.\n"
        "- Keep responses under 130 words.\n"
        "- Always end with a separate paragraph: **Actionable Tip:** <one clear, high-impact tip>."
    )
    full_prompt = f"{system_prompt}\n\nUser: {req.message}"

    reply = _gemini_generate(
        full_prompt,
        fallback=(
            "I'm your FinSim financial assistant! I can help you understand savings, "
            "investments, loans, and budgeting. Tip: Try to save at least 20% of every "
            "credit you receive – it builds a strong financial cushion over time."
        ),
    )
    return {"reply": reply}


@app.post("/api/whatif", summary="What-if scenario analysis")
def whatif(req: WhatIfRequest) -> Dict[str, Any]:
    account = _get_account(req.user_id)
    rate_decimal = req.rate / 100

    # Calculate projected value
    if req.scenario_type == "invest":
        # Compound interest (monthly compounding)
        months = req.years * 12
        monthly_rate = rate_decimal / 12
        projected = req.amount * math.pow(1 + monthly_rate, months)
    elif req.scenario_type == "save":
        # Simple compound interest (annual)
        projected = req.amount * math.pow(1 + rate_decimal, req.years)
    elif req.scenario_type == "loan":
        # Total repayment cost
        months = int(req.years * 12)
        emi = _calculate_emi(req.amount, req.rate, months)
        projected = emi * months
    else:
        raise HTTPException(
            status_code=400,
            detail="scenario_type must be 'invest', 'save', or 'loan'.",
        )

    projected = round(projected, 2)

    prompt = (
        f"A student is running a what-if scenario for FinSim.\n"
        f"Scenario: {req.scenario_type}\n"
        f"Principal/Amount: ₹{req.amount:,.0f}\n"
        f"Duration: {req.years} years\n"
        f"Rate: {req.rate}% per annum\n"
        f"Projected value / total cost: ₹{projected:,.2f}\n"
        f"Current account balance: ₹{account['balance']:,.2f}\n\n"
        "Explain what this means in 3-4 simple sentences. "
        "Is it a good decision? What should the student watch out for? "
        "Use ₹ for currency. Keep it under 120 words."
    )
    analysis = _gemini_generate(
        prompt,
        fallback=(
            f"If you {req.scenario_type} ₹{req.amount:,.0f} at {req.rate}% for {req.years} years, "
            f"your projected value will be ₹{projected:,.2f}. "
            "Compare this with inflation (~6% in India) to gauge real returns. "
            "Tip: Start early – time is the most powerful factor in growing wealth."
        ),
    )
    return {"analysis": analysis, "projected_value": projected}


@app.get("/api/market", summary="Get fake live market data")
def market() -> Dict[str, Any]:
    trending_stocks = [
        {
            "name": "Reliance Industries",
            "ticker": "RELIANCE",
            "price": round(2800 + random.uniform(-50, 50), 2),
            "change_percent": round(random.uniform(-2.5, 3.5), 2),
        },
        {
            "name": "Tata Consultancy Services",
            "ticker": "TCS",
            "price": round(3900 + random.uniform(-80, 80), 2),
            "change_percent": round(random.uniform(-1.8, 2.8), 2),
        },
        {
            "name": "HDFC Bank",
            "ticker": "HDFCBANK",
            "price": round(1650 + random.uniform(-30, 30), 2),
            "change_percent": round(random.uniform(-2.0, 3.0), 2),
        },
    ]
    return {
        "timestamp": _now_iso(),
        "NIFTY50": round(random.uniform(24000, 26000), 2),
        "SENSEX": round(random.uniform(79000, 83000), 2),
        "USDINR": round(83.5 + random.uniform(-0.5, 0.5), 4),
        "gold_per_gram": round(7200 + random.uniform(-100, 100), 2),
        "trending_stocks": trending_stocks,
    }


@app.post("/api/reset/{user_id}", summary="Reset account to default state")
def reset_account(user_id: str) -> Dict[str, Any]:
    _sessions[user_id] = _make_default_account()
    _save_sessions()
    return {"message": f"Account for '{user_id}' has been reset.", "account": _sessions[user_id]}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", include_in_schema=False)
def health() -> Dict[str, str]:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Serve React static files (production – Docker build copies dist → ./static)
# ---------------------------------------------------------------------------
_static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        # Serve exact file if it exists (e.g. vite.svg, favicon.ico)
        file_path = os.path.join(_static_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index = os.path.join(_static_dir, "index.html")
        return FileResponse(index)
else:
    @app.get("/", include_in_schema=False)
    def dev_root():
        return RedirectResponse(url="/docs")


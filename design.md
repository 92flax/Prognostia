# AQTE Trading - Design Document

## Overview

**AQTE Trading** (Automated Quantitative Trading Engine) is a mobile app for AI-powered crypto futures trading with a **Hybrid Mode** supporting both paper trading (simulation) and live trading via Bitget.

**Core Philosophy**: The app provides high-precision signals with all parameters (Entry, Leverage, SL, TP) and can either auto-execute trades or let users copy and execute manually.

---

## Hybrid Trading Mode

### Paper Mode (Default)
- Simulated trading with $10,000 virtual balance
- No API credentials required
- Perfect for testing strategies
- Full trade execution simulation

### Live Mode
- Real trading via Bitget Futures API
- Requires API Key, Secret, and Passphrase
- Isolated Margin, Hedge Mode
- Real positions and P&L

---

## Screen List

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Main trading interface with signal display and auto-trade toggle |
| **Portfolio** | Open positions, trade history, balance overview |
| **History** | Past signals and trade outcomes |
| **Settings** | Bitget credentials, risk parameters, preferences |

---

## Primary Content and Functionality

### 1. Dashboard Screen (Home Tab)
- **Mode Indicator**: PAPER (green) or LIVE (red) badge
- **Paper Balance**: Current virtual balance display
- **Asset Selector**: Horizontal scroll (BTC, ETH, SOL, XRP, etc.)
- **Auto-Trading Bot Toggle**: Enable/disable automatic execution
- **Active Signal Card** (Hero Component):
  - Direction Badge: "BUY / LONG" (Green) or "SELL / SHORT" (Red)
  - Confidence percentage badge
  - **LEV**: Recommended leverage with risk level
  - **ENTRY**: Market price
  - **TP**: Take Profit price (+% gain)
  - **SL**: Stop Loss price (-% loss)
  - Risk:Reward ratio
  - Rationale text explaining the signal
  - **Execute Trade** button (Paper mode)
  - **Copy Signal** button

### 2. Portfolio Screen
- **Balance Card**: Total balance, unrealized P&L
- **Tab Selector**: Open Positions / History
- **Open Positions List**:
  - Asset, direction, leverage
  - Entry price, current price
  - Unrealized P&L (amount and %)
  - Close Position button
- **Trade History List**:
  - Closed trades with entry/exit prices
  - Realized P&L per trade
  - Win/loss indicator
- **Performance Stats**: Win rate, total trades

### 3. History Screen
- **Signal History List**: Past generated signals
- **Trade Outcomes**: Linked trade results
- **Summary Stats**: Total signals, avg confidence

### 4. Settings Screen
- **Bitget API Credentials**:
  - API Key input
  - API Secret input
  - Passphrase input
  - Test Connection button
  - Connection status indicator
- **Risk Parameters**:
  - Safety Factor slider (1-4x)
  - Max Leverage slider (5-50x)
  - Risk-Reward Ratio slider (1.5-4:1)
- **Paper Wallet**:
  - Reset Paper Wallet button
- **Preferences**:
  - Dark mode toggle
  - Notifications toggle

---

## Key User Flows

### 1. Paper Trading Flow
1. App starts in PAPER mode by default
2. User views current signal on Dashboard
3. User taps "Execute Trade"
4. Trade is simulated and added to Portfolio
5. User monitors position in Portfolio tab
6. User closes position manually or at TP/SL

### 2. Live Trading Setup
1. User navigates to Settings
2. User enters Bitget API credentials
3. User taps "Test Connection"
4. On success, mode switches to LIVE
5. User can now execute real trades

### 3. Auto-Trading Flow
1. User enables Auto-Trading toggle on Dashboard
2. When new high-confidence signal appears (>75%)
3. Bot automatically executes trade
4. Position appears in Portfolio
5. User receives confirmation

### 4. Manual Copy Flow
1. User views signal on Dashboard
2. User taps "Copy Signal"
3. Full setup copied to clipboard
4. User opens Bitget app
5. User creates position with copied parameters

---

## Signal Engine Logic

### Leverage Calculation
```
Leverage = 1 / (DailyVolatility × SafetyFactor)
```
- Lower volatility = Higher safe leverage
- Higher safety factor = Lower leverage recommendation
- Clamped between 3x and 20x

### Stop Loss (Chandelier Exit)
```
Long SL = Entry - (ATR × 3.0)
Short SL = Entry + (ATR × 3.0)
```

### Take Profit (Risk-Reward Based)
```
Long TP = Entry + (|Entry - SL| × RRR)
Short TP = Entry - (|Entry - SL| × RRR)
```
- Default Risk-Reward Ratio: 2.0

### Risk Level Classification
| Leverage | Level | Color |
|----------|-------|-------|
| 1-3x | LOW | Green |
| 4-7x | MEDIUM | Yellow |
| 8-15x | HIGH | Orange |
| 16x+ | EXTREME | Red |

---

## Color Choices

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | #10B981 | #10B981 | Buttons, accents |
| `background` | #FFFFFF | #0F172A | Screen backgrounds |
| `surface` | #F8FAFC | #1E293B | Cards |
| `foreground` | #0F172A | #F1F5F9 | Primary text |
| `muted` | #64748B | #94A3B8 | Secondary text |
| `success` | #22C55E | #4ADE80 | Long, profit |
| `error` | #EF4444 | #F87171 | Short, loss |
| `warning` | #F59E0B | #FBBF24 | Warnings |

---

## Database Schema (PostgreSQL)

### signals Table
| Field | Type | Description |
|-------|------|-------------|
| id | serial | Primary key |
| asset | varchar | Trading pair (e.g., BTCUSDT) |
| direction | enum | LONG or SHORT |
| entry_price | decimal | Entry price |
| tp_price | decimal | Take profit price |
| sl_price | decimal | Stop loss price |
| leverage_recommendation | decimal | Recommended leverage |
| risk_level | enum | LOW/MEDIUM/HIGH/EXTREME |
| confidence_score | integer | 0-100 |
| rationale | text | Explanation |
| executed | boolean | Was trade executed |
| created_at | timestamp | Signal time |

### trades Table
| Field | Type | Description |
|-------|------|-------------|
| id | serial | Primary key |
| signal_id | integer | FK to signals |
| mode | enum | PAPER or LIVE |
| asset | varchar | Trading pair |
| direction | enum | LONG or SHORT |
| entry_price | decimal | Entry price |
| exit_price | decimal | Exit price (nullable) |
| size | decimal | Position size |
| leverage | integer | Used leverage |
| pnl | decimal | Realized P&L |
| pnl_percent | decimal | P&L percentage |
| status | enum | OPEN or CLOSED |
| opened_at | timestamp | Open time |
| closed_at | timestamp | Close time (nullable) |

### user_settings Table
| Field | Type | Description |
|-------|------|-------------|
| id | serial | Primary key |
| user_id | integer | FK to users |
| bitget_api_key | varchar | Encrypted API key |
| bitget_secret | varchar | Encrypted secret |
| bitget_passphrase | varchar | Encrypted passphrase |
| auto_trade_enabled | boolean | Auto-trade toggle |
| confidence_threshold | integer | Min confidence for auto |
| max_leverage | integer | Max allowed leverage |
| safety_factor | decimal | Leverage safety factor |
| rr_ratio | decimal | Risk-reward ratio |

### paper_wallet Table
| Field | Type | Description |
|-------|------|-------------|
| id | serial | Primary key |
| user_id | integer | FK to users |
| balance | decimal | Current balance |
| initial_balance | decimal | Starting balance |
| total_pnl | decimal | Total P&L |
| total_trades | integer | Trade count |
| winning_trades | integer | Win count |
| losing_trades | integer | Loss count |

---

## Technical Stack

- **Framework**: React Native (Expo SDK 54)
- **Styling**: NativeWind (Tailwind CSS)
- **State**: React Context + useState
- **Exchange**: Bitget via CCXT
- **Database**: PostgreSQL (Drizzle ORM)
- **Testing**: Vitest (130 tests)

---

## Clipboard Format

When user taps "Copy Signal":

```
🟢 BTCUSDT LONG

📊 TRADE SETUP
━━━━━━━━━━━━━━━━━━
LEV: 7x Isolated ⚠️
ENTRY: $98,432.50
TP: $105,850.00
SL: $91,015.00
━━━━━━━━━━━━━━━━━━
R:R = 1:2
Confidence: 78%

💡 Strong Bullish Sentiment + Above 200 EMA

#AQTE #Crypto #Trading
```

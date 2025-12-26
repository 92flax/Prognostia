# AQTE Signal Intelligence Dashboard - Design Document

## Overview

AQTE has pivoted from an automated trading engine to a **Signal Intelligence Dashboard** - a decision support system that provides complete, mathematically calculated trade setups for manual execution on Bitget.

**Core Philosophy**: The app does NOT execute trades. It provides high-precision signals with all parameters (Entry, Leverage, SL, TP) that users copy and execute manually on their exchange.

---

## Screen List

| Screen | Purpose |
|--------|---------|
| **Signals** | Main screen with Active Signal Card - the hero component |
| **History** | Past signals with setups for reference and backtesting |
| **Settings** | Signal generation parameters and app preferences |

---

## Primary Content and Functionality

### 1. Signals Screen (Home Tab)
- **Active Signal Card** (Hero Component)
  - Direction Badge: BIG "BUY / LONG" (Green) or "SELL / SHORT" (Red)
  - 4 Critical Numbers in high-visibility format:
    - **LEV**: Recommended leverage (e.g., "7x Isolated")
    - **ENTRY**: Market price
    - **TP**: Take Profit price
    - **SL**: Stop Loss price
  - Risk Level indicator (LOW/MEDIUM/HIGH/EXTREME)
  - Rationale text explaining the signal
  - **Copy Signal** button (copies full setup to clipboard)
- **Market Tickers**: Horizontal scroll with BTC, ETH, SOL prices
- **Signal Stats**: Today's signals count, 7-day win rate
- **How to Use Guide**: Step-by-step instructions

### 2. History Screen
- **Signal History List**: Compact cards with past signals
  - Direction badge, Asset name
  - LEV, ENTRY, TP, SL values
  - Confidence score
  - Timestamp
  - Copy button
- **Summary Stats**: Total signals, avg confidence, long/short ratio

### 3. Settings Screen
- **Signal Parameters**:
  - Safety Factor slider (1-4x)
  - Risk-Reward Ratio slider (1.5-4:1)
  - Max Leverage slider (5-50x)
  - ATR Multiplier slider (2-5x)
- **Signal Engine Info**: Formulas used for calculations
- **Notification Preferences**: New signal alerts, high confidence only
- **App Preferences**: Dark mode, currency display
- **About**: Version, support links

---

## Key User Flows

### Primary Flow: Copy and Execute Signal
1. User opens app → Sees Active Signal Card
2. Reviews the setup (LEV, ENTRY, TP, SL)
3. Reads the rationale
4. Taps "Copy Signal" → Full setup copied to clipboard
5. Opens Bitget app
6. Creates position with copied parameters
7. Executes trade manually

### Secondary Flow: Review Past Signals
1. User taps History tab
2. Scrolls through past signals
3. Taps Copy on any signal to reuse setup

### Settings Flow: Adjust Signal Parameters
1. User taps Settings tab
2. Adjusts Safety Factor for more/less conservative leverage
3. Changes Risk-Reward Ratio for wider/tighter TPs
4. Saves preferences
5. New signals reflect updated parameters

---

## Signal Engine Logic

### Leverage Calculation
```
Leverage = 1 / (DailyVolatility × SafetyFactor)
```
- Lower volatility = Higher safe leverage
- Higher safety factor = Lower leverage recommendation
- Clamped between minLeverage and maxLeverage

### Stop Loss (Chandelier Exit)
```
Long SL = Entry - (ATR × Multiplier)
Short SL = Entry + (ATR × Multiplier)
```
- Default ATR multiplier: 3.0
- Uses 14-period ATR

### Take Profit (Risk-Reward Based)
```
Long TP = Entry + (|Entry - SL| × RRR)
Short TP = Entry - (|Entry - SL| × RRR)
```
- Default Risk-Reward Ratio: 2.0

### Direction Logic
Weighted combination of:
- Sentiment Score (40% weight)
- RSI (30% weight)
- EMA 200 position (30% weight)

### Confidence Score
Based on alignment of:
- Sentiment strength
- RSI extremes (oversold/overbought)
- Price vs EMA trend
- Volatility conditions

---

## Color Choices

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | #0066FF | #4D94FF | Buttons, accents, active states |
| `background` | #FFFFFF | #0A0A0A | Screen backgrounds |
| `surface` | #F5F5F5 | #1A1A1A | Cards, elevated surfaces |
| `foreground` | #111111 | #FFFFFF | Primary text |
| `muted` | #666666 | #888888 | Secondary text, captions |
| `border` | #E0E0E0 | #333333 | Dividers, card borders |
| `success` | #00C853 | #00E676 | Long signals, TP, positive |
| `error` | #FF3D00 | #FF5252 | Short signals, SL, negative |
| `warning` | #FF9800 | #FFB74D | Caution, medium risk |

---

## Design Principles

### 1. Glanceability
- User sees the signal in 1 second
- Critical numbers (LEV, TP, SL) are the largest text on screen
- Direction is immediately clear via color and badge

### 2. High Visibility
- Large, bold typography for numbers
- Color-coded risk levels
- Clear visual hierarchy

### 3. Simplicity
- No exchange connections required
- No API keys needed
- No trade execution - just information

### 4. Trust
- Transparent formulas shown in Settings
- Rationale explains every signal
- Historical accuracy trackable

---

## Removed Features (from v1)

The following features were removed in the pivot to Signal Intelligence:
- Exchange connections (Binance/Bitget/Alpaca)
- API key management
- Trade execution
- Paper trading / simulation mode
- Portfolio tracking
- Quick buy/sell buttons
- Real-time position monitoring

---

## Database Schema (PostgreSQL)

### signals Table
| Field | Type | Description |
|-------|------|-------------|
| id | serial | Primary key |
| asset | varchar | Trading pair (e.g., BTCUSDT) |
| direction | enum | LONG or SHORT |
| entry_price | decimal | Entry price at signal time |
| tp_price | decimal | Take profit price |
| sl_price | decimal | Stop loss price |
| leverage_recommendation | decimal | Recommended leverage |
| risk_level | enum | LOW/MEDIUM/HIGH/EXTREME |
| confidence_score | integer | 0-100 confidence |
| rationale | text | Human-readable explanation |
| created_at | timestamp | Signal generation time |

### signal_interactions Table
| Field | Type | Description |
|-------|------|-------------|
| id | serial | Primary key |
| signal_id | integer | FK to signals |
| was_copied | boolean | User copied the signal |
| was_executed | boolean | User confirmed execution |
| user_feedback | varchar | good/bad/neutral |

---

## Typography

- **Headings**: SF Pro Display Bold, 28-32px
- **Signal Numbers**: SF Pro Display Bold, 32-40px
- **Body**: SF Pro Text Regular, 16px
- **Caption**: SF Pro Text Regular, 14px
- **Direction Badge**: SF Pro Display Bold, 24px

---

## Interaction Patterns

- **Pull to Refresh**: Regenerate signal on Signals screen
- **Haptic Feedback**: On copy button tap
- **Copy Confirmation**: Brief "Copied!" state change
- **Loading States**: Skeleton while calculating
- **Error States**: Inline retry option

---

## Clipboard Format

When user taps "Copy Signal", the following format is copied:

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
Confidence: 72%

💡 Strong Bullish Sentiment + Above 200 EMA

⏰ 12/26/2024, 8:45:00 AM
#AQTE #Crypto #Trading
```

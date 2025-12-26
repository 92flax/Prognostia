# AQTE (Prognostia) - Mobile App Interface Design

## Overview

AQTE (Automated Quantitative Trading Engine) is a mobile application for AI-powered algorithmic trading of Bitcoin/crypto and stocks. The app follows Apple Human Interface Guidelines (HIG) for a native iOS feel with mobile portrait orientation (9:16) and one-handed usage.

**Primary Exchange**: Bitget (high-leverage crypto trading)
**Secondary Exchange**: Alpaca (stocks)

---

## Screen List

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Main overview with trading mode toggle, portfolio value, and quick metrics |
| **AI Predictions** | TimesFM price forecasts, FinBERT sentiment analysis, and Explainable AI |
| **Risk Management** | Kelly Criterion, Volatility-Based Leverage, Liquidation Distance, Chandelier Exit |
| **Portfolio** | Holdings, positions, and trade history |
| **Settings** | Bitget/Alpaca connections, risk parameters, and app preferences |

---

## Primary Content and Functionality

### 1. Dashboard Screen (Home Tab)
- **Trading Mode Toggle**: Switch between Live and Simulation (Paper Trading) modes
- **Mode Indicator Badge**: Shows current mode (LIVE/SIM) in header
- **Paper Wallet Card** (Simulation Mode):
  - Virtual USDT/BTC/ETH balances
  - Simulated P&L and win rate
  - Reset button to restart simulation
- **Portfolio Summary Card** (Live Mode):
  - Total value, daily P&L, percentage change
- **AI Signal Indicator**: Current bullish/bearish/neutral signal from AI
- **Quick Actions**: Buy/Sell buttons (Paper Buy/Sell in simulation)
- **Market Overview**: BTC and top crypto prices with mini sparkline charts
- **Recent Activity**: Last 3-5 trades (filtered by mode)

### 2. AI Predictions Screen
- **Combined AI Signal Card**:
  - Direction (Bullish/Bearish/Neutral)
  - Confidence percentage
  - Last updated timestamp
- **Explainable AI Card** (NEW):
  - Summary explanation: "Why Bullish? FinBERT sentiment is +0.8 AND Price is above 200 EMA"
  - Contributing factors with weights:
    - FinBERT Sentiment Score
    - Price vs 200 EMA
    - RSI Level
    - Volume Analysis
    - Volatility Assessment
  - Expandable factor details
- **Price Forecast Section**:
  - TimesFM model predictions with confidence intervals
  - 24h, 7d, 30d forecast horizons
  - Visual chart with predicted price path
- **Sentiment Analysis Section**:
  - FinBERT sentiment score (-1 to +1) gauge
  - Recent news headlines with individual sentiment
  - Aggregated market sentiment trend

### 3. Risk Management Screen
- **Risk Overview Card**:
  - Overall risk score (0-100)
  - Current leverage display
  - Liquidation distance quick stat
  - Kelly fraction indicator
- **Liquidation Distance Card** (NEW):
  - Visual gauge showing distance to liquidation
  - Current price vs liquidation price
  - Risk level indicator (Safe/Warning/Danger)
  - Margin ratio display
- **Smart Leverage Card** (NEW):
  - Volatility-Based Leverage selector
  - Formula: MaxLeverage = (1 / DailyVolatility) * SafetyFactor
  - Recommended leverage based on current volatility
  - Safety factor adjustment (0.5x to 2.0x)
  - Post Only toggle for limit orders
- **Kelly Criterion Card**:
  - Optimal position size recommendation
  - Win rate and profit/loss ratio display
  - **Kelly Fraction Selector**: Quarter/Half/Full Kelly
  - Automatic Quarter-Kelly recommendation for >20x leverage
- **Volatility Targeting Card**:
  - Current vs target volatility (20% p.a. default)
  - Rolling volatility chart
  - Position adjustment recommendations
- **Chandelier Exit Card**:
  - Current ATR value
  - Stop-loss levels for open positions
  - Trailing stop visualization
- **High Leverage Warning**: Displayed when leverage >20x

### 4. Portfolio Screen
- **Holdings List**:
  - Asset name, quantity, current value
  - P&L per position with color coding
  - Allocation percentage
- **Allocation Chart**: Visual breakdown of portfolio
- **Trade History**:
  - Recent executed trades
  - Order type, price, quantity, timestamp
  - Simulated trades marked with badge
- **Performance Metrics**:
  - Total return, Sharpe ratio, max drawdown, Calmar ratio

### 5. Settings Screen
- **Exchange Connections**:
  - **Bitget** (Primary): API Key, Secret, Passphrase
  - **Alpaca**: API Key, Secret
  - Connection status with balance display
- **Risk Parameters**:
  - Max leverage slider (1-100x)
  - Volatility target adjustment
  - ATR multiplier for Chandelier Exit
- **AI Models**:
  - TimesFM version display
  - FinBERT model info
  - XAI Engine version
- **App Preferences**:
  - Theme (light/dark)
  - Notifications toggle
  - Currency display preference

---

## Key User Flows

### Flow 1: Paper Trading (Simulation Mode)
1. User opens app → Dashboard screen
2. Toggles to "Simulation" mode
3. Paper Wallet Card appears with virtual $10,000 balance
4. User taps "Paper Buy" button
5. Executes simulated trade at real-time prices
6. Trade logged to database without API call
7. Virtual balance updated

### Flow 2: View AI Trading Signal with Explanation
1. User opens app → Dashboard screen
2. Sees AI Signal Indicator showing "Bullish" with confidence
3. Taps signal card → Navigates to AI Predictions screen
4. Views Explainable AI Card:
   - "Why Bullish? FinBERT sentiment is +0.8 (Very Positive) AND Price is above 200 EMA"
5. Expands to see all contributing factors with weights
6. Scrolls to see detailed TimesFM forecast chart

### Flow 3: High-Leverage Risk Management
1. User taps Risk tab in bottom navigation
2. Views Liquidation Distance card showing "1.2% away"
3. Sees high leverage warning (using 50x)
4. Smart Leverage Card recommends 15x based on volatility
5. Adjusts leverage using volatility-based selector
6. Kelly Card automatically switches to Quarter-Kelly
7. Reviews updated liquidation distance (now 6.7% away)

### Flow 4: Configure Bitget Exchange
1. User taps Settings tab
2. Taps "Bitget" exchange card (marked as PRIMARY)
3. Sees passphrase requirement hint
4. Enters API Key, Secret, and Passphrase
5. Taps "Test Connection"
6. Success indicator shows connected with balance

### Flow 5: Execute Live Trade
1. User on Dashboard in "Live" mode
2. Sees bullish signal with high confidence
3. Checks Risk tab for position sizing (Half-Kelly: $2,450)
4. Returns to Dashboard, taps "Buy" button
5. Confirms order with Post Only option
6. Order sent to Bitget API
7. Success notification with trade details

---

## Color Choices

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | #0066FF | #4D94FF | Buttons, links, active states |
| `background` | #F8FAFC | #0F172A | Screen backgrounds |
| `surface` | #FFFFFF | #1E293B | Cards, elevated surfaces |
| `foreground` | #0F172A | #F1F5F9 | Primary text |
| `muted` | #64748B | #94A3B8 | Secondary text |
| `border` | #E2E8F0 | #334155 | Dividers, card borders |
| `success` | #10B981 | #34D399 | Profit, bullish, positive, simulation mode |
| `warning` | #F59E0B | #FBBF24 | Caution, neutral signals |
| `error` | #EF4444 | #F87171 | Loss, bearish, errors, live mode warning |

### Brand Colors
- **Primary Blue**: #0066FF - Represents trust, technology, finance
- **Bitget Green**: #00D4AA - Exchange branding
- **Accent Green**: #10B981 - Profit indicators
- **Accent Red**: #EF4444 - Loss indicators, live mode warnings

---

## Database Schema (PostgreSQL)

### New Tables
- **trades**: Logs all executed trades (pair, side, entry_price, leverage, pnl, status, is_simulated)
- **signals**: Stores AI predictions for backtesting (timesfm_output, finbert_output, timestamp)
- **paper_wallets**: Tracks virtual balances for simulation mode (user_id, usdt_balance, btc_balance, etc.)

---

## Component Patterns

### Cards
- Rounded corners (16px radius)
- Subtle shadow on light mode
- Border on dark mode
- Padding: 16px

### Trading Mode Toggle
- Pill-shaped toggle with sliding indicator
- Green for Simulation, Red for Live
- Status text below toggle

### Liquidation Gauge
- Semi-circular gauge visualization
- Color zones: Green (safe), Yellow (warning), Red (danger)
- Current position indicator dot

### Kelly Fraction Selector
- Three-button selector (¼, ½, Full)
- "REC" badge on recommended option
- Warning when not using recommended for high leverage

### Charts
- Line charts for price history and forecasts
- Area fill for confidence intervals
- Color-coded (green for up, red for down)

### Bottom Tab Bar
- 5 tabs: Dashboard, AI, Risk, Portfolio, Settings
- SF Symbols icons
- Active state with primary color

---

## Typography

- **Headings**: SF Pro Display Bold, 24-32px
- **Subheadings**: SF Pro Text Semibold, 18-20px
- **Body**: SF Pro Text Regular, 16px
- **Caption**: SF Pro Text Regular, 14px
- **Metrics**: SF Pro Display Bold, 28-36px (monospace for numbers)

---

## Interaction Patterns

- **Pull to Refresh**: On Dashboard and Portfolio screens
- **Haptic Feedback**: On button taps and successful actions
- **Loading States**: Skeleton screens while fetching data
- **Error States**: Inline error messages with retry option
- **Empty States**: Helpful message when no data available
- **Mode Confirmation**: Warning dialog when switching to Live mode
- **High Leverage Warnings**: Prominent alerts for dangerous positions

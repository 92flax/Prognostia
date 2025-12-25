# AQTE - Mobile App Interface Design

## Overview

AQTE (Automated Quantitative Trading Engine) is a mobile application for AI-powered algorithmic trading of Bitcoin/crypto and stocks. The app follows Apple Human Interface Guidelines (HIG) for a native iOS feel with mobile portrait orientation (9:16) and one-handed usage.

---

## Screen List

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Main overview with market summary, portfolio value, and quick metrics |
| **AI Predictions** | TimesFM price forecasts and FinBERT sentiment analysis |
| **Risk Management** | Kelly Criterion, Volatility Targeting, Chandelier Exit metrics |
| **Portfolio** | Holdings, positions, and trade history |
| **Settings** | Exchange connections, risk parameters, and app preferences |

---

## Primary Content and Functionality

### 1. Dashboard Screen (Home Tab)
- **Portfolio Summary Card**: Total value, daily P&L, percentage change
- **Market Overview**: BTC and top stock prices with mini sparkline charts
- **AI Signal Indicator**: Current bullish/bearish/neutral signal from AI
- **Quick Actions**: Buy/Sell buttons for rapid trading
- **Recent Activity**: Last 3-5 trades or signals

### 2. AI Predictions Screen
- **Price Forecast Section**:
  - TimesFM model predictions with confidence intervals
  - 24h, 7d, 30d forecast horizons
  - Visual chart with predicted price path
- **Sentiment Analysis Section**:
  - FinBERT sentiment score (-1 to +1) gauge
  - Recent news headlines with individual sentiment
  - Aggregated market sentiment trend

### 3. Risk Management Screen
- **Kelly Criterion Card**:
  - Optimal position size recommendation
  - Win rate and profit/loss ratio display
  - Half-Kelly toggle for conservative sizing
  - Max leverage limit indicator
- **Volatility Targeting Card**:
  - Current vs target volatility (20% p.a. default)
  - Rolling volatility chart
  - Position adjustment recommendations
- **Chandelier Exit Card**:
  - Current ATR value
  - Stop-loss levels for open positions
  - Trailing stop visualization

### 4. Portfolio Screen
- **Holdings List**:
  - Asset name, quantity, current value
  - P&L per position with color coding
  - Allocation percentage
- **Trade History**:
  - Recent executed trades
  - Order type, price, quantity, timestamp
- **Performance Metrics**:
  - Total return, Sharpe ratio, max drawdown

### 5. Settings Screen
- **Exchange Connections**:
  - Binance (CCXT) connection status
  - Alpaca connection status
  - API key management (masked display)
- **Risk Parameters**:
  - Max leverage slider
  - Volatility target adjustment
  - ATR multiplier for Chandelier Exit
- **App Preferences**:
  - Theme (light/dark)
  - Notifications toggle
  - Currency display preference

---

## Key User Flows

### Flow 1: View AI Trading Signal
1. User opens app → Dashboard screen
2. Sees AI Signal Indicator showing "Bullish" with confidence
3. Taps signal card → Navigates to AI Predictions screen
4. Views detailed TimesFM forecast chart
5. Scrolls to see FinBERT sentiment breakdown

### Flow 2: Execute Trade Based on Signal
1. User on Dashboard sees bullish signal
2. Taps "Buy" quick action button
3. Bottom sheet appears with:
   - Asset selector (BTC, ETH, AAPL, etc.)
   - Suggested position size (from Kelly)
   - Order type (Market/Limit)
   - Confirm button
4. User confirms → Order executed
5. Success toast notification

### Flow 3: Review Risk Metrics
1. User taps Risk tab in bottom navigation
2. Views Kelly Criterion recommendation
3. Toggles Half-Kelly for conservative sizing
4. Scrolls to Volatility section
5. Sees current volatility vs target
6. Reviews Chandelier Exit stop levels

### Flow 4: Configure Exchange
1. User taps Settings tab
2. Taps "Exchange Connections"
3. Selects Binance or Alpaca
4. Enters API key and secret
5. Taps "Test Connection"
6. Success indicator shows connected

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
| `success` | #10B981 | #34D399 | Profit, bullish, positive |
| `warning` | #F59E0B | #FBBF24 | Caution, neutral signals |
| `error` | #EF4444 | #F87171 | Loss, bearish, errors |

### Brand Colors
- **Primary Blue**: #0066FF - Represents trust, technology, finance
- **Accent Green**: #10B981 - Profit indicators
- **Accent Red**: #EF4444 - Loss indicators

---

## Component Patterns

### Cards
- Rounded corners (16px radius)
- Subtle shadow on light mode
- Border on dark mode
- Padding: 16px

### Charts
- Line charts for price history and forecasts
- Area fill for confidence intervals
- Color-coded (green for up, red for down)

### Metrics Display
- Large number with label below
- Color indicates positive/negative
- Trend arrow icon

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

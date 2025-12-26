# AQTE Trading - Automated Quantitative Trading Engine

A mobile app for AI-powered algorithmic trading of Bitcoin/crypto and stocks.

![AQTE Trading](assets/images/icon.png)

## Features

### Dashboard
- Portfolio summary with total value and P&L
- Real-time market overview (BTC, ETH, stocks)
- AI trading signals (bullish/bearish/neutral)
- Quick Buy/Sell action buttons
- Recent activity feed

### AI Predictions
- **TimesFM** price forecasting with confidence intervals
- **FinBERT** sentiment analysis from news headlines
- Multi-horizon predictions (24h, 7d, 30d)
- Sentiment trend visualization

### Risk Management
- **Kelly Criterion** position sizing calculator
- Half-Kelly conservative option
- **Volatility Targeting** with rolling volatility chart
- **Chandelier Exit** ATR-based trailing stops
- Performance metrics (Sharpe, Sortino, Calmar ratios)

### Portfolio
- Holdings list with P&L tracking
- Asset allocation donut chart
- Trade history with order details
- Performance summary statistics

### Settings
- Exchange connections (Binance, Alpaca)
- Risk parameter sliders (leverage, volatility target, ATR multiplier)
- AI model configuration
- Notification preferences
- Security settings (biometrics, 2FA)

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript 5.9
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: Expo Router 6
- **State**: React Context + AsyncStorage
- **Backend**: Express.js + tRPC
- **Database**: PostgreSQL + Drizzle ORM

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- Expo Go app (for mobile testing)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Running on Device
1. Install Expo Go on your iOS/Android device
2. Scan the QR code from the terminal
3. The app will load on your device

## Environment Variables (Optional)

For live exchange data, add these API keys:

| Variable | Description |
|----------|-------------|
| `BINANCE_API_KEY` | Binance API Key for crypto trading |
| `BINANCE_API_SECRET` | Binance API Secret |
| `ALPACA_API_KEY` | Alpaca API Key for stock trading |
| `ALPACA_API_SECRET` | Alpaca API Secret |

## Project Structure

```
app/                  # Expo Router screens
  (tabs)/             # Tab navigation screens
    index.tsx         # Dashboard
    ai.tsx            # AI Predictions
    risk.tsx          # Risk Management
    portfolio.tsx     # Portfolio
    settings.tsx      # Settings
components/           # Reusable UI components
lib/                  # Utilities, types, mock data
hooks/                # Custom React hooks
server/               # Backend API (tRPC)
assets/               # Images and fonts
```

## License

MIT License

# Project TODO

## Core Setup
- [x] Configure theme colors for trading app
- [x] Set up tab navigation with 5 tabs
- [x] Add icon mappings for all tabs
- [x] Generate custom app logo

## Dashboard Screen
- [x] Portfolio summary card with total value and P&L
- [x] Market overview with BTC and stock prices
- [x] AI signal indicator (bullish/bearish/neutral)
- [x] Quick action buttons (Buy/Sell)
- [x] Recent activity list

## AI Predictions Screen
- [x] TimesFM price forecast section
- [x] Forecast chart with confidence intervals
- [x] FinBERT sentiment gauge
- [x] News headlines with sentiment scores
- [x] Sentiment trend visualization

## Risk Management Screen
- [x] Kelly Criterion calculator card
- [x] Half-Kelly toggle
- [x] Volatility targeting display
- [x] Rolling volatility chart
- [x] Chandelier Exit stop levels
- [x] ATR indicator

## Portfolio Screen
- [x] Holdings list with P&L
- [x] Asset allocation breakdown
- [x] Trade history list
- [x] Performance metrics (return, Sharpe, drawdown)

## Settings Screen
- [x] Exchange connection status (Binance/Alpaca)
- [x] API key management UI
- [x] Risk parameter sliders
- [x] Theme toggle
- [x] Notification preferences


## Major Refactor - High Leverage Trading Engine

### Architecture & Database
- [x] Switch drizzle schema from MySQL to PostgreSQL (pg-core)
- [x] Add trades table for logging executed trades
- [x] Add signals table for AI predictions storage
- [x] Add paper_wallets table for simulation mode

### Bitget Integration
- [x] Remove Binance references from design.md and UI
- [x] Implement Bitget API support
- [x] Implement Volatility-Based Smart Leverage selector
- [x] Add Post Only toggle for limit orders

### Paper Trading Mode
- [x] Add Live/Simulation toggle on Dashboard
- [x] Implement paper trade execution (DB only, no API)
- [x] Track virtual balances in paper_wallets

### Risk UI Updates
- [x] Add Liquidation Distance metric to risk card
- [x] Add Quarter-Kelly option for >20x leverage
- [x] Update Kelly card with extended options

### Settings Updates
- [x] Replace Binance inputs with Bitget credentials
- [x] Add Bitget Passphrase field

### Explainable AI
- [x] Add textual explanation for AI signals
- [x] Show FinBERT sentiment reasoning
- [x] Display technical indicator context (EMA, etc.)

## Pivot: Signal Intelligence Dashboard

### Signal Engine (lib/signal-engine.ts)
- [x] Create signal-engine.ts with core calculation logic
- [x] Implement Volatility-Based Leverage Calculator: 1 / (DailyVolatility * SafetyFactor)
- [x] Implement ATR-based Stop Loss (Chandelier Exit: ATR * 3.0)
- [x] Implement Take Profit with 2:1 Risk-Reward Ratio
- [x] Create SignalSetup type with all trade parameters

### Database Schema
- [x] Update signals table with new fields (entry_price, tp_price, sl_price, leverage_recommendation, rationale)

### Dashboard Redesign
- [x] Create ActiveSignalCard component with prominent direction badge
- [x] Display LEV, ENTRY, TP, SL in high-visibility format
- [x] Add signal rationale text
- [x] Implement "Copy Signal" button (clipboard)
- [x] Remove Quick Buy/Sell buttons

### Simplification
- [x] Remove Exchange Connections from Settings
- [x] Remove Bitget/Alpaca API integration
- [x] Remove Paper Trading mode (no longer needed)
- [x] Simplify to public market data only


## Automated Trading Bot - Hybrid Mode

### Database Schema
- [x] Add user_settings table (bitget credentials, auto_trade_enabled)
- [x] Expand signals table with executed field
- [x] Add trades table (mode, asset, side, size, entry, exit, pnl, status)
- [x] Add paper_wallet table for simulation balance

### Trading Engine (lib/trading-engine.ts)
- [x] Implement Bitget CCXT connection for Futures
- [x] Handle Isolated Margin and Hedge Mode settings
- [x] Create signal generation with XAI explanations
- [x] Implement executeSignal() router (Live vs Paper)
- [x] Add risk checks (balance vs position size)

### Dashboard UI
- [x] Add horizontal Asset Selector (BTC, ETH, SOL, etc.)
- [x] Update Signal Card with full trade setup
- [x] Add Auto-Trading toggle switch
- [x] Show current mode indicator (LIVE/SIMULATION)

### Settings Screen
- [x] Add Bitget API credentials form (Key, Secret, Passphrase)
- [x] Show connection status (Connected/Simulation Mode)
- [x] Add connection test button

### Portfolio Screen
- [x] Restore Portfolio tab in navigation
- [x] Show real positions from Bitget (Live mode)
- [x] Show paper positions (Simulation mode)
- [x] Display trade history with P&Lsitions

#### Automation Logic
- [x] Implement auto-trade trigger on high confidence signals
- [x] Add confidence threshold setting (default 75%)
- [x] Route execution through Trading Engine (Live/Paper)revent live trading without valid API connection


## Wallet Balance & Position Sizing

### Wallet Balance Display
- [x] Show Bitget Futures wallet balance on Dashboard
- [x] Display available margin for trading
- [x] Update balance after trade execution

### Position Size Selector
- [x] Create position size input component
- [x] Support percentage of wallet (25%, 50%, 75%, 100%)
- [x] Support fixed USDT amount input
- [x] Show calculated position size based on leverage
- [x] Add trade execution modal with size selection

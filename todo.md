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

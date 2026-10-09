# mrsdbskn-portfolio 💎

A modern, fluid personal wealth and multi-vault net worth dashboard built with **Vue 3**, **TypeScript**, and **Chart.js**. Designed for mobile-first OLED devices (like Google Pixel 10 XL) and ready for zero-cost deployment on **GitHub Pages**.

---

## 🌟 Supported Accounts & Assets

1. **Tangem Wallet (Hardware Cold Storage)**:
   - High-security cold storage assets (Bitcoin, Ethereum, Solana).
2. **MetaMask (Web3 Hot Wallet)**:
   - EVM mainnets & Layer 2s (Arbitrum, Chainlink, Uniswap, DeFi positions).
3. **Binance Global (CEX Trading & Staking)**:
   - Spot balances, BNB fee discounts, and USDT Flexible Earn yield.
4. **UBS Safe & Custody (Gold & Precious Metals)**:
   - Allocated Swiss vault physical gold bars (100g 999.9 Fine Gold) and bullion coins (Vienna Philharmonic 1 oz).
5. **Neon Invest (Swiss & Global Equities)**:
   - Vanguard FTSE All-World (VWRL), UBS SMI ETF (CHSPI), Swiss blue-chips (Nestlé, Novartis).

---

## 🚀 Key Features

- **Total Aggregated Net Worth**:
  - Live Net Worth calculation in **CHF** (default), **USD**, or **EUR** with instant FX currency conversion.
  - Overall Unrealized PnL (nominal profit and % ROI) vs. total invested capital (cost basis).
  - 24-Hour portfolio change tracker.
- **Privacy Shield Mode**:
  - One-tap eye toggle to blur and mask all financial values with bullets (`••••••`) when opening the app in public.
- **Interactive Visualizations (Chart.js)**:
  - **Historical Growth Spline Curve**: 24H, 7D, 1M, 6M, 1Y, and ALL-time filters with optional Cost Basis benchmark line.
  - **Asset Allocation Donut**: Visual slice distribution across Cold Crypto, Hot Web3, CEX, Physical Gold, and Equities.
  - **Cost vs. Value Comparison Bar Chart**: Side-by-side invested capital vs current valuation per vault.
- **Smart Importer (Neon / Binance / UBS / Web3)**:
  - Built-in drag-and-drop parser simulator for Neon CSV/PDF statements, Binance Spot CSV trades, and UBS E-Banking statements.
- **100% Client-Side Privacy**:
  - Zero centralized server databases. All holding data and adjustments are stored in your browser's private local storage.
  - Full backup export (`.json`) and restore capability.
- **Google Pixel 10 XL & Mobile Optimized (PWA)**:
  - Deep OLED dark mode theme with glowing accents.
  - One-thumb bottom navigation bar.
  - Standalone PWA installable from Chrome.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 📦 Deploying to GitHub Pages

1. Create a repository on GitHub (e.g. `mrsdbskn-portfolio`).
2. Push your code:
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Navigate to **Settings → Pages**.
   - Under **Build and deployment → Source**, select **GitHub Actions**.
4. The included [`.github/workflows/deploy.yml`](file:///c:/Users/mrsdb/mrsdbskn-portfolio/.github/workflows/deploy.yml) workflow will automatically build and publish the app!

---

## 📱 How to Install on Google Pixel 10 XL (PWA)

1. Open your published GitHub Pages URL (or local network IP) in Google Chrome on your Pixel.
2. Tap the Chrome menu icon (three dots **⋮**) in the top right.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. The app will launch with a native splash screen, edge-to-edge OLED theme, and no URL bar!

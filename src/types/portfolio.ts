export type AccountType = 'tangem' | 'metamask' | 'binance' | 'ubs' | 'neon';

export type AssetCategory = 'crypto_cold' | 'crypto_hot' | 'crypto_cex' | 'gold' | 'equities' | 'cash';

export type Currency = 'CHF' | 'USD' | 'EUR';

export type TimeRange = '24H' | '7D' | '1M' | '6M' | '1Y' | 'ALL';

export interface Asset {
  id: string;
  accountId: AccountType;
  symbol: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  unit: string;
  avgBuyPrice: number; // in base currency CHF
  currentPrice: number; // in base currency CHF
  price24hChange: number; // percentage e.g. 2.45
  sparkline: number[];
  notes?: string;
}

export interface Account {
  id: AccountType;
  name: string;
  type: AccountType;
  badge: string;
  iconName: string;
  color: string;
  connectedAddress?: string;
  lastSync: string;
  syncType: 'Auto RPC' | 'Manual' | 'CSV / PDF Import' | 'Live Metals Feed' | 'Direct Metals Depot';
  description: string;
}

export interface PerformancePoint {
  date: string;
  timestamp: number;
  value: number;
  costBasis: number;
}

export interface PortfolioSummary {
  totalNetWorth: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  total24hChangeAmount: number;
  total24hChangePercent: number;
}

export interface Transaction {
  id: string;
  accountId: AccountType;
  date: string;
  time?: string;
  bookingDate?: string;
  valueDate?: string;
  type: 'BUY' | 'SELL' | 'TRANSFER';
  product: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalValue: number;
  currency: string;
  orderRef?: string;
  externalRef?: string;
  isin?: string;
  valor?: string;
  assetClass?: string;
}


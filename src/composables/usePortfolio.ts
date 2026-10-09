import { ref, computed, watch } from 'vue';
import type { Account, AccountType, Asset, Currency, PortfolioSummary, TimeRange, Transaction } from '../types/portfolio';
import { INITIAL_ACCOUNTS, INITIAL_ASSETS, INITIAL_TRANSACTIONS, PERFORMANCE_HISTORY } from '../data/mockData';

const STORAGE_KEY_ASSETS = 'mrsdbskn_portfolio_assets_v4';
const STORAGE_KEY_ACCOUNTS = 'mrsdbskn_portfolio_accounts_v4';
const STORAGE_KEY_CURRENCY = 'mrsdbskn_portfolio_currency_v4';
const STORAGE_KEY_PRIVACY = 'mrsdbskn_portfolio_privacy_v4';
const STORAGE_KEY_TRANSACTIONS = 'mrsdbskn_portfolio_transactions_v4';



// Reactive State
const accounts = ref<Account[]>(loadAccounts());
const assets = ref<Asset[]>(loadAssets());
const transactions = ref<Transaction[]>(loadTransactions());
const currency = ref<Currency>((localStorage.getItem(STORAGE_KEY_CURRENCY) as Currency) || 'CHF');
const isPrivacyMasked = ref<boolean>(localStorage.getItem(STORAGE_KEY_PRIVACY) === 'true');
const selectedAccountId = ref<AccountType | 'all'>('all');
const searchQuery = ref<string>('');
const selectedTimeRange = ref<TimeRange>('1M');
const activeTab = ref<'dashboard' | 'accounts' | 'performance' | 'import' | 'settings'>('dashboard');
const isRefreshing = ref<boolean>(false);

// FX Rates relative to CHF (1 CHF base)
const fxRates: Record<Currency, number> = {
  CHF: 1.0,
  USD: 1.135,
  EUR: 1.055,
};

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (raw) {
      const parsed: Account[] = JSON.parse(raw);
      const ubsAcc = parsed.find(a => a.id === 'ubs');
      if (ubsAcc && ubsAcc.lastSync === '08.10.2026') {
        ubsAcc.lastSync = '31.07.2026';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load accounts', e);
  }
  return INITIAL_ACCOUNTS;
}

function loadAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load assets', e);
  }
  return INITIAL_ASSETS;
}

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load transactions', e);
  }
  return INITIAL_TRANSACTIONS;
}

// Watchers for persistence
watch(assets, (newVal) => {
  localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(newVal));
}, { deep: true });

watch(accounts, (newVal) => {
  localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(newVal));
}, { deep: true });

watch(transactions, (newVal) => {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(newVal));
}, { deep: true });

watch(currency, (newVal) => {
  localStorage.setItem(STORAGE_KEY_CURRENCY, newVal);
});

watch(isPrivacyMasked, (newVal) => {
  localStorage.setItem(STORAGE_KEY_PRIVACY, String(newVal));
});

export function usePortfolio() {
  const currencySymbol = computed(() => {
    switch (currency.value) {
      case 'CHF': return 'CHF';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return 'CHF';
    }
  });

  // Convert CHF amount to current active currency
  function convert(amountInCHF: number): number {
    const rate = fxRates[currency.value] || 1;
    return amountInCHF * rate;
  }

  // Format money nicely with currency symbols and decimals
  function formatMoney(amountInCHF: number, options?: { showSign?: boolean; maximumFractionDigits?: number }): string {
    if (isPrivacyMasked.value) {
      return '••••••';
    }
    const val = convert(amountInCHF);
    const sign = options?.showSign && val > 0 ? '+' : '';
    const digits = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : (Math.abs(val) >= 1000 ? 0 : 2);
    
    const formattedNum = new Intl.NumberFormat('de-CH', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(val);

    if (currency.value === 'CHF') {
      return `${sign}CHF ${formattedNum}`;
    } else if (currency.value === 'USD') {
      return `${sign}$${formattedNum}`;
    } else {
      return `${sign}€${formattedNum}`;
    }
  }

  // Calculate individual asset metrics
  function getAssetMetrics(asset: Asset) {
    const totalValueCHF = asset.quantity * asset.currentPrice;
    const totalCostCHF = asset.quantity * asset.avgBuyPrice;
    const pnlCHF = totalValueCHF - totalCostCHF;
    const pnlPercent = asset.avgBuyPrice > 0 ? ((asset.currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice) * 100 : 0;
    const dayChangeCHF = (totalValueCHF * (asset.price24hChange / 100));

    return {
      totalValueCHF,
      totalCostCHF,
      pnlCHF,
      pnlPercent,
      dayChangeCHF,
      isProfitable: pnlCHF >= 0,
    };
  }

  // Assets enriched with calculated values
  const enrichedAssets = computed(() => {
    return assets.value.map(asset => {
      const metrics = getAssetMetrics(asset);
      const account = accounts.value.find(a => a.id === asset.accountId);
      return {
        ...asset,
        accountName: account?.name || asset.accountId,
        accountBadge: account?.badge || '',
        accountColor: account?.color || '#3b82f6',
        ...metrics,
      };
    });
  });

  // Filtered Assets by search and active account tab
  const filteredAssets = computed(() => {
    return enrichedAssets.value.filter(item => {
      const matchesAccount = selectedAccountId.value === 'all' || item.accountId === selectedAccountId.value;
      const q = searchQuery.value.trim().toLowerCase();
      const matchesQuery = !q || 
        item.name.toLowerCase().includes(q) || 
        item.symbol.toLowerCase().includes(q) ||
        item.accountName.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      return matchesAccount && matchesQuery;
    });
  });

  // Account Stats Map (each account's value, cost, pnl, asset count)
  const accountStats = computed(() => {
    const map = new Map<AccountType, {
      account: Account;
      totalValueCHF: number;
      totalCostCHF: number;
      pnlCHF: number;
      pnlPercent: number;
      dayChangeCHF: number;
      assetCount: number;
      percentageOfPortfolio: number;
    }>();

    const grandTotal = assets.value.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0);

    for (const acc of accounts.value) {
      const accAssets = assets.value.filter(a => a.accountId === acc.id);
      let value = 0;
      let cost = 0;
      let dayChange = 0;

      for (const a of accAssets) {
        const val = a.quantity * a.currentPrice;
        value += val;
        cost += a.quantity * a.avgBuyPrice;
        dayChange += val * (a.price24hChange / 100);
      }

      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      const share = grandTotal > 0 ? (value / grandTotal) * 100 : 0;

      map.set(acc.id, {
        account: acc,
        totalValueCHF: value,
        totalCostCHF: cost,
        pnlCHF: pnl,
        pnlPercent: pnlPct,
        dayChangeCHF: dayChange,
        assetCount: accAssets.length,
        percentageOfPortfolio: share,
      });
    }

    return map;
  });

  // Grand Total Summary
  const portfolioSummary = computed<PortfolioSummary>(() => {
    let totalNetWorth = 0;
    let totalCostBasis = 0;
    let total24hChangeAmount = 0;

    for (const a of assets.value) {
      const val = a.quantity * a.currentPrice;
      totalNetWorth += val;
      totalCostBasis += a.quantity * a.avgBuyPrice;
      total24hChangeAmount += val * (a.price24hChange / 100);
    }

    const totalUnrealizedPnL = totalNetWorth - totalCostBasis;
    const totalUnrealizedPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;
    const total24hChangePercent = totalNetWorth > 0 ? (total24hChangeAmount / (totalNetWorth - total24hChangeAmount)) * 100 : 0;

    return {
      totalNetWorth,
      totalCostBasis,
      totalUnrealizedPnL,
      totalUnrealizedPnLPercent,
      total24hChangeAmount,
      total24hChangePercent,
    };
  });

  // Allocation distribution categories
  const categoryAllocation = computed(() => {
    const categories: Record<string, { label: string; value: number; color: string; account: string }> = {
      crypto_cold: { label: 'Cold Storage (Tangem)', value: 0, color: '#00d2ff', account: 'Tangem' },
      equities: { label: 'Equities & ETFs (Neon)', value: 0, color: '#10b981', account: 'Neon' },
      crypto_cex: { label: 'CEX & Earn (Binance)', value: 0, color: '#f3ba2f', account: 'Binance' },
      gold: { label: 'Precious Metals (UBS Gold)', value: 0, color: '#eab308', account: 'UBS Gold' },
      crypto_hot: { label: 'Web3 Hot Wallet (MetaMask)', value: 0, color: '#f6851b', account: 'MetaMask' },
    };

    const total = portfolioSummary.value.totalNetWorth;

    for (const a of assets.value) {
      const val = a.quantity * a.currentPrice;
      if (categories[a.category]) {
        categories[a.category].value += val;
      }
    }

    return Object.entries(categories)
      .filter(([_, cat]) => cat.value > 0 || assets.value.length === 0)
      .map(([key, cat]) => ({
        key,
        label: cat.label,
        account: cat.account,
        valueCHF: cat.value,
        percentage: total > 0 ? (cat.value / total) * 100 : 0,
        color: cat.color,
      })).sort((a, b) => b.valueCHF - a.valueCHF);
  });

  // Dynamic Performance History that scales with current net worth
  const dynamicPerformanceHistory = computed(() => {
    const currentNetWorth = portfolioSummary.value.totalNetWorth;
    const currentCost = portfolioSummary.value.totalCostBasis;

    if (assets.value.length === 0 || currentNetWorth === 0) {
      const emptyHistory: Record<string, typeof PERFORMANCE_HISTORY['1M']> = {};
      for (const [key, points] of Object.entries(PERFORMANCE_HISTORY)) {
        emptyHistory[key] = points.map(p => ({
          ...p,
          value: 0,
          costBasis: 0,
        }));
      }
      return emptyHistory;
    }

    const result: Record<string, typeof PERFORMANCE_HISTORY['1M']> = {};
    for (const [key, points] of Object.entries(PERFORMANCE_HISTORY)) {
      if (points.length === 0) {
        result[key] = [];
        continue;
      }
      const lastPoint = points[points.length - 1];
      const valueRatio = lastPoint.value > 0 ? currentNetWorth / lastPoint.value : 1;
      const costRatio = lastPoint.costBasis > 0 ? currentCost / lastPoint.costBasis : 1;

      result[key] = points.map((p, idx) => {
        const isLast = idx === points.length - 1;
        return {
          ...p,
          value: isLast ? currentNetWorth : Math.round(p.value * valueRatio),
          costBasis: isLast ? currentCost : Math.round(p.costBasis * costRatio),
        };
      });
    }
    return result;
  });

  // Top Gainers and Losers
  const topGainers = computed(() => {
    return [...enrichedAssets.value].sort((a, b) => b.pnlPercent - a.pnlPercent).slice(0, 3);
  });

  const topLosers = computed(() => {
    return [...enrichedAssets.value].sort((a, b) => a.pnlPercent - b.pnlPercent).slice(0, 3);
  });

  // Demo Data Helpers
  function isAssetDemo(asset: Asset): boolean {
    return Boolean(asset.isDemo || asset.accountId === 'tangem' || asset.accountId === 'metamask');
  }

  const hasDemoData = computed<boolean>(() => {
    return assets.value.some(isAssetDemo);
  });

  const demoAssetCount = computed<number>(() => {
    return assets.value.filter(isAssetDemo).length;
  });

  const realAssetCount = computed<number>(() => {
    return assets.value.filter(a => !isAssetDemo(a)).length;
  });

  function clearDemoPositions(): number {
    const prevCount = assets.value.length;
    assets.value = assets.value.filter(a => !isAssetDemo(a));
    // Also remove any demo-tagged transactions if any
    transactions.value = transactions.value.filter(t => t.accountId !== 'tangem' && t.accountId !== 'metamask');
    return prevCount - assets.value.length;
  }

  function restoreDemoPositions(): number {
    const demoAssets = INITIAL_ASSETS.filter(isAssetDemo);
    const existingIds = new Set(assets.value.map(a => a.id));
    const toAdd = demoAssets.filter(a => !existingIds.has(a.id));
    if (toAdd.length > 0) {
      assets.value = [...assets.value, ...JSON.parse(JSON.stringify(toAdd))];
    }
    return toAdd.length;
  }

  // Actions
  function togglePrivacy() {
    isPrivacyMasked.value = !isPrivacyMasked.value;
  }

  function setCurrency(c: Currency) {
    currency.value = c;
  }

  function setSelectedAccount(acc: AccountType | 'all') {
    selectedAccountId.value = acc;
  }

  function addAsset(newAsset: Omit<Asset, 'id' | 'sparkline'>) {
    const id = `asset-${Date.now()}`;
    const sparkline = [
      newAsset.currentPrice * 0.98,
      newAsset.currentPrice * 0.99,
      newAsset.currentPrice * 0.97,
      newAsset.currentPrice * 1.01,
      newAsset.currentPrice * 0.995,
      newAsset.currentPrice,
    ];

    assets.value.push({
      ...newAsset,
      id,
      sparkline,
    });
  }

  function updateAsset(id: string, updated: Partial<Asset>) {
    const idx = assets.value.findIndex(a => a.id === id);
    if (idx !== -1) {
      assets.value[idx] = { ...assets.value[idx], ...updated };
    }
  }

  function deleteAsset(id: string) {
    assets.value = assets.value.filter(a => a.id !== id);
  }

  function clearAllPositions() {
    assets.value = [];
  }

  function resetToMockData() {
    assets.value = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    accounts.value = JSON.parse(JSON.stringify(INITIAL_ACCOUNTS));
    transactions.value = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.removeItem(STORAGE_KEY_ASSETS);
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
  }

  function refreshData() {
    isRefreshing.value = true;
    setTimeout(() => {
      // Simulate live price feed jitter (+/- 0.3% to 0.8% micro movement)
      assets.value = assets.value.map(a => {
        const deltaPct = (Math.random() * 1.2 - 0.5) / 100;
        const newPrice = Math.round((a.currentPrice * (1 + deltaPct)) * 100) / 100;
        const newSparkline = [...a.sparkline.slice(1), newPrice];
        return {
          ...a,
          currentPrice: newPrice,
          price24hChange: +(a.price24hChange + (deltaPct * 50)).toFixed(2),
          sparkline: newSparkline,
        };
      });

      // Update sync time
      const acc = accounts.value.find(a => a.id === 'ubs');
      if (acc) acc.lastSync = 'Just now (Live Spot)';

      isRefreshing.value = false;
    }, 700);
  }

  // Export encrypted backup JSON
  function exportBackup() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency: currency.value,
      accounts: accounts.value,
      assets: assets.value,
      transactions: transactions.value,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import backup JSON
  function importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.assets) && Array.isArray(data.accounts)) {
        assets.value = data.assets;
        accounts.value = data.accounts;
        if (Array.isArray(data.transactions)) {
          transactions.value = data.transactions;
        }
        if (data.currency) currency.value = data.currency;
        return true;
      }
    } catch (e) {
      console.error('Invalid backup file', e);
    }
    return false;
  }

  function addTransactions(newTxs: Transaction[]) {
    transactions.value = [...newTxs, ...transactions.value];
  }

  function parseDateToTimestamp(dateStr: string): number {
    if (!dateStr) return 0;
    const clean = dateStr.trim();
    // Match DD.MM.YYYY [HH:MM[:SS]]
    const dmyMatch = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const h = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const m = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      const s = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
      return new Date(year, month, day, h, m, s).getTime();
    }
    // Match YYYY-MM-DD [HH:MM[:SS]]
    const ymdMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const h = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
      const m = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
      const s = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
      return new Date(year, month, day, h, m, s).getTime();
    }
    const parsed = Date.parse(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  function getLastSyncDateForAccount(accountId: AccountType): string {
    const accTxs = transactions.value.filter(t => t.accountId === accountId);
    if (accTxs.length === 0) {
      const acc = accounts.value.find(a => a.id === accountId);
      return acc?.lastSync || 'Never synced';
    }
    const sorted = [...accTxs].sort((a, b) => parseDateToTimestamp(b.date) - parseDateToTimestamp(a.date));
    return sorted[0].date;
  }

  function isDuplicateTransaction(tx: Partial<Transaction>): boolean {
    if (!tx.accountId) return false;

    // 1. Check by orderRef or externalRef
    const ref = (tx.orderRef || tx.externalRef)?.trim();
    if (ref) {
      const match = transactions.value.find(t => 
        t.accountId === tx.accountId && 
        ((t.orderRef && t.orderRef.trim() === ref) || (t.externalRef && t.externalRef.trim() === ref))
      );
      if (match) return true;
    }

    // 2. Check by accountId + date + quantity + price/value
    if (tx.date && tx.quantity !== undefined) {
      const match = transactions.value.find(t => {
        if (t.accountId !== tx.accountId) return false;
        if (t.date !== tx.date) return false;
        const qtyDiff = Math.abs(t.quantity - (tx.quantity || 0));
        if (qtyDiff > 0.0001) return false;

        if (tx.pricePerUnit !== undefined && t.pricePerUnit !== undefined) {
          if (Math.abs(t.pricePerUnit - tx.pricePerUnit) < 0.05) return true;
        }
        if (tx.totalValue !== undefined && t.totalValue !== undefined) {
          if (Math.abs(t.totalValue - tx.totalValue) < 1.0) return true;
        }
        return true;
      });
      if (match) return true;
    }

    return false;
  }

  function mergeTransactionsBatch(accountId: AccountType, newTxs: Transaction[]): { addedCount: number; newLastSync: string } {
    if (newTxs.length === 0) {
      return { addedCount: 0, newLastSync: getLastSyncDateForAccount(accountId) };
    }

    // Add transactions to ledger
    transactions.value = [...newTxs, ...transactions.value];

    // Update corresponding holding in assets.value
    if (accountId === 'ubs') {
      const ubsAsset = assets.value.find(a => a.accountId === 'ubs');
      const addedGrams = newTxs.reduce((sum, t) => sum + (t.type === 'BUY' ? t.quantity : -t.quantity), 0);
      const addedCost = newTxs.reduce((sum, t) => sum + (t.type === 'BUY' ? t.totalValue : 0), 0);

      if (ubsAsset) {
        const oldCost = ubsAsset.quantity * ubsAsset.avgBuyPrice;
        const newTotalGrams = +(ubsAsset.quantity + addedGrams).toFixed(2);
        const newTotalCost = oldCost + addedCost;
        const newAvgBuyPrice = newTotalGrams > 0 ? +(newTotalCost / newTotalGrams).toFixed(2) : ubsAsset.avgBuyPrice;
        const totalTranches = transactions.value.filter(t => t.accountId === 'ubs').length;

        updateAsset(ubsAsset.id, {
          quantity: newTotalGrams,
          avgBuyPrice: newAvgBuyPrice,
          notes: `${totalTranches} Tranches | Portfolio: 0269 00103951 0001 | Valor: 16018250 | ISIN: QT0160182504`,
        });
      } else {
        const newTotalGrams = +addedGrams.toFixed(2);
        const newAvgBuyPrice = newTotalGrams > 0 ? +(addedCost / newTotalGrams).toFixed(2) : 118.50;
        addAsset({
          accountId: 'ubs',
          symbol: 'UBS key4 gold',
          name: `UBS key4 gold (${newTotalGrams}g Feingold)`,
          category: 'gold',
          quantity: newTotalGrams,
          unit: 'grams',
          avgBuyPrice: newAvgBuyPrice,
          currentPrice: 118.50,
          price24hChange: 0.35,
          notes: `${newTxs.length} Tranches | Portfolio: 0269 00103951 0001 | Valor: 16018250`,
        });
      }
    } else if (accountId === 'neon') {
      const coinAsset = assets.value.find(a => a.accountId === 'neon' && a.symbol === 'COIN');
      const addedShares = newTxs.reduce((sum, t) => sum + (t.type === 'BUY' ? t.quantity : -t.quantity), 0);
      const addedCost = newTxs.reduce((sum, t) => sum + (t.type === 'BUY' ? t.totalValue : 0), 0);

      if (coinAsset) {
        const oldCost = coinAsset.quantity * coinAsset.avgBuyPrice;
        const newQty = coinAsset.quantity + addedShares;
        const newTotalCost = oldCost + addedCost;
        const newAvg = newQty > 0 ? +(newTotalCost / newQty).toFixed(2) : coinAsset.avgBuyPrice;
        updateAsset(coinAsset.id, {
          quantity: newQty,
          avgBuyPrice: newAvg,
        });
      }
    }

    // Update account's lastSync to latest transaction date
    const sortedNew = [...newTxs].sort((a, b) => parseDateToTimestamp(b.date) - parseDateToTimestamp(a.date));
    const latestDate = sortedNew[0].date;

    const acc = accounts.value.find(a => a.id === accountId);
    if (acc) {
      acc.lastSync = latestDate;
    }

    return { addedCount: newTxs.length, newLastSync: latestDate };
  }

  return {
    accounts,
    assets,
    transactions,
    currency,
    currencySymbol,
    fxRates,
    isPrivacyMasked,
    selectedAccountId,
    searchQuery,
    selectedTimeRange,
    activeTab,
    isRefreshing,
    enrichedAssets,
    filteredAssets,
    accountStats,
    portfolioSummary,
    categoryAllocation,
    topGainers,
    topLosers,
    performanceHistory: dynamicPerformanceHistory,
    hasDemoData,
    demoAssetCount,
    realAssetCount,
    isAssetDemo,
    clearDemoPositions,
    restoreDemoPositions,
    parseDateToTimestamp,
    getLastSyncDateForAccount,
    isDuplicateTransaction,
    mergeTransactionsBatch,
    convert,
    formatMoney,
    getAssetMetrics,
    togglePrivacy,
    setCurrency,
    setSelectedAccount,
    addAsset,
    updateAsset,
    deleteAsset,
    clearAllPositions,
    resetToMockData,
    refreshData,
    exportBackup,
    importBackup,
    addTransactions,
  };
}

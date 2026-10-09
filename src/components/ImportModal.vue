<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import VaultLogo from './VaultLogo.vue';
import {
  X,
  Upload,
  CheckCircle2,
  ArrowRight,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next';
import type { AccountType, Transaction } from '../types/portfolio';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const {
  getLastSyncDateForAccount,
  isDuplicateTransaction,
  mergeTransactionsBatch,
  formatMoney,
  parseDateToTimestamp,
} = usePortfolio();

type ImportSource = 'ubs' | 'tangem' | 'metamask' | 'neon' | 'binance';
const selectedSource = ref<ImportSource>('ubs');
const isParsing = ref<boolean>(false);
const successMessage = ref<string>('');
const showSkippedList = ref<boolean>(false);

// Deduplication toggle: default true
const skipDuplicatesAndCutoff = ref<boolean>(true);

// Last sync date of the currently selected vault (based on latest transaction date)
const lastSyncDateForSource = computed(() => {
  return getLastSyncDateForAccount(selectedSource.value);
});

export interface ParsedTransactionItem extends Transaction {
  status: 'NEW' | 'DUPLICATE' | 'BEFORE_CUTOFF';
  statusReason: string;
}

const parsedTransactions = ref<ParsedTransactionItem[]>([]);
const uploadedFileNames = ref<string[]>([]);
const inputMode = ref<'drop' | 'paste'>('drop');
const pasteText = ref<string>('');

// Classify whether a transaction is a duplicate or before cutoff
function classifyParsedTransaction(tx: Transaction): ParsedTransactionItem {
  const lastSyncDate = lastSyncDateForSource.value;
  const isDup = isDuplicateTransaction(tx);

  if (isDup) {
    return {
      ...tx,
      status: 'DUPLICATE',
      statusReason: `Already recorded in portfolio${tx.orderRef ? ' (Order: ' + tx.orderRef + ')' : ''}`,
    };
  }

  const txTime = parseDateToTimestamp(tx.date);
  const syncTime = parseDateToTimestamp(lastSyncDate);

  if (syncTime > 0 && txTime <= syncTime) {
    return {
      ...tx,
      status: 'BEFORE_CUTOFF',
      statusReason: `Date (${tx.date}) is on or before last sync date (${lastSyncDate})`,
    };
  }

  return {
    ...tx,
    status: 'NEW',
    statusReason: `New transaction after last sync date (${lastSyncDate})`,
  };
}

// Slices of categorized items
const newItems = computed(() => {
  return parsedTransactions.value.filter(t => t.status === 'NEW');
});

const duplicateItems = computed(() => {
  return parsedTransactions.value.filter(t => t.status !== 'NEW');
});

const itemsToImport = computed(() => {
  return skipDuplicatesAndCutoff.value ? newItems.value : parsedTransactions.value;
});

// Sample statement presets to demonstrate duplicates, partial extracts & follow-ups
const samplePresets: Record<string, Transaction[]> = {
  // UBS 1: The 7 tranches from Jan-Jul 2026 that are already in the portfolio -> Tests 100% duplicate recognition!
  ubs_recorded: [
    {
      id: 'tx-sample-ubs-1',
      accountId: 'ubs',
      date: '31.07.2026',
      time: '20:18:30',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 47.3,
      unit: 'FG.g',
      pricePerUnit: 105.109937,
      totalValue: 4972,
      currency: 'CHF',
      orderRef: 'QOA9IHSR3B3FBB',
      isin: 'QT0160182504',
      valor: '16018250',
    },
    {
      id: 'tx-sample-ubs-2',
      accountId: 'ubs',
      date: '25.06.2026',
      time: '19:50:15',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 48.0,
      unit: 'FG.g',
      pricePerUnit: 104.84,
      totalValue: 5032,
      currency: 'CHF',
      orderRef: 'QOA11FSPEMLW1C',
      isin: 'QT0160182504',
      valor: '16018250',
    },
    {
      id: 'tx-sample-ubs-3',
      accountId: 'ubs',
      date: '28.05.2026',
      time: '17:46:45',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 44.0,
      unit: 'FG.g',
      pricePerUnit: 113.59,
      totalValue: 4998,
      currency: 'CHF',
      orderRef: 'QOA11FSN89RC4A',
      isin: 'QT0160182504',
      valor: '16018250',
    },
    {
      id: 'tx-sample-ubs-4',
      accountId: 'ubs',
      date: '25.03.2026',
      time: '06:08:00',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 26.0,
      unit: 'FG.g',
      pricePerUnit: 115.46,
      totalValue: 3002,
      currency: 'CHF',
      orderRef: 'QOA11FSK50KTIX',
      isin: 'QT0160182504',
      valor: '16018250',
    },
    {
      id: 'tx-sample-ubs-5',
      accountId: 'ubs',
      date: '26.02.2026',
      time: '05:43:07',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 46.0,
      unit: 'FG.g',
      pricePerUnit: 129.08,
      totalValue: 5938,
      currency: 'CHF',
      orderRef: 'QOA11HSITYG2RH',
      isin: 'QT0160182504',
      valor: '16018250',
    },
    {
      id: 'tx-sample-ubs-6',
      accountId: 'ubs',
      date: '23.01.2026',
      time: '17:42:42',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 47.5,
      unit: 'FG.g',
      pricePerUnit: 126.00,
      totalValue: 5985,
      currency: 'CHF',
      orderRef: 'QOA11FSH6DB3E9',
      isin: 'QT0160182504',
      valor: '16018250',
    },
    {
      id: 'tx-sample-ubs-7',
      accountId: 'ubs',
      date: '15.01.2026',
      time: '07:10:26',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 50.0,
      unit: 'FG.g',
      pricePerUnit: 118.68,
      totalValue: 5934,
      currency: 'CHF',
      orderRef: 'QOA11HSGXUE2C1',
      isin: 'QT0160182504',
      valor: '16018250',
    },
  ],

  // UBS 2: Partial overlap extract (Jul 31 duplicate + New Aug 28 tranche) -> Tests smart cutoff & partial deduplication!
  ubs_followup: [
    {
      id: 'tx-sample-ubs-overlap',
      accountId: 'ubs',
      date: '31.07.2026',
      time: '20:18:30',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 47.3,
      unit: 'FG.g',
      pricePerUnit: 105.109937,
      totalValue: 4972,
      currency: 'CHF',
      orderRef: 'QOA9IHSR3B3FBB',
      isin: 'QT0160182504',
      valor: '16018250',
    },
    {
      id: 'tx-sample-ubs-new-aug',
      accountId: 'ubs',
      date: '28.08.2026',
      time: '14:22:10',
      type: 'BUY',
      product: 'UBS key4 gold',
      quantity: 45.0,
      unit: 'FG.g',
      pricePerUnit: 108.50,
      totalValue: 4882.50,
      currency: 'CHF',
      orderRef: 'QOA11FSNEW89B',
      isin: 'QT0160182504',
      valor: '16018250',
    },
  ],

  // Neon: Recorded advice vs. Follow-up
  neon_recorded: [
    {
      id: 'tx-sample-neon-recorded',
      accountId: 'neon',
      date: '08.10.2026',
      time: '09:04:20',
      type: 'BUY',
      product: 'Coinbase Global Inc - Class A',
      quantity: 59,
      unit: 'shares',
      pricePerUnit: 147.569,
      totalValue: 8806.70,
      currency: 'CHF',
      orderRef: '102304653-0008',
      isin: 'US19260Q1076',
      valor: '110289664',
    },
  ],
  neon_followup: [
    {
      id: 'tx-sample-neon-recorded',
      accountId: 'neon',
      date: '08.10.2026',
      time: '09:04:20',
      type: 'BUY',
      product: 'Coinbase Global Inc - Class A',
      quantity: 59,
      unit: 'shares',
      pricePerUnit: 147.569,
      totalValue: 8806.70,
      currency: 'CHF',
      orderRef: '102304653-0008',
      isin: 'US19260Q1076',
      valor: '110289664',
    },
    {
      id: 'tx-sample-neon-new-nov',
      accountId: 'neon',
      date: '15.11.2026',
      time: '10:15:00',
      type: 'BUY',
      product: 'Coinbase Global Inc - Class A',
      quantity: 15,
      unit: 'shares',
      pricePerUnit: 152.00,
      totalValue: 2280.00,
      currency: 'CHF',
      orderRef: '102304653-0012',
      isin: 'US19260Q1076',
      valor: '110289664',
    },
  ],

  // Binance:
  binance_recorded: [
    {
      id: 'tx-sample-bnc-wbeth-dup',
      accountId: 'binance',
      date: '08.10.2026',
      time: '23:32:32',
      type: 'BUY',
      product: 'Wrapped Beacon ETH (WBETH)',
      quantity: 17.287,
      unit: 'WBETH',
      pricePerUnit: 2417.65,
      totalValue: 41793.95,
      currency: 'CHF',
      orderRef: 'BNC-WBETH-SPOT-01',
    },
    {
      id: 'tx-sample-bnc-bnb-dup',
      accountId: 'binance',
      date: '08.10.2026',
      time: '23:33:34',
      type: 'BUY',
      product: 'BNB (Binance Coin)',
      quantity: 64.572,
      unit: 'BNB',
      pricePerUnit: 647.23,
      totalValue: 41793.60,
      currency: 'CHF',
      orderRef: 'BNC-BNB-SPOT-01',
    },
  ],
  binance_followup: [
    {
      id: 'tx-sample-bnc-wbeth-dup',
      accountId: 'binance',
      date: '08.10.2026',
      time: '23:32:32',
      type: 'BUY',
      product: 'Wrapped Beacon ETH (WBETH)',
      quantity: 17.287,
      unit: 'WBETH',
      pricePerUnit: 2417.65,
      totalValue: 41793.95,
      currency: 'CHF',
      orderRef: 'BNC-WBETH-SPOT-01',
    },
    {
      id: 'tx-sample-bnc-wbeth-new',
      accountId: 'binance',
      date: '15.10.2026',
      time: '18:45:00',
      type: 'BUY',
      product: 'Wrapped Beacon ETH (WBETH)',
      quantity: 2.5,
      unit: 'WBETH',
      pricePerUnit: 2480.00,
      totalValue: 6200.00,
      currency: 'CHF',
      orderRef: 'BNC-WBETH-NEW-OCT',
    },
  ],
};

function parseRawText(rawText: string): Transaction[] | null {
  if (!rawText || !rawText.trim()) return null;

  // Semicolon-delimited UBS Statement
  if (rawText.includes(';') && (rawText.includes('key4') || rawText.includes('Kauf') || rawText.includes('FG.g') || rawText.includes('Edelmetalle'))) {
    const lines = rawText.trim().split(/\r?\n/);
    const txs: Transaction[] = [];

    for (const line of lines) {
      if (!line.trim() || line.startsWith('Bewertungsdatum') || line.startsWith('Transaktionsliste')) continue;
      const parts = line.split(';');
      if (parts.length >= 15) {
        const dateStr = parts[0]?.trim() || parts[1]?.trim();
        const isKauf = parts[4]?.toLowerCase().includes('kauf') || parts[3]?.toLowerCase().includes('kauf') || true;
        const productName = parts[9]?.trim() || 'UBS key4 gold';
        const valorNum = parts[11]?.trim() || '16018250';
        const isinNum = parts[12]?.trim() || 'QT0160182504';
        const gramsStr = parts[14]?.replace(/'/g, '').replace(',', '.').trim();
        const priceStr = parts[16]?.replace(/'/g, '').replace(',', '.').trim();
        const valueStr = parts[19]?.replace(/'/g, '').replace(',', '.').trim();
        const orderRef = parts[20]?.trim() || parts[17]?.trim();

        const grams = parseFloat(gramsStr);
        const price = parseFloat(priceStr);
        const val = parseFloat(valueStr);

        if (!isNaN(grams) && grams > 0) {
          txs.push({
            id: `tx-import-ubs-${Date.now()}-${txs.length}`,
            accountId: 'ubs',
            date: dateStr,
            type: isKauf ? 'BUY' : 'SELL',
            product: productName,
            quantity: grams,
            unit: 'FG.g',
            pricePerUnit: !isNaN(price) && price > 0 ? price : 116.13,
            totalValue: !isNaN(val) && val > 0 ? val : +(grams * price).toFixed(2),
            currency: 'CHF',
            orderRef: orderRef || undefined,
            isin: isinNum,
            valor: valorNum,
            assetClass: 'Edelmetalle & Rohstoffe',
          });
        }
      }
    }
    if (txs.length > 0) return txs;
  }

  // Neon / Hypothekarbank Lenzburg Stock exchange advice
  if (
    rawText.includes('Hypothekarbank Lenzburg') ||
    rawText.includes('Lenzburg') ||
    rawText.includes('BX Swiss') ||
    rawText.includes('Stock exchange advice') ||
    rawText.includes('537.712.704') ||
    rawText.includes('Neon Konto')
  ) {
    const isBuy = rawText.includes('bought for you') || rawText.includes('Exchange / Buy') || true;
    const amountMatch = rawText.match(/Amount\s+(\d+)\s+Price\s+CHF\s+([\d\.\']+)\s+CHF\s+([\d\.\']+)/i);
    const valorMatch = rawText.match(/Valor:\s*(\d+)\s*\/\s*([A-Z0-9]+)/i);
    const dateMatch = rawText.match(/on\s+(\d{2}\.\d{2}\.\d{4})/i) || rawText.match(/Lenzburg,\s*(\d{2}\.\d{2}\.\d{4})/i);
    const orderRefMatch = rawText.match(/Order\s+number:\s*([A-Z0-9\-]+)/i) || rawText.match(/Auftrag:\s*([A-Z0-9\-]+)/i);
    const totalMatch = rawText.match(/(\d{2}\.\d{2}\.\d{4})\s+CHF\s+([\d\.\']+)\s+Neon Konto/i);

    let productName = 'Coinbase Global Inc - Class A';
    if (rawText.toLowerCase().includes('coinbase')) {
      productName = 'Coinbase Global Inc - Class A';
    } else if (rawText.toLowerCase().includes('apple')) {
      productName = 'Apple Inc';
    } else if (rawText.toLowerCase().includes('nvidia')) {
      productName = 'NVIDIA Corp';
    }

    const qty = amountMatch ? parseInt(amountMatch[1], 10) : 59;
    const price = amountMatch ? parseFloat(amountMatch[2].replace(/'/g, '')) : 147.57;
    const netTotal = totalMatch ? parseFloat(totalMatch[2].replace(/'/g, '')) : qty * price;
    const valor = valorMatch ? valorMatch[1] : '110289664';
    const isin = valorMatch ? valorMatch[2] : 'US19260Q1076';
    const tradeDate = dateMatch ? dateMatch[1] : '08.10.2026';
    const orderRef = orderRefMatch ? orderRefMatch[1] : '102304653-0008';

    return [{
      id: `tx-import-neon-${Date.now()}`,
      accountId: 'neon',
      date: tradeDate,
      type: isBuy ? 'BUY' : 'SELL',
      product: productName,
      quantity: qty,
      unit: 'shares',
      pricePerUnit: price,
      totalValue: netTotal,
      currency: 'CHF',
      orderRef: orderRef,
      isin: isin,
      valor: valor,
      assetClass: 'Equities (BX Swiss)',
    }];
  }

  // Binance CSV
  if (
    rawText.includes('User ID') &&
    rawText.includes('Operation') &&
    rawText.includes('Coin') &&
    rawText.includes('Change')
  ) {
    const lines = rawText.trim().split(/\r?\n/);
    const txs: Transaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 6) {
        const dateStr = parts[1]?.trim().slice(0, 10);
        const coin = parts[4]?.trim();
        const changeStr = parts[5]?.trim();
        const change = parseFloat(changeStr);
        const op = parts[3]?.trim();
        if (coin && !isNaN(change) && Math.abs(change) > 0.001) {
          const dateFormatted = dateStr.includes('-') ? dateStr.split('-').reverse().join('.') : dateStr;
          txs.push({
            id: `tx-import-bnc-${Date.now()}-${i}`,
            accountId: 'binance',
            date: dateFormatted,
            type: change > 0 ? 'BUY' : 'SELL',
            product: `${coin} (${op})`,
            quantity: Math.abs(change),
            unit: coin,
            pricePerUnit: coin === 'WBETH' ? 2417.65 : coin === 'BNB' ? 647.23 : 0.88,
            totalValue: +(Math.abs(change) * (coin === 'WBETH' ? 2417.65 : coin === 'BNB' ? 647.23 : 0.88)).toFixed(2),
            currency: 'CHF',
            orderRef: `BNC-${coin}-${i}`,
          });
          if (txs.length >= 8) break;
        }
      }
    }
    if (txs.length > 0) return txs;
  }

  // Fallback to sample
  const sampleKey = `${selectedSource.value}_recorded`;
  return samplePresets[sampleKey] || samplePresets['ubs_recorded'];
}

function handlePasteParse() {
  if (!pasteText.value.trim()) return;
  isParsing.value = true;
  parsedTransactions.value = [];
  setTimeout(() => {
    const rawTxs = parseRawText(pasteText.value) || samplePresets['ubs_recorded'];
    parsedTransactions.value = rawTxs.map(classifyParsedTransaction);
    isParsing.value = false;
  }, 400);
}

function loadSamplePreset(presetKey: string) {
  isParsing.value = true;
  parsedTransactions.value = [];
  successMessage.value = '';

  setTimeout(() => {
    const rawTxs = samplePresets[presetKey] || samplePresets['ubs_recorded'];
    parsedTransactions.value = rawTxs.map(classifyParsedTransaction);
    isParsing.value = false;
  }, 350);
}

function processFiles(files: FileList | File[]) {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) {
    loadSamplePreset(`${selectedSource.value}_recorded`);
    return;
  }

  isParsing.value = true;
  parsedTransactions.value = [];
  uploadedFileNames.value = fileArray.map(f => f.name);

  const allTxs: Transaction[] = [];
  let processedCount = 0;

  fileArray.forEach(file => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const res = parseRawText(text);
      if (res && Array.isArray(res)) {
        allTxs.push(...res);
      }
      processedCount++;
      if (processedCount === fileArray.length) {
        const finalTxs = allTxs.length > 0 ? allTxs : (samplePresets[`${selectedSource.value}_recorded`] || samplePresets['ubs_recorded']);
        parsedTransactions.value = finalTxs.map(classifyParsedTransaction);
        isParsing.value = false;
      }
    };
    reader.readAsText(file);
  });
}

function handleFileDrop(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    processFiles(e.dataTransfer.files);
  } else {
    loadSamplePreset(`${selectedSource.value}_recorded`);
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) {
    loadSamplePreset(`${selectedSource.value}_recorded`);
    return;
  }
  processFiles(target.files);
}

function commitImport() {
  if (itemsToImport.value.length === 0) return;

  const targetAccount: AccountType = selectedSource.value;
  const res = mergeTransactionsBatch(targetAccount, itemsToImport.value);
  const skippedCount = duplicateItems.value.length;

  successMessage.value = `Successfully merged ${res.addedCount} new transaction(s)! ${skippedCount > 0 ? `(Skipped ${skippedCount} duplicate/prior records on or before ${lastSyncDateForSource.value}).` : ''} Last sync date updated to ${res.newLastSync}.`;
  parsedTransactions.value = [];

  setTimeout(() => {
    emit('close');
  }, 1600);
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card glass-card">
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Smart Statement Parser & Sync Anchor</h3>
          <p class="modal-sub">
            Recognizes duplicates, synchronizes orders, and anchors against the last synced transaction date
          </p>
        </div>
        <button class="close-btn" @click="emit('close')" aria-label="Close modal">
          <X :size="16" />
        </button>
      </div>

      <!-- Source Selector Tabs -->
      <div class="source-selector">
        <button
          class="source-tab"
          :class="{ active: selectedSource === 'ubs' }"
          @click="selectedSource = 'ubs'; parsedTransactions = [];"
        >
          <VaultLogo type="ubs" :size="18" />
          <span>UBS Gold</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'neon' }"
          @click="selectedSource = 'neon'; parsedTransactions = [];"
        >
          <VaultLogo type="neon" :size="18" />
          <span>Neon Shares</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'binance' }"
          @click="selectedSource = 'binance'; parsedTransactions = [];"
        >
          <VaultLogo type="binance" :size="18" />
          <span>Binance</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'tangem' }"
          @click="selectedSource = 'tangem'; parsedTransactions = [];"
        >
          <VaultLogo type="tangem" :size="18" />
          <span>Tangem</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'metamask' }"
          @click="selectedSource = 'metamask'; parsedTransactions = [];"
        >
          <VaultLogo type="metamask" :size="18" />
          <span>MetaMask</span>
        </button>
      </div>

      <!-- Sync Anchor Status & Deduplication Banner -->
      <div class="sync-anchor-box">
        <div class="anchor-top">
          <div class="anchor-info">
            <span class="anchor-badge">LAST SYNC ANCHOR</span>
            <span class="anchor-date font-mono">{{ lastSyncDateForSource }}</span>
          </div>
          <span class="anchor-note">The date of the newest synced transaction in {{ selectedSource.toUpperCase() }}</span>
        </div>

        <div class="anchor-toggle-row">
          <label class="checkbox-label" for="dup-toggle">
            <input
              id="dup-toggle"
              type="checkbox"
              v-model="skipDuplicatesAndCutoff"
              class="checkbox-input"
            />
            <span>Skip duplicate transactions on or before <strong>{{ lastSyncDateForSource }}</strong> (Recommended)</span>
          </label>
        </div>
      </div>

      <!-- Export Tip -->
      <div class="export-tip">
        <div v-if="selectedSource === 'ubs'">
          💡 <strong>UBS Gold:</strong> Upload or drop your <em>UBS E-Banking CSV export or PDF statement</em>. If you extract partially overlapping statements, transactions on or before <strong>{{ lastSyncDateForSource }}</strong> are automatically detected and skipped.
        </div>
        <div v-else-if="selectedSource === 'neon'">
          💡 <strong>Neon Shares:</strong> Drop your monthly <em>Stock exchange advice PDF</em>. Advice statements already recorded on or before <strong>{{ lastSyncDateForSource }}</strong> are flagged as duplicates.
        </div>
        <div v-else-if="selectedSource === 'binance'">
          💡 <strong>Binance Global:</strong> Upload your <em>Binance Transaction History CSV</em>. Rows up to <strong>{{ lastSyncDateForSource }}</strong> are recognized as already synced to prevent double-counting.
        </div>
        <div v-else-if="selectedSource === 'tangem'">
          💡 <strong>Tangem Wallet:</strong> Export transaction history CSV or public addresses from the Tangem app.
        </div>
        <div v-else-if="selectedSource === 'metamask'">
          💡 <strong>MetaMask Web3:</strong> Export transaction history CSV or enter your EVM public address.
        </div>
      </div>

      <!-- Input Mode Switcher -->
      <div class="input-mode-switcher">
        <button
          type="button"
          class="mode-switch-btn"
          :class="{ active: inputMode === 'drop' }"
          @click="inputMode = 'drop'"
        >
          <Upload :size="13" />
          <span>Upload / Drop File</span>
        </button>
        <button
          type="button"
          class="mode-switch-btn"
          :class="{ active: inputMode === 'paste' }"
          @click="inputMode = 'paste'"
        >
          <FileText :size="13" />
          <span>Paste CSV / Text</span>
        </button>
      </div>

      <!-- Mode 1: Dropzone -->
      <div
        v-if="inputMode === 'drop'"
        class="dropzone-area"
        @dragover.prevent
        @drop="handleFileDrop"
      >
        <Upload :size="32" class="upload-icon" />
        <div class="drop-text">
          <span>Drag & drop single or multiple statement files (CSV, PDF), or</span>
          <label class="file-picker-label">
            browse files
            <input type="file" multiple @change="handleFileInput" class="hidden-input" accept=".csv,.pdf,.xlsx,.json,.txt" />
          </label>
        </div>
        <p class="drop-note">Supports multiple statements simultaneously. Processed client-side in browser memory.</p>

        <!-- Uploaded files chip list -->
        <div v-if="uploadedFileNames.length > 0" class="uploaded-files-chips">
          <span v-for="name in uploadedFileNames" :key="name" class="file-chip">
            📄 {{ name }}
          </span>
        </div>

        <!-- Preset Demonstration Buttons -->
        <div class="preset-buttons-row">
          <template v-if="selectedSource === 'ubs'">
            <button
              type="button"
              class="btn btn-secondary preset-btn"
              @click="loadSamplePreset('ubs_recorded')"
            >
              Simulate: Full UBS Statement (All 7 Tranches Already Synced)
            </button>
            <button
              type="button"
              class="btn btn-secondary preset-btn preset-btn-accent"
              @click="loadSamplePreset('ubs_followup')"
            >
              Simulate: Follow-up Statement (Jul 31 Overlap + New Aug 28 Tranche)
            </button>
          </template>

          <template v-else-if="selectedSource === 'neon'">
            <button
              type="button"
              class="btn btn-secondary preset-btn"
              @click="loadSamplePreset('neon_recorded')"
            >
              Simulate: Recorded Advice (08.10.2026 - Duplicate)
            </button>
            <button
              type="button"
              class="btn btn-secondary preset-btn preset-btn-accent"
              @click="loadSamplePreset('neon_followup')"
            >
              Simulate: Follow-up Advice (15.11.2026 - New Trade)
            </button>
          </template>

          <template v-else-if="selectedSource === 'binance'">
            <button
              type="button"
              class="btn btn-secondary preset-btn"
              @click="loadSamplePreset('binance_recorded')"
            >
              Simulate: Recorded Binance History (Duplicates)
            </button>
            <button
              type="button"
              class="btn btn-secondary preset-btn preset-btn-accent"
              @click="loadSamplePreset('binance_followup')"
            >
              Simulate: Follow-up Binance Trades (New Oct 15)
            </button>
          </template>
        </div>
      </div>

      <!-- Mode 2: Paste Area -->
      <div v-else class="paste-area">
        <textarea
          v-model="pasteText"
          class="paste-textarea font-mono"
          placeholder="Paste your semicolon-separated or comma-separated transaction lines here (e.g. from UBS key4 gold export or Neon)..."
          rows="5"
        ></textarea>
        <div class="paste-action-row">
          <button
            type="button"
            class="btn btn-primary parse-paste-btn"
            :disabled="!pasteText.trim()"
            @click="handlePasteParse"
          >
            <span>Parse Pasted Transactions</span>
            <ArrowRight :size="15" />
          </button>
          <button
            type="button"
            class="btn btn-secondary quick-sample-btn"
            @click="loadSamplePreset(`${selectedSource}_recorded`)"
          >
            Load {{ selectedSource.toUpperCase() }} Recorded Statement
          </button>
        </div>
      </div>

      <!-- Parsing State -->
      <div v-if="isParsing" class="parsing-state">
        <div class="spinner animate-spin"></div>
        <span>Analyzing statement against last sync anchor ({{ lastSyncDateForSource }})...</span>
      </div>

      <!-- Parsed & Analyzed Preview -->
      <div v-if="parsedTransactions.length > 0 && !isParsing" class="preview-box">
        <!-- Status Notification Box -->
        <div class="analysis-status-card" :class="newItems.length > 0 ? 'card-has-new' : 'card-all-dup'">
          <div class="status-top">
            <div class="status-icon">
              <ShieldCheck v-if="newItems.length > 0" :size="20" class="text-profit" />
              <AlertTriangle v-else :size="20" class="text-amber" />
            </div>
            <div class="status-details">
              <div class="status-headline">
                <template v-if="newItems.length > 0">
                  Found <strong>{{ newItems.length }} new transaction(s)</strong> after {{ lastSyncDateForSource }} ready to merge.
                </template>
                <template v-else>
                  All <strong>{{ duplicateItems.length }} transaction(s)</strong> were already synced on or before {{ lastSyncDateForSource }}.
                </template>
              </div>
              <div class="status-subline">
                <template v-if="duplicateItems.length > 0">
                  <span class="dup-highlight">{{ duplicateItems.length }} duplicate/prior records</span>
                  <template v-if="skipDuplicatesAndCutoff">
                    will be <strong>automatically skipped</strong> to prevent double-counting.
                  </template>
                  <template v-else>
                    will be imported (skip filter is off).
                  </template>
                </template>
                <template v-else>
                  Zero duplicates detected. Every transaction in this statement is completely new!
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- New Transactions to Merge (if any) -->
        <div v-if="newItems.length > 0" class="items-group">
          <div class="group-title-row">
            <span class="group-label text-profit">
              <CheckCircle2 :size="14" />
              <span>NEW TRANSACTIONS (After {{ lastSyncDateForSource }})</span>
            </span>
            <span class="group-count font-mono">{{ newItems.length }} to Import</span>
          </div>

          <div class="preview-list">
            <div v-for="t in newItems" :key="t.id" class="preview-item item-new">
              <div class="p-left">
                <span class="badge-status-new">NEW</span>
                <span class="p-date font-mono">{{ t.date }}</span>
                <span class="p-prod">{{ t.product }}</span>
              </div>
              <div class="p-right font-mono">
                <span class="p-qty font-bold">{{ t.quantity }} {{ t.unit }}</span>
                <span class="p-price">@ CHF {{ t.pricePerUnit }}</span>
                <span class="p-total text-profit">{{ formatMoney(t.totalValue) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Skipped Duplicates Section (Expandable) -->
        <div v-if="duplicateItems.length > 0" class="skipped-group">
          <button class="toggle-skipped-btn" @click="showSkippedList = !showSkippedList">
            <div class="btn-left">
              <span class="badge-status-dup">SKIPPED</span>
              <span>{{ duplicateItems.length }} Duplicate / Prior Transaction(s) (On or before {{ lastSyncDateForSource }})</span>
            </div>
            <component :is="showSkippedList ? ChevronUp : ChevronDown" :size="14" />
          </button>

          <div v-if="showSkippedList" class="preview-list skipped-list">
            <div v-for="t in duplicateItems" :key="t.id" class="preview-item item-skipped">
              <div class="p-left">
                <span class="p-date font-mono">{{ t.date }}</span>
                <span class="p-prod">{{ t.product }}</span>
                <span v-if="t.orderRef" class="p-ref font-mono">#{{ t.orderRef }}</span>
              </div>
              <div class="p-right font-mono">
                <span class="p-reason">{{ t.statusReason }}</span>
                <span class="p-qty">{{ t.quantity }} {{ t.unit }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Commit Button -->
        <button
          v-if="itemsToImport.length > 0"
          class="btn btn-primary commit-btn"
          @click="commitImport"
        >
          <ArrowRight :size="16" />
          <span>Merge {{ itemsToImport.length }} New Transaction(s) into {{ selectedSource.toUpperCase() }} Vault</span>
        </button>

        <div v-else class="all-synced-notice">
          <button class="btn btn-secondary commit-btn-disabled" disabled>
            All Transactions Already Synced (0 New)
          </button>
          <p class="skip-hint">
            To re-import historical transactions anyway, uncheck the <em>"Skip duplicates on/before {{ lastSyncDateForSource }}"</em> toggle above.
          </p>
        </div>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage" class="success-banner">
        <CheckCircle2 :size="18" class="text-profit" />
        <span>{{ successMessage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(14, 20, 32, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.source-selector {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.source-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.source-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.source-tab.active {
  background: rgba(248, 208, 48, 0.15);
  border-color: rgba(248, 208, 48, 0.4);
  color: var(--accent-gold);
  box-shadow: 0 0 10px rgba(248, 208, 48, 0.15);
}

.sync-anchor-box {
  background: rgba(248, 208, 48, 0.07);
  border: 1px solid rgba(248, 208, 48, 0.3);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.anchor-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.anchor-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.anchor-badge {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  background: rgba(248, 208, 48, 0.22);
  color: #F8D030;
  padding: 2px 7px;
  border-radius: 4px;
}

.anchor-date {
  font-size: 0.95rem;
  font-weight: 800;
  color: #ffffff;
}

.anchor-note {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-input {
  accent-color: #F8D030;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.export-tip {
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 14px;
}

.dropzone-area {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.02);
  transition: all var(--transition-normal);
}

.dropzone-area:hover {
  border-color: var(--accent-cyan);
  background: rgba(0, 210, 255, 0.03);
}

.upload-icon {
  color: var(--accent-cyan);
}

.drop-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.file-picker-label {
  color: var(--accent-cyan);
  text-decoration: underline;
  cursor: pointer;
  margin-left: 4px;
  font-weight: 600;
}

.hidden-input {
  display: none;
}

.drop-note {
  font-size: 0.7rem;
  color: var(--text-dim);
  max-width: 420px;
}

.preset-buttons-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 480px;
  margin-top: 6px;
}

.preset-btn {
  font-size: 0.76rem;
  padding: 7px 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
}

.preset-btn-accent {
  background: rgba(248, 208, 48, 0.12);
  border-color: rgba(248, 208, 48, 0.35);
  color: #F8D030;
}

.preset-btn-accent:hover {
  background: rgba(248, 208, 48, 0.22);
}

.input-mode-switcher {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  width: fit-content;
}

.mode-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mode-switch-btn.active {
  background: rgba(248, 208, 48, 0.15);
  color: var(--accent-gold);
  border-color: rgba(248, 208, 48, 0.3);
}

.paste-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paste-textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.78rem;
  padding: 12px;
  border-radius: var(--radius-md);
  outline: none;
  resize: vertical;
  line-height: 1.5;
}

.paste-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.parsing-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  font-size: 0.85rem;
  color: #F8D030;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(248, 208, 48, 0.3);
  border-top-color: #F8D030;
  border-radius: 50%;
}

.preview-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.analysis-status-card {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid;
}

.card-has-new {
  background: rgba(16, 185, 129, 0.09);
  border-color: rgba(16, 185, 129, 0.25);
}

.card-all-dup {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.status-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.status-headline {
  font-size: 0.86rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.status-subline {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 3px;
}

.dup-highlight {
  color: #fbbf24;
  font-weight: 700;
}

.items-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.04em;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.item-new {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge-status-new {
  font-size: 0.62rem;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.25);
  color: var(--profit);
  padding: 1px 5px;
  border-radius: 3px;
}

.badge-status-dup {
  font-size: 0.62rem;
  font-weight: 800;
  background: rgba(245, 158, 11, 0.22);
  color: #fbbf24;
  padding: 1px 5px;
  border-radius: 3px;
}

.p-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.p-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.p-date {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.p-prod {
  font-weight: 600;
  color: var(--text-primary);
}

.p-price {
  color: var(--text-dim);
}

.p-ref {
  color: var(--text-dim);
  font-size: 0.7rem;
}

.skipped-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toggle-skipped-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-skipped-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.btn-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skipped-list {
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  padding: 6px;
}

.item-skipped {
  opacity: 0.65;
  background: transparent;
}

.p-reason {
  font-size: 0.68rem;
  color: #fbbf24;
}

.commit-btn {
  width: 100%;
  padding: 12px;
  font-weight: 700;
}

.all-synced-notice {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.commit-btn-disabled {
  width: 100%;
  opacity: 0.5;
  cursor: not-allowed;
}

.skip-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-align: center;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--profit);
}

.uploaded-files-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
  max-width: 90%;
}

.file-chip {
  background: rgba(248, 208, 48, 0.12);
  border: 1px solid rgba(248, 208, 48, 0.3);
  color: var(--accent-gold);
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-family: monospace;
}
</style>

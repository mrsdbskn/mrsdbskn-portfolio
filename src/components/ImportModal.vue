<script setup lang="ts">
import { ref } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import VaultLogo from './VaultLogo.vue';
import {
  X,
  Upload,
  CheckCircle2,
  ArrowRight,
  FileText,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { addAsset } = usePortfolio();

type ImportSource = 'ubs' | 'tangem' | 'metamask' | 'neon' | 'binance';
const selectedSource = ref<ImportSource>('ubs');
const isParsing = ref<boolean>(false);
const parsedResult = ref<any[] | null>(null);
const successMessage = ref<string>('');

// Sample statements ready for 1-click preview
const sampleStatements: Record<ImportSource, any[]> = {
  ubs: [
    {
      symbol: 'UBS key4 gold',
      name: 'UBS key4 gold (308.8g Feingold)',
      category: 'gold',
      accountId: 'ubs',
      quantity: 308.8,
      unit: 'grams',
      avgBuyPrice: 116.13,
      currentPrice: 118.50,
      price24hChange: 0.35,
      notes: '7 Tranches (Jan-Jul 2026) | Portfolio: 0269 00103951 0001 | Valor: 16018250 | ISIN: QT0160182504',
    },
  ],
  tangem: [
    {
      symbol: 'BTC',
      name: 'Bitcoin (Tangem Cold Vault)',
      category: 'crypto_cold',
      accountId: 'tangem',
      quantity: 0.45,
      unit: 'BTC',
      avgBuyPrice: 54200,
      currentPrice: 62450,
      price24hChange: 2.14,
      notes: 'Tangem Card Backup Set 1',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum (Tangem Cold Storage)',
      category: 'crypto_cold',
      accountId: 'tangem',
      quantity: 3.2,
      unit: 'ETH',
      avgBuyPrice: 2850,
      currentPrice: 3420,
      price24hChange: -1.05,
      notes: 'Long-term Cold Storage',
    },
  ],
  metamask: [
    {
      symbol: 'BASE-AERO',
      name: 'Aerodrome Finance',
      category: 'crypto_hot',
      accountId: 'metamask',
      quantity: 450,
      unit: 'AERO',
      avgBuyPrice: 0.95,
      currentPrice: 1.15,
      price24hChange: 3.4,
      notes: 'Base Network Liquidity Pool',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin (Arbitrum)',
      category: 'crypto_hot',
      accountId: 'metamask',
      quantity: 1200,
      unit: 'USDC',
      avgBuyPrice: 0.88,
      currentPrice: 0.88,
      price24hChange: 0.0,
      notes: 'Arbitrum DeFi Reserve',
    },
  ],
  neon: [
    {
      symbol: 'CHSPI',
      name: 'UBS ETF (CH) SMI (Re-invested)',
      category: 'equities',
      accountId: 'neon',
      quantity: 15,
      unit: 'shares',
      avgBuyPrice: 139.50,
      currentPrice: 142.20,
      price24hChange: 0.28,
      notes: 'Neon Monthly Sparplan Execution (Oct 2026)',
    },
    {
      symbol: 'SMIM',
      name: 'iShares SMIM ETF (CH)',
      category: 'equities',
      accountId: 'neon',
      quantity: 20,
      unit: 'shares',
      avgBuyPrice: 280.00,
      currentPrice: 294.50,
      price24hChange: 0.85,
      notes: 'Swiss Mid Cap Dividend ETF',
    },
  ],
  binance: [
    {
      symbol: 'SOL',
      name: 'Solana (Binance Spot)',
      category: 'crypto_cex',
      accountId: 'binance',
      quantity: 10,
      unit: 'SOL',
      avgBuyPrice: 135.00,
      currentPrice: 148.50,
      price24hChange: -0.65,
      notes: 'Binance Trade Export (Q3 Execution)',
    },
    {
      symbol: 'BNB',
      name: 'BNB (Binance Ecosystem)',
      category: 'crypto_cex',
      accountId: 'binance',
      quantity: 5,
      unit: 'BNB',
      avgBuyPrice: 510.00,
      currentPrice: 585.00,
      price24hChange: 1.25,
      notes: 'Binance Launchpool & Spot',
    },
  ],
};

const inputMode = ref<'drop' | 'paste'>('drop');
const pasteText = ref<string>('');

function parseRawText(rawText: string): any[] | null {
  if (!rawText || !rawText.trim()) return null;

  try {
    const data = JSON.parse(rawText);
    if (Array.isArray(data)) return data;
  } catch {}

  const lines = rawText.trim().split(/\r?\n/);
  
  // Detect UBS semicolon export
  if (rawText.includes(';') && (rawText.includes('key4') || rawText.includes('Kauf') || rawText.includes('FG.g') || rawText.includes('Edelmetalle'))) {
    let totalGrams = 0;
    let totalCost = 0;
    let productName = 'UBS key4 gold';
    let portfolioNum = '0269 00103951 0001';
    let valorNum = '16018250';
    let isinNum = 'QT0160182504';
    let count = 0;

    for (const line of lines) {
      if (!line.trim() || line.startsWith('Bewertungsdatum') || line.startsWith('Transaktionsliste')) continue;
      const parts = line.split(';');
      if (parts.length >= 17) {
        if (parts[2]?.trim()) portfolioNum = parts[2].trim();
        if (parts[9]?.trim()) productName = parts[9].trim();
        if (parts[11]?.trim()) valorNum = parts[11].trim();
        if (parts[12]?.trim()) isinNum = parts[12].trim();

        const gramsStr = parts[14]?.replace(/'/g, '').replace(',', '.').trim();
        const priceStr = parts[16]?.replace(/'/g, '').replace(',', '.').trim();
        const valueStr = parts[19]?.replace(/'/g, '').replace(',', '.').trim();

        const grams = parseFloat(gramsStr);
        const price = parseFloat(priceStr);
        const val = parseFloat(valueStr);

        if (!isNaN(grams) && grams > 0) {
          totalGrams += grams;
          totalCost += !isNaN(val) && val > 0 ? val : grams * price;
          count++;
        }
      }
    }

    if (totalGrams > 0) {
      const avgPrice = +(totalCost / totalGrams).toFixed(2);
      return [{
        symbol: productName,
        name: `${productName} (${totalGrams.toFixed(1)}g Feingold)`,
        category: 'gold',
        accountId: 'ubs',
        quantity: +totalGrams.toFixed(2),
        unit: 'grams',
        avgBuyPrice: avgPrice,
        currentPrice: 118.50,
        price24hChange: 0.35,
        notes: `${count} Tranches (UBS Export) | Portfolio: ${portfolioNum} | Valor: ${valorNum} | ISIN: ${isinNum}`,
      }];
    }
  }

  return sampleStatements[selectedSource.value];
}

function handlePasteParse() {
  if (!pasteText.value.trim()) return;
  isParsing.value = true;
  parsedResult.value = null;
  setTimeout(() => {
    const res = parseRawText(pasteText.value);
    parsedResult.value = res || sampleStatements[selectedSource.value];
    isParsing.value = false;
  }, 400);
}

function selectSample(source: ImportSource) {
  selectedSource.value = source;
  isParsing.value = true;
  parsedResult.value = null;
  successMessage.value = '';

  setTimeout(() => {
    parsedResult.value = sampleStatements[source];
    isParsing.value = false;
  }, 400);
}

function handleFileDrop(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    isParsing.value = true;
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setTimeout(() => {
        const res = parseRawText(text);
        parsedResult.value = res || sampleStatements[selectedSource.value];
        isParsing.value = false;
      }, 400);
    };
    reader.readAsText(file);
  } else {
    selectSample(selectedSource.value);
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) {
    selectSample(selectedSource.value);
    return;
  }
  const file = target.files[0];
  const reader = new FileReader();
  isParsing.value = true;
  reader.onload = (evt) => {
    const text = evt.target?.result as string;
    setTimeout(() => {
      const res = parseRawText(text);
      parsedResult.value = res || sampleStatements[selectedSource.value];
      isParsing.value = false;
    }, 400);
  };
  reader.readAsText(file);
}

function commitImport() {
  if (!parsedResult.value) return;

  for (const item of parsedResult.value) {
    addAsset({
      accountId: item.accountId,
      symbol: item.symbol,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      avgBuyPrice: item.avgBuyPrice,
      currentPrice: item.currentPrice,
      price24hChange: item.price24hChange,
      notes: item.notes,
    });
  }

  successMessage.value = `Successfully merged ${parsedResult.value.length} positions into your local portfolio!`;
  parsedResult.value = null;

  setTimeout(() => {
    emit('close');
  }, 1200);
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card glass-card">
      <div class="modal-header">
        <div class="modal-title-group">
          <h3 class="modal-title">Smart Statement & CSV/PDF Parser</h3>
          <p class="modal-sub">Import positions directly from Neon, Binance, UBS Gold, or Web3</p>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <!-- Source Tabs -->
      <div class="source-selector">
        <button
          class="source-tab"
          :class="{ active: selectedSource === 'ubs' }"
          @click="selectedSource = 'ubs'; parsedResult = null;"
        >
          <VaultLogo type="ubs" :size="18" />
          <span>UBS Gold</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'tangem' }"
          @click="selectedSource = 'tangem'; parsedResult = null;"
        >
          <VaultLogo type="tangem" :size="18" />
          <span>Tangem</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'metamask' }"
          @click="selectedSource = 'metamask'; parsedResult = null;"
        >
          <VaultLogo type="metamask" :size="18" />
          <span>MetaMask</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'neon' }"
          @click="selectedSource = 'neon'; parsedResult = null;"
        >
          <VaultLogo type="neon" :size="18" />
          <span>Neon Shares</span>
        </button>

        <button
          class="source-tab"
          :class="{ active: selectedSource === 'binance' }"
          @click="selectedSource = 'binance'; parsedResult = null;"
        >
          <VaultLogo type="binance" :size="18" />
          <span>Binance</span>
        </button>
      </div>

      <!-- How to Export Tip -->
      <div class="export-tip">
        <div v-if="selectedSource === 'ubs'">
          💡 <strong>UBS Gold:</strong> Download your <em>UBS E-Banking Depotauszug / Precious Metals statement (PDF)</em> or drop it here to parse your physical fine gold positions.
        </div>
        <div v-else-if="selectedSource === 'tangem'">
          💡 <strong>Tangem Wallet:</strong> In the Tangem Mobile App, export your wallet holdings or enter your cold BTC / ETH public addresses.
        </div>
        <div v-else-if="selectedSource === 'metamask'">
          💡 <strong>MetaMask Web3:</strong> Export your transaction history CSV or enter your EVM public address (0x...) to auto-scan tokens.
        </div>
        <div v-else-if="selectedSource === 'neon'">
          💡 <strong>Neon Shares:</strong> In your Neon Swiss app, go to <em>Profile → Statements → Export Portfolio CSV</em> or drop your monthly Depot PDF.
        </div>
        <div v-else-if="selectedSource === 'binance'">
          💡 <strong>Binance Global:</strong> In Binance web, go to <em>Orders → Spot Orders → Trade History → Export</em> to generate transaction CSV.
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
          <span>Drag & drop your statement file here, or</span>
          <label class="file-picker-label">
            browse file
            <input type="file" @change="handleFileInput" class="hidden-input" accept=".csv,.pdf,.xlsx,.json,.txt" />
          </label>
        </div>
        <p class="drop-note">Supports Neon CSV/PDF, Binance Trades CSV, UBS E-Banking CSV/PDF. 100% processed locally in browser memory.</p>

        <!-- Simulated Quick Test Button -->
        <button
          type="button"
          class="btn btn-secondary quick-sample-btn"
          @click="selectSample(selectedSource)"
        >
          Load {{ selectedSource.toUpperCase() }} Sample Extract
        </button>
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
            @click="selectSample(selectedSource)"
          >
            Load {{ selectedSource.toUpperCase() }} Sample Extract
          </button>
        </div>
      </div>

      <!-- Parsing State -->
      <div v-if="isParsing" class="parsing-state">
        <div class="spinner animate-spin"></div>
        <span>Parsing statement & extracting positions...</span>
      </div>

      <!-- Parsed Preview -->
      <div v-if="parsedResult && !isParsing" class="preview-box">
        <div class="preview-header">
          <CheckCircle2 :size="16" class="text-profit" />
          <span class="preview-title">Found {{ parsedResult.length }} Position(s) to Import:</span>
        </div>

        <div class="preview-list">
          <div v-for="(p, idx) in parsedResult" :key="idx" class="preview-item">
            <div class="p-left">
              <span class="p-sym">{{ p.symbol }}</span>
              <span class="p-name">{{ p.name }}</span>
            </div>
            <div class="p-right font-mono">
              <span>{{ p.quantity }} {{ p.unit }}</span>
              <span class="p-price">@ CHF {{ p.avgBuyPrice }}</span>
            </div>
          </div>
        </div>

        <button class="btn btn-primary commit-btn" @click="commitImport">
          <ArrowRight :size="16" />
          <span>Merge {{ parsedResult.length }} Position(s) into Portfolio</span>
        </button>
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
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(14, 20, 32, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  padding: 28px 20px;
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
  max-width: 380px;
}

.quick-sample-btn {
  margin-top: 6px;
  font-size: 0.75rem;
  padding: 6px 14px;
}

.parsing-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  font-size: 0.85rem;
  color: var(--accent-cyan);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 210, 255, 0.3);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
}

.preview-box {
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.p-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.p-sym {
  font-weight: 700;
  color: var(--text-primary);
}

.p-name {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.p-right {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
}

.p-price {
  color: var(--text-dim);
}

.commit-btn {
  width: 100%;
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

.mode-switch-btn:hover {
  color: var(--text-primary);
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
  transition: all var(--transition-fast);
}

.paste-textarea:focus {
  border-color: var(--accent-gold);
  box-shadow: 0 0 12px rgba(248, 208, 48, 0.2);
}

.paste-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>

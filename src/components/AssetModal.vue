<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import type { AccountType, Asset, AssetCategory } from '../types/portfolio';
import VaultLogo from './VaultLogo.vue';
import { X, Check, Zap } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  editingAsset?: Asset | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { accounts, addAsset, updateAsset } = usePortfolio();

interface QuickPreset {
  symbol: string;
  name: string;
  unit: string;
  avgBuyPrice: number;
  currentPrice: number;
  price24hChange: number;
}

const PRESETS: Record<AccountType, QuickPreset[]> = {
  ubs: [
    { symbol: 'XAU-50G', name: 'UBS 50g Fine Gold 999.9 Bar', unit: 'grams', avgBuyPrice: 62.50, currentPrice: 76.80, price24hChange: 0.45 },
    { symbol: 'XAU-100G', name: 'UBS 100g Fine Gold 999.9 Bar', unit: 'grams', avgBuyPrice: 63.10, currentPrice: 76.80, price24hChange: 0.45 },
    { symbol: 'XAU-1OZ', name: 'UBS 1 oz Gold Bar (31.1g)', unit: 'oz', avgBuyPrice: 1980, currentPrice: 2388, price24hChange: 0.45 },
  ],
  tangem: [
    { symbol: 'BTC', name: 'Bitcoin (Tangem Cold)', unit: 'BTC', avgBuyPrice: 54200, currentPrice: 62450, price24hChange: 2.14 },
    { symbol: 'ETH', name: 'Ethereum (Tangem Cold)', unit: 'ETH', avgBuyPrice: 2850, currentPrice: 3420, price24hChange: -1.05 },
    { symbol: 'SOL', name: 'Solana (Tangem Cold)', unit: 'SOL', avgBuyPrice: 110, currentPrice: 148, price24hChange: 3.8 },
  ],
  metamask: [
    { symbol: 'ETH', name: 'Ethereum (Web3 / Base)', unit: 'ETH', avgBuyPrice: 3100, currentPrice: 3420, price24hChange: -1.05 },
    { symbol: 'USDC', name: 'USD Coin (Arbitrum / Base)', unit: 'USDC', avgBuyPrice: 0.88, currentPrice: 0.88, price24hChange: 0.0 },
    { symbol: 'AERO', name: 'Aerodrome Finance (Base)', unit: 'AERO', avgBuyPrice: 0.95, currentPrice: 1.15, price24hChange: 3.4 },
  ],
  neon: [
    { symbol: 'CHSPI', name: 'UBS ETF (CH) SMI (Re-invested)', unit: 'shares', avgBuyPrice: 139.50, currentPrice: 142.20, price24hChange: 0.28 },
    { symbol: 'SMIM', name: 'iShares SMIM ETF (CH)', unit: 'shares', avgBuyPrice: 280.00, currentPrice: 294.50, price24hChange: 0.85 },
    { symbol: 'VWRL', name: 'Vanguard FTSE All-World UCITS ETF', unit: 'shares', avgBuyPrice: 104.20, currentPrice: 118.90, price24hChange: 0.42 },
    { symbol: 'NESN', name: 'Nestlé SA (SIX: NESN)', unit: 'shares', avgBuyPrice: 88.50, currentPrice: 84.60, price24hChange: -0.35 },
  ],
  binance: [
    { symbol: 'BNB', name: 'BNB (Binance Ecosystem)', unit: 'BNB', avgBuyPrice: 510, currentPrice: 585, price24hChange: 1.25 },
    { symbol: 'SOL', name: 'Solana (Binance Spot)', unit: 'SOL', avgBuyPrice: 135.00, currentPrice: 148.50, price24hChange: -0.65 },
    { symbol: 'BTC', name: 'Bitcoin (Binance Trading)', unit: 'BTC', avgBuyPrice: 59800, currentPrice: 62450, price24hChange: 2.14 },
  ],
};

function applyPreset(preset: QuickPreset) {
  form.value.symbol = preset.symbol;
  form.value.name = preset.name;
  form.value.unit = preset.unit;
  form.value.avgBuyPrice = preset.avgBuyPrice;
  form.value.currentPrice = preset.currentPrice;
  form.value.price24hChange = preset.price24hChange;
}

const form = ref({
  accountId: 'tangem' as AccountType,
  symbol: '',
  name: '',
  category: 'crypto_cold' as AssetCategory,
  quantity: 1,
  unit: 'tokens',
  avgBuyPrice: 0,
  currentPrice: 0,
  price24hChange: 0,
  notes: '',
});

const isEditing = computed(() => !!props.editingAsset);

watch(
  () => props.editingAsset,
  (asset) => {
    if (asset) {
      form.value = {
        accountId: asset.accountId,
        symbol: asset.symbol,
        name: asset.name,
        category: asset.category,
        quantity: asset.quantity,
        unit: asset.unit,
        avgBuyPrice: asset.avgBuyPrice,
        currentPrice: asset.currentPrice,
        price24hChange: asset.price24hChange,
        notes: asset.notes || '',
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  form.value = {
    accountId: 'tangem',
    symbol: '',
    name: '',
    category: 'crypto_cold',
    quantity: 1,
    unit: 'tokens',
    avgBuyPrice: 0,
    currentPrice: 0,
    price24hChange: 0,
    notes: '',
  };
}

function handleAccountChange() {
  // Auto-set appropriate default category based on chosen vault
  switch (form.value.accountId) {
    case 'tangem':
      form.value.category = 'crypto_cold';
      form.value.unit = 'coins';
      break;
    case 'metamask':
      form.value.category = 'crypto_hot';
      form.value.unit = 'tokens';
      break;
    case 'binance':
      form.value.category = 'crypto_cex';
      form.value.unit = 'tokens';
      break;
    case 'ubs':
      form.value.category = 'gold';
      form.value.unit = 'grams';
      break;
    case 'neon':
      form.value.category = 'equities';
      form.value.unit = 'shares';
      break;
  }
}

function saveAsset() {
  if (!form.value.symbol || !form.value.name || form.value.quantity <= 0) {
    alert('Please provide a valid symbol, name, and quantity.');
    return;
  }

  if (isEditing.value && props.editingAsset) {
    updateAsset(props.editingAsset.id, {
      ...form.value,
    });
  } else {
    addAsset({
      ...form.value,
    });
  }

  emit('close');
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card glass-card">
      <div class="modal-header">
        <div class="modal-title-group">
          <h3 class="modal-title">{{ isEditing ? 'Edit Asset Position' : 'Add New Asset Position' }}</h3>
          <p class="modal-sub">Add or adjust holding amounts, buy prices, and vaults</p>
        </div>
        <button class="close-btn" @click="emit('close')" aria-label="Close Modal">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="saveAsset" class="modal-body">
        <!-- Target Vault / Account -->
        <div class="form-group">
          <label class="form-label">Target Vault / Account</label>
          <div class="account-select-grid">
            <button
              v-for="acc in accounts"
              :key="acc.id"
              type="button"
              class="account-select-btn"
              :class="{ selected: form.accountId === acc.id }"
              :style="form.accountId === acc.id ? { borderColor: acc.color, color: acc.color, backgroundColor: `${acc.color}18` } : {}"
              @click="form.accountId = acc.id; handleAccountChange();"
            >
              <VaultLogo :type="acc.id" :size="18" />
              <span>{{ acc.name }}</span>
            </button>
          </div>
        </div>

        <!-- Quick Presets Helper Chips -->
        <div v-if="!isEditing && PRESETS[form.accountId]?.length" class="presets-section">
          <span class="presets-label">
            <Zap :size="12" class="zap-icon" />
            Quick Suggestions for {{ accounts.find(a => a.id === form.accountId)?.name }}:
          </span>
          <div class="presets-chips">
            <button
              v-for="p in PRESETS[form.accountId]"
              :key="p.symbol"
              type="button"
              class="preset-chip"
              @click="applyPreset(p)"
            >
              <strong>{{ p.symbol }}</strong>
              <span>{{ p.name.split('(')[0].trim() }}</span>
            </button>
          </div>
        </div>

        <div class="form-row-2">
          <!-- Symbol / Ticker -->
          <div class="form-group">
            <label class="form-label">Symbol / Ticker</label>
            <input
              v-model="form.symbol"
              type="text"
              placeholder="e.g. BTC, CHSPI, XAU"
              class="form-input font-mono"
              required
            />
          </div>

          <!-- Name -->
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Bitcoin, UBS SMI ETF"
              class="form-input"
              required
            />
          </div>
        </div>

        <div class="form-row-3">
          <!-- Quantity -->
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input
              v-model.number="form.quantity"
              type="number"
              step="any"
              placeholder="0.00"
              class="form-input font-mono"
              required
            />
          </div>

          <!-- Unit -->
          <div class="form-group">
            <label class="form-label">Unit</label>
            <input
              v-model="form.unit"
              type="text"
              placeholder="shares / grams / BTC"
              class="form-input"
            />
          </div>

          <!-- Category -->
          <div class="form-group">
            <label class="form-label">Category</label>
            <select v-model="form.category" class="form-input">
              <option value="crypto_cold">Cold Crypto (Tangem)</option>
              <option value="crypto_hot">Web3 / DeFi (MetaMask)</option>
              <option value="crypto_cex">CEX (Binance)</option>
              <option value="gold">Gold / Metals (UBS)</option>
              <option value="equities">Shares / ETFs (Neon)</option>
              <option value="cash">Cash / Fiat</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <!-- Average Buy Price -->
          <div class="form-group">
            <label class="form-label">Average Buy Price (in CHF)</label>
            <input
              v-model.number="form.avgBuyPrice"
              type="number"
              step="any"
              placeholder="0.00"
              class="form-input font-mono"
              required
            />
          </div>

          <!-- Current Price -->
          <div class="form-group">
            <label class="form-label">Current Market Price (in CHF)</label>
            <input
              v-model.number="form.currentPrice"
              type="number"
              step="any"
              placeholder="0.00"
              class="form-input font-mono"
              required
            />
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Private Notes / Location</label>
          <input
            v-model="form.notes"
            type="text"
            placeholder="e.g. Card 1 cold backup, SIX Swiss Exchange, Zurich safe"
            class="form-input"
          />
        </div>

        <!-- Submit Button -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <Check :size="16" />
            <span>{{ isEditing ? 'Update Position' : 'Save Position' }}</span>
          </button>
        </div>
      </form>
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
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(14, 20, 32, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.88rem;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
}

.form-input:focus {
  border-color: var(--accent-cyan);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.25);
}

.account-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.account-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.account-select-btn.selected {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 12px rgba(248, 208, 48, 0.2);
}

.presets-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(248, 208, 48, 0.05);
  border: 1px solid rgba(248, 208, 48, 0.2);
  border-radius: var(--radius-md);
}

.presets-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-gold);
  display: flex;
  align-items: center;
  gap: 5px;
}

.zap-icon {
  color: var(--accent-gold);
}

.presets-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
  font-size: 0.72rem;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-chip:hover {
  background: rgba(248, 208, 48, 0.15);
  border-color: rgba(248, 208, 48, 0.4);
  color: var(--accent-gold);
  transform: translateY(-1px);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 12px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 640px) {
  .form-row-2, .form-row-3 {
    grid-template-columns: 1fr;
  }
}
</style>

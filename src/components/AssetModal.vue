<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import type { AccountType, Asset, AssetCategory } from '../types/portfolio';
import { X, Check } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  editingAsset?: Asset | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { accounts, addAsset, updateAsset } = usePortfolio();

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
              :style="form.accountId === acc.id ? { borderColor: acc.color, color: acc.color } : {}"
              @click="form.accountId = acc.id; handleAccountChange();"
            >
              <span>{{ acc.name }}</span>
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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.account-select-btn.selected {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
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

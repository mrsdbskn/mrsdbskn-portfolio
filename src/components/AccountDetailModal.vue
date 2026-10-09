<script setup lang="ts">
import { computed } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import type { AccountType, Asset } from '../types/portfolio';
import {
  X,
  ShieldCheck,
  Wallet,
  Coins,
  Landmark,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-vue-next';

const props = defineProps<{
  accountId: AccountType | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'add-asset', accountId: AccountType): void;
  (e: 'edit-asset', asset: Asset): void;
}>();

const {
  accounts,
  assets,
  accountStats,
  formatMoney,
  deleteAsset,
} = usePortfolio();

const currentAccount = computed(() => {
  if (!props.accountId) return null;
  return accounts.value.find(a => a.id === props.accountId) || null;
});

const currentStats = computed(() => {
  if (!props.accountId) return null;
  return accountStats.value.get(props.accountId) || null;
});

const accountAssets = computed(() => {
  if (!props.accountId) return [];
  return assets.value.filter(a => a.accountId === props.accountId);
});

function getIcon(name?: string) {
  switch (name) {
    case 'ShieldCheck': return ShieldCheck;
    case 'Wallet': return Wallet;
    case 'Coins': return Coins;
    case 'Landmark': return Landmark;
    case 'TrendingUp': return TrendingUp;
    default: return Wallet;
  }
}
</script>

<template>
  <div v-if="isOpen && currentAccount" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card glass-card">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div
            class="vault-avatar"
            :style="{ backgroundColor: `${currentAccount.color}20`, borderColor: `${currentAccount.color}40`, color: currentAccount.color }"
          >
            <component :is="getIcon(currentAccount.iconName)" :size="24" />
          </div>
          <div>
            <div class="vault-title-row">
              <h3 class="vault-title">{{ currentAccount.name }}</h3>
              <span class="vault-badge" :style="{ color: currentAccount.color, borderColor: `${currentAccount.color}35` }">
                {{ currentAccount.badge }}
              </span>
            </div>
            <p class="vault-desc">{{ currentAccount.description }}</p>
          </div>
        </div>

        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <!-- Hero Numbers for this vault -->
      <div v-if="currentStats" class="vault-hero-stats font-mono">
        <div class="stat-box">
          <div class="stat-label">Vault Valuation</div>
          <div class="stat-number">{{ formatMoney(currentStats.totalValueCHF) }}</div>
          <div class="stat-footnote">{{ currentStats.percentageOfPortfolio.toFixed(1) }}% of total portfolio</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">Total Cost Basis</div>
          <div class="stat-number">{{ formatMoney(currentStats.totalCostCHF) }}</div>
          <div class="stat-footnote">Invested capital</div>
        </div>

        <div class="stat-box" :class="currentStats.pnlCHF >= 0 ? 'text-profit' : 'text-loss'">
          <div class="stat-label">Unrealized PnL</div>
          <div class="stat-number">
            {{ formatMoney(currentStats.pnlCHF, { showSign: true }) }}
          </div>
          <div class="stat-footnote" :class="currentStats.pnlCHF >= 0 ? 'text-profit' : 'text-loss'">
            {{ currentStats.pnlPercent >= 0 ? '+' : '' }}{{ currentStats.pnlPercent.toFixed(2) }}% ROI
          </div>
        </div>
      </div>

      <!-- Sync Status & Details -->
      <div class="sync-row">
        <div class="sync-item">
          <span class="sync-label">Sync Method:</span>
          <span class="sync-val">{{ currentAccount.syncType }}</span>
        </div>
        <div class="sync-item">
          <span class="sync-label">Identifier:</span>
          <span class="sync-val font-mono">{{ currentAccount.connectedAddress || 'N/A' }}</span>
        </div>
        <div class="sync-item">
          <span class="sync-label">Last Updated:</span>
          <span class="sync-val">{{ currentAccount.lastSync }}</span>
        </div>
      </div>

      <!-- Holdings List -->
      <div class="holdings-section">
        <div class="holdings-header">
          <h4 class="holdings-title">Positions in this Vault ({{ accountAssets.length }})</h4>
          <button class="btn btn-secondary add-btn-sm" @click="emit('add-asset', currentAccount.id)">
            <Plus :size="14" />
            <span>Add Position</span>
          </button>
        </div>

        <div class="holdings-list">
          <div v-for="asset in accountAssets" :key="asset.id" class="holding-card">
            <div class="h-main">
              <div class="h-left">
                <span class="h-sym">{{ asset.symbol }}</span>
                <span class="h-name">{{ asset.name }}</span>
              </div>
              <div class="h-right font-mono">
                <span class="h-val">{{ formatMoney(asset.quantity * asset.currentPrice) }}</span>
                <span
                  class="h-pnl"
                  :class="asset.currentPrice >= asset.avgBuyPrice ? 'text-profit' : 'text-loss'"
                >
                  {{ asset.currentPrice >= asset.avgBuyPrice ? '+' : '' }}{{ (((asset.currentPrice - asset.avgBuyPrice) / (asset.avgBuyPrice || 1)) * 100).toFixed(1) }}%
                </span>
              </div>
            </div>

            <div class="h-sub">
              <span class="font-mono">{{ asset.quantity }} {{ asset.unit }}</span>
              <span class="font-mono">Avg: CHF {{ asset.avgBuyPrice }} | Now: CHF {{ asset.currentPrice }}</span>
              <div class="h-actions">
                <button class="btn-action-icon" @click="emit('edit-asset', asset)" title="Edit">
                  <Edit2 :size="13" />
                </button>
                <button class="btn-action-icon text-loss" @click="deleteAsset(asset.id)" title="Delete">
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="accountAssets.length === 0" class="empty-holdings">
            No positions currently logged in this vault. Tap "Add Position" above.
          </div>
        </div>
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
  max-width: 620px;
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

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.vault-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
}

.vault-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.vault-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.vault-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid;
  background: rgba(255, 255, 255, 0.03);
}

.vault-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 2px;
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

.vault-hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-footnote {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.sync-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 0.78rem;
  flex-wrap: wrap;
  gap: 10px;
}

.sync-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sync-label {
  color: var(--text-muted);
}

.sync-val {
  color: var(--text-primary);
  font-weight: 600;
}

.holdings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.holdings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.holdings-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.add-btn-sm {
  font-size: 0.75rem;
  padding: 6px 12px;
}

.holdings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.holding-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.h-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.h-sym {
  font-weight: 700;
  color: var(--text-primary);
}

.h-name {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.h-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.h-val {
  font-weight: 700;
  color: var(--text-primary);
}

.h-pnl {
  font-size: 0.75rem;
  font-weight: 700;
}

.h-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-dim);
}

.h-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action-icon {
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 4px;
}
.btn-action-icon:hover {
  color: var(--text-primary);
}

.empty-holdings {
  padding: 24px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-dim);
}
</style>

<script setup lang="ts">
import { usePortfolio } from '../composables/usePortfolio';
import type { AccountType } from '../types/portfolio';
import {
  ShieldCheck,
  Wallet,
  Coins,
  Landmark,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'select-account', accountId: AccountType): void;
}>();

const {
  accounts,
  accountStats,
  formatMoney,
  selectedAccountId,
  setSelectedAccount,
} = usePortfolio();

function getAccountIcon(iconName: string) {
  switch (iconName) {
    case 'ShieldCheck': return ShieldCheck;
    case 'Wallet': return Wallet;
    case 'Coins': return Coins;
    case 'Landmark': return Landmark;
    case 'TrendingUp': return TrendingUp;
    default: return Wallet;
  }
}

function handleCardClick(accId: AccountType) {
  if (selectedAccountId.value === accId) {
    setSelectedAccount('all');
  } else {
    setSelectedAccount(accId);
  }
  emit('select-account', accId);
}
</script>

<template>
  <div class="accounts-section">
    <div class="section-header">
      <div class="title-group">
        <h2 class="section-title">Connected Vaults & Portfolios</h2>
        <p class="section-subtitle">Aggregated balances across cold storage, hot web3, CEX, gold & equities</p>
      </div>

      <div class="filter-pills">
        <button
          class="filter-pill"
          :class="{ active: selectedAccountId === 'all' }"
          @click="setSelectedAccount('all')"
        >
          <Layers :size="13" />
          <span>All Vaults</span>
        </button>
      </div>
    </div>

    <div class="accounts-grid">
      <div
        v-for="acc in accounts"
        :key="acc.id"
        class="account-card glass-card glass-card-interactive"
        :class="{ active: selectedAccountId === acc.id }"
        @click="handleCardClick(acc.id)"
      >
        <!-- Card Top -->
        <div class="card-top">
          <div class="account-icon-box" :style="{ backgroundColor: `${acc.color}20`, borderColor: `${acc.color}40`, color: acc.color }">
            <component :is="getAccountIcon(acc.iconName)" :size="20" />
          </div>

          <div class="account-badge-pill" :style="{ color: acc.color, borderColor: `${acc.color}30` }">
            {{ acc.badge }}
          </div>
        </div>

        <!-- Account Info -->
        <div class="account-details">
          <div class="account-name">{{ acc.name }}</div>
          <div class="account-address">{{ acc.connectedAddress || acc.syncType }}</div>
        </div>

        <!-- Valuation & PnL -->
        <div class="account-numbers font-mono" v-if="accountStats.get(acc.id)">
          <div class="account-val">
            {{ formatMoney(accountStats.get(acc.id)!.totalValueCHF) }}
          </div>

          <div class="account-pnl-row">
            <span
              class="pnl-tag"
              :class="accountStats.get(acc.id)!.pnlCHF >= 0 ? 'text-profit' : 'text-loss'"
            >
              <ArrowUpRight v-if="accountStats.get(acc.id)!.pnlCHF >= 0" :size="12" />
              <ArrowDownRight v-else :size="12" />
              {{ accountStats.get(acc.id)!.pnlPercent >= 0 ? '+' : '' }}{{ accountStats.get(acc.id)!.pnlPercent.toFixed(1) }}%
              ({{ formatMoney(accountStats.get(acc.id)!.pnlCHF, { showSign: true }) }})
            </span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer" v-if="accountStats.get(acc.id)">
          <span class="asset-count">
            {{ accountStats.get(acc.id)!.assetCount }} {{ accountStats.get(acc.id)!.assetCount === 1 ? 'Holding' : 'Holdings' }}
          </span>
          <span class="share-tag">
            {{ accountStats.get(acc.id)!.percentageOfPortfolio.toFixed(1) }}% of Total
          </span>
          <ChevronRight :size="14" class="chevron" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accounts-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.filter-pills {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-pill:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.filter-pill.active {
  background: rgba(0, 210, 255, 0.15);
  border-color: rgba(0, 210, 255, 0.4);
  color: var(--accent-cyan);
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.account-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
}

.account-card.active {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 20px rgba(0, 210, 255, 0.2);
  background: rgba(20, 28, 44, 0.9);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.account-icon-box {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
}

.account-badge-pill {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  border: 1px solid;
  background: rgba(255, 255, 255, 0.03);
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.account-address {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.account-numbers {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.account-val {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.account-pnl-row {
  display: flex;
  align-items: center;
}

.pnl-tag {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.76rem;
  font-weight: 600;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.share-tag {
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.chevron {
  color: var(--text-dim);
  transition: transform var(--transition-fast);
}

.account-card:hover .chevron {
  transform: translateX(3px);
  color: var(--text-primary);
}

@media (max-width: 640px) {
  .accounts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

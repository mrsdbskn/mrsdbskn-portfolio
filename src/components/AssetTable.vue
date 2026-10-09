<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import type { Asset } from '../types/portfolio';
import VaultLogo from './VaultLogo.vue';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Plus,
  Coins,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'edit-asset', asset: Asset): void;
  (e: 'add-asset'): void;
}>();

const {
  filteredAssets,
  formatMoney,
  deleteAsset,
  searchQuery,
  selectedAccountId,
  setSelectedAccount,
  accounts,
} = usePortfolio();

type SortKey = 'value' | 'pnl' | 'change' | 'name';
const sortKey = ref<SortKey>('value');
const sortAsc = ref<boolean>(false);
const activeCategoryFilter = ref<string>('all');

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = false;
  }
}

const displayedAssets = computed(() => {
  let list = filteredAssets.value;

  if (activeCategoryFilter.value !== 'all') {
    list = list.filter(a => a.category === activeCategoryFilter.value);
  }

  return [...list].sort((a, b) => {
    let diff = 0;
    if (sortKey.value === 'value') {
      diff = b.totalValueCHF - a.totalValueCHF;
    } else if (sortKey.value === 'pnl') {
      diff = b.pnlPercent - a.pnlPercent;
    } else if (sortKey.value === 'change') {
      diff = b.price24hChange - a.price24hChange;
    } else if (sortKey.value === 'name') {
      diff = a.symbol.localeCompare(b.symbol);
    }
    return sortAsc.value ? -diff : diff;
  });
});

function getSparklinePoints(sparkline: number[]): string {
  if (!sparkline || sparkline.length < 2) return '';
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const width = 80;
  const height = 28;

  return sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
</script>

<template>
  <div class="assets-section glass-card">
    <!-- Controls Header -->
    <div class="table-controls">
      <div class="controls-left">
        <h2 class="table-title">Individual Holdings & Cost Basis</h2>
        <span class="count-badge">{{ displayedAssets.length }} Positions</span>
      </div>

      <div class="controls-right">
        <!-- Search Input -->
        <div class="search-box">
          <Search :size="15" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search coin, ticker, vault..."
            class="search-input"
          />
        </div>

        <!-- Add Button -->
        <button class="btn btn-primary add-pos-btn" @click="emit('add-asset')">
          <Plus :size="15" />
          <span>Add Position</span>
        </button>
      </div>
    </div>

    <!-- Category Filter Tabs -->
    <div class="category-tabs">
      <button
        class="cat-tab"
        :class="{ active: activeCategoryFilter === 'all' }"
        @click="activeCategoryFilter = 'all'"
      >
        All Categories
      </button>
      <button
        class="cat-tab"
        :class="{ active: activeCategoryFilter === 'crypto_cold' }"
        @click="activeCategoryFilter = 'crypto_cold'"
      >
        <VaultLogo type="tangem" :size="14" />
        <span>Cold Crypto (Tangem)</span>
      </button>
      <button
        class="cat-tab"
        :class="{ active: activeCategoryFilter === 'equities' }"
        @click="activeCategoryFilter = 'equities'"
      >
        <VaultLogo type="neon" :size="14" />
        <span>Shares & ETFs (Neon)</span>
      </button>
      <button
        class="cat-tab"
        :class="{ active: activeCategoryFilter === 'gold' }"
        @click="activeCategoryFilter = 'gold'"
      >
        <VaultLogo type="ubs" :size="14" />
        <span>Precious Gold (UBS)</span>
      </button>
      <button
        class="cat-tab"
        :class="{ active: activeCategoryFilter === 'crypto_cex' }"
        @click="activeCategoryFilter = 'crypto_cex'"
      >
        <VaultLogo type="binance" :size="14" />
        <span>CEX (Binance)</span>
      </button>
      <button
        class="cat-tab"
        :class="{ active: activeCategoryFilter === 'crypto_hot' }"
        @click="activeCategoryFilter = 'crypto_hot'"
      >
        <VaultLogo type="metamask" :size="14" />
        <span>Web3 (MetaMask)</span>
      </button>
    </div>

    <!-- Active Account Filter Indicator -->
    <div v-if="selectedAccountId !== 'all'" class="account-filter-banner">
      <span>Filtered by: <strong>{{ accounts.find(a => a.id === selectedAccountId)?.name }}</strong></span>
      <button class="clear-filter-btn" @click="setSelectedAccount('all')">Show All</button>
    </div>

    <!-- Assets List / Table (Responsive Card layout on Mobile, Table on Desktop) -->
    <div class="table-container">
      <table class="assets-table">
        <thead>
          <tr>
            <th @click="setSort('name')" class="sortable">
              <span>Asset & Vault</span>
            </th>
            <th>Holdings</th>
            <th>Avg Buy Price</th>
            <th>Current Price</th>
            <th @click="setSort('value')" class="sortable text-right">
              <span>Market Value</span>
            </th>
            <th @click="setSort('pnl')" class="sortable text-right">
              <span>Unrealized PnL</span>
            </th>
            <th @click="setSort('change')" class="sortable text-center">
              <span>24h Trend</span>
            </th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in displayedAssets" :key="asset.id" class="asset-row">
            <!-- Asset & Account -->
            <td>
              <div class="asset-identity">
                <div class="symbol-avatar" :style="{ backgroundColor: `${asset.accountColor}20`, color: asset.accountColor, borderColor: `${asset.accountColor}40` }">
                  {{ asset.symbol.slice(0, 3) }}
                </div>
                <div class="identity-text">
                  <div class="asset-symbol-row">
                    <span class="asset-symbol">{{ asset.symbol }}</span>
                    <span class="account-tag" :style="{ color: asset.accountColor, borderColor: `${asset.accountColor}30` }">
                      <VaultLogo :type="asset.accountId" :size="12" />
                      <span>{{ asset.accountName }}</span>
                    </span>
                  </div>
                  <span class="asset-fullname">{{ asset.name }}</span>
                </div>
              </div>
            </td>

            <!-- Quantity & Unit -->
            <td>
              <div class="holding-cell font-mono">
                <span class="quantity-val">{{ asset.quantity }}</span>
                <span class="unit-val">{{ asset.unit }}</span>
              </div>
            </td>

            <!-- Avg Buy Price -->
            <td>
              <div class="price-cell font-mono">
                {{ formatMoney(asset.avgBuyPrice, { maximumFractionDigits: asset.avgBuyPrice < 10 ? 2 : 0 }) }}
              </div>
            </td>

            <!-- Current Price -->
            <td>
              <div class="price-cell font-mono font-bold">
                {{ formatMoney(asset.currentPrice, { maximumFractionDigits: asset.currentPrice < 10 ? 2 : 0 }) }}
              </div>
            </td>

            <!-- Market Value -->
            <td class="text-right">
              <div class="value-cell font-mono font-bold">
                {{ formatMoney(asset.totalValueCHF) }}
              </div>
              <div class="cost-sub font-mono">
                Cost: {{ formatMoney(asset.totalCostCHF) }}
              </div>
            </td>

            <!-- Unrealized PnL -->
            <td class="text-right">
              <div class="pnl-cell font-mono" :class="asset.isProfitable ? 'text-profit' : 'text-loss'">
                <span class="pnl-amount font-bold">
                  {{ formatMoney(asset.pnlCHF, { showSign: true }) }}
                </span>
                <span class="pnl-pct-badge" :class="asset.isProfitable ? 'badge-profit' : 'badge-loss'">
                  <ArrowUpRight v-if="asset.isProfitable" :size="11" />
                  <ArrowDownRight v-else :size="11" />
                  {{ asset.isProfitable ? '+' : '' }}{{ asset.pnlPercent.toFixed(1) }}%
                </span>
              </div>
            </td>

            <!-- Sparkline Trend -->
            <td class="text-center">
              <div class="sparkline-wrapper">
                <svg width="80" height="28" class="sparkline-svg">
                  <polyline
                    fill="none"
                    :stroke="asset.price24hChange >= 0 ? '#10b981' : '#f43f5e'"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :points="getSparklinePoints(asset.sparkline)"
                  />
                </svg>
                <span class="trend-badge" :class="asset.price24hChange >= 0 ? 'text-profit' : 'text-loss'">
                  {{ asset.price24hChange >= 0 ? '+' : '' }}{{ asset.price24hChange }}%
                </span>
              </div>
            </td>

            <!-- Actions -->
            <td class="text-right">
              <div class="action-buttons">
                <button
                  class="btn-icon-subtle"
                  title="Edit Asset"
                  @click="emit('edit-asset', asset)"
                >
                  <Edit2 :size="14" />
                </button>
                <button
                  class="btn-icon-subtle btn-delete"
                  title="Delete Asset"
                  @click="deleteAsset(asset.id)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="displayedAssets.length === 0" class="empty-state">
        <Coins :size="36" class="empty-icon" />
        <p class="empty-title">No assets found</p>
        <p class="empty-sub">Try searching for something else or add a new position</p>
        <button class="btn btn-primary" @click="emit('add-asset')">
          <Plus :size="15" />
          <span>Add Position</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assets-section {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.count-badge {
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  padding: 8px 12px 8px 36px;
  border-radius: var(--radius-full);
  outline: none;
  width: 220px;
  transition: all var(--transition-fast);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-cyan);
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
  width: 260px;
}

.category-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.category-tabs::-webkit-scrollbar {
  display: none;
}

.cat-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cat-tab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.cat-tab.active {
  background: rgba(0, 210, 255, 0.15);
  border-color: rgba(0, 210, 255, 0.35);
  color: var(--accent-cyan);
}

.account-filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 210, 255, 0.08);
  border: 1px solid rgba(0, 210, 255, 0.2);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  color: var(--accent-cyan);
}

.clear-filter-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
}

.table-container {
  overflow-x: auto;
  margin: 0 -24px -24px -24px;
  padding: 0 24px 24px 24px;
}

.assets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.assets-table th {
  text-align: left;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.assets-table th.sortable {
  cursor: pointer;
}
.assets-table th.sortable:hover {
  color: var(--text-primary);
}

.assets-table td {
  padding: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}

.asset-row {
  transition: background var(--transition-fast);
}
.asset-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}

.font-bold {
  font-weight: 700;
}

.asset-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.symbol-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.75rem;
  border: 1px solid;
}

.identity-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.asset-symbol-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.asset-symbol {
  font-weight: 800;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.account-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.03);
}

.asset-fullname {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.holding-cell {
  display: flex;
  flex-direction: column;
}

.quantity-val {
  font-weight: 700;
  color: var(--text-primary);
}

.unit-val {
  font-size: 0.7rem;
  color: var(--text-dim);
}

.price-cell {
  color: var(--text-secondary);
}

.value-cell {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.cost-sub {
  font-size: 0.68rem;
  color: var(--text-dim);
}

.pnl-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.pnl-amount {
  font-size: 0.9rem;
}

.pnl-pct-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.sparkline-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sparkline-svg {
  overflow: visible;
}

.trend-badge {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.btn-icon-subtle {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon-subtle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.btn-delete:hover {
  background: rgba(244, 63, 94, 0.15);
  color: var(--loss);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: var(--text-muted);
}

.empty-icon {
  color: var(--text-dim);
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.empty-sub {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

@media (max-width: 640px) {
  .assets-section {
    padding: 16px;
  }
  .search-input {
    width: 100%;
  }
  .controls-right {
    width: 100%;
  }
  .search-box {
    width: 100%;
  }
  .add-pos-btn {
    width: 100%;
  }
}
</style>

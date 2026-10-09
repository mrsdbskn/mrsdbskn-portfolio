<script setup lang="ts">
import { computed } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import {
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Upload,
  ShieldCheck,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-add-asset'): void;
  (e: 'open-import'): void;
}>();

const {
  portfolioSummary,
  formatMoney,
  isPrivacyMasked,
  currency,
  topGainers,
} = usePortfolio();

const isProfit = computed(() => portfolioSummary.value.totalUnrealizedPnL >= 0);
const is24hUp = computed(() => portfolioSummary.value.total24hChangeAmount >= 0);

const topPerformer = computed(() => topGainers.value[0]);
</script>

<template>
  <div class="hero-card glass-card">
    <div class="glow-underlay" :class="{ 'glow-profit': isProfit, 'glow-loss': !isProfit }"></div>

    <div class="hero-content">
      <!-- Top Label & 24h Pill -->
      <div class="hero-header">
        <div class="badge-row">
          <span class="vault-badge">
            <ShieldCheck :size="13" />
            AGGREGATED MULTI-VAULT NET WORTH
          </span>
        </div>

        <div
          class="badge change-badge"
          :class="is24hUp ? 'badge-profit' : 'badge-loss'"
          :title="'24 Hour Portfolio Change'"
        >
          <ArrowUpRight v-if="is24hUp" :size="14" />
          <ArrowDownRight v-else :size="14" />
          <span>
            {{ formatMoney(portfolioSummary.total24hChangeAmount, { showSign: true }) }}
            ({{ (portfolioSummary.total24hChangePercent >= 0 ? '+' : '') + portfolioSummary.total24hChangePercent.toFixed(2) }}%)
          </span>
          <span class="change-label">24h</span>
        </div>
      </div>

      <!-- Main Balance Figure -->
      <div class="balance-container">
        <div class="currency-tag">{{ currency }}</div>
        <div class="main-number font-mono" :class="{ 'masked-font': isPrivacyMasked }">
          {{ formatMoney(portfolioSummary.totalNetWorth) }}
        </div>
      </div>

      <!-- Profit & Cost Basis Stats Bar -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Cost Basis</div>
          <div class="stat-val font-mono">
            {{ formatMoney(portfolioSummary.totalCostBasis) }}
          </div>
          <div class="stat-sub">Invested capital</div>
        </div>

        <div class="stat-item highlight" :class="isProfit ? 'stat-profit' : 'stat-loss'">
          <div class="stat-label">Total Unrealized PnL</div>
          <div class="stat-val font-mono">
            {{ formatMoney(portfolioSummary.totalUnrealizedPnL, { showSign: true }) }}
          </div>
          <div class="stat-sub profit-sub">
            <span v-if="isProfit">+</span>{{ portfolioSummary.totalUnrealizedPnLPercent.toFixed(2) }}% Overall Return
          </div>
        </div>

        <div v-if="topPerformer" class="stat-item top-performer">
          <div class="stat-label">Top Performer</div>
          <div class="stat-val font-mono">
            {{ topPerformer.symbol }}
          </div>
          <div class="stat-sub text-profit">
            +{{ topPerformer.pnlPercent.toFixed(1) }}% ({{ topPerformer.accountName }})
          </div>
        </div>
      </div>

      <!-- Action Buttons Row -->
      <div class="hero-actions">
        <button class="btn btn-primary" @click="emit('open-add-asset')">
          <PlusCircle :size="17" />
          <span>Add Position</span>
        </button>

        <button class="btn btn-secondary" @click="emit('open-import')">
          <Upload :size="17" />
          <span>Import Statement (Neon / Binance / UBS)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-card {
  position: relative;
  overflow: hidden;
  padding: 28px 24px;
  background: linear-gradient(135deg, rgba(20, 27, 43, 0.85) 0%, rgba(13, 17, 27, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glow-underlay {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
}

.glow-profit {
  background: radial-gradient(circle, #10b981 0%, rgba(248, 208, 48, 0.3) 100%);
}

.glow-loss {
  background: radial-gradient(circle, #f43f5e 0%, rgba(244, 63, 94, 0.1) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.vault-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #F8D030;
  background: rgba(248, 208, 48, 0.1);
  border: 1px solid rgba(248, 208, 48, 0.28);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  letter-spacing: 0.08em;
}

.change-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 12px;
}

.change-label {
  font-size: 0.68rem;
  opacity: 0.8;
  margin-left: 2px;
}

.balance-container {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.currency-tag {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-muted);
}

.main-number {
  font-size: 3.1rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  background: linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.masked-font {
  letter-spacing: 0.15em;
  font-size: 2.4rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  background: rgba(8, 12, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-val {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.stat-profit .stat-val {
  color: var(--profit);
}

.stat-profit .profit-sub {
  color: var(--profit);
  font-weight: 600;
}

.stat-loss .stat-val {
  color: var(--loss);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .hero-card {
    padding: 20px 16px;
  }
  .main-number {
    font-size: 2.3rem;
  }
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .top-performer {
    grid-column: span 2;
  }
  .hero-actions .btn {
    width: 100%;
  }
}
</style>

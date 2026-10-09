<script setup lang="ts">
import { computed } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import type { Currency } from '../types/portfolio';
import { Eye, EyeOff, RefreshCw } from 'lucide-vue-next';
import logoImg from '../assets/logo.png';

const {
  currency,
  setCurrency,
  isPrivacyMasked,
  togglePrivacy,
  isRefreshing,
  refreshData,
  accounts,
  assets,
} = usePortfolio();

const fundedVaultsCount = computed(() => {
  return accounts.value.filter(acc => assets.value.some(a => a.accountId === acc.id)).length;
});

const currencies: Currency[] = ['CHF', 'USD', 'EUR'];
</script>

<template>
  <header class="header-container safe-area-top">
    <div class="header-left">
      <div class="logo-badge">
        <div class="logo-glow"></div>
        <div class="logo-icon">
          <img :src="logoImg" alt="mrsdbskn logo" class="logo-image" />
        </div>
        <div class="logo-text">
          <div class="logo-title">mrsdbskn</div>
          <div class="logo-subtitle">PORTFOLIO</div>
        </div>
      </div>
      <div class="status-indicator">
        <span class="live-dot"></span>
        <span class="status-label">{{ fundedVaultsCount }} Vaults Active</span>
      </div>
    </div>

    <div class="header-right">
      <!-- Currency Selector -->
      <div class="currency-toggle">
        <button
          v-for="c in currencies"
          :key="c"
          class="currency-btn"
          :class="{ active: currency === c }"
          @click="setCurrency(c)"
          :title="`Switch base currency to ${c}`"
        >
          {{ c }}
        </button>
      </div>

      <!-- Privacy Mask Toggle -->
      <button
        class="action-btn"
        :class="{ active: isPrivacyMasked }"
        @click="togglePrivacy"
        :title="isPrivacyMasked ? 'Reveal Balances' : 'Hide / Blur Balances (Privacy Mode)'"
        aria-label="Toggle Privacy"
      >
        <EyeOff v-if="isPrivacyMasked" :size="18" />
        <Eye v-else :size="18" />
      </button>

      <!-- Refresh Button -->
      <button
        class="action-btn"
        :class="{ refreshing: isRefreshing }"
        @click="refreshData"
        :title="'Simulate Live Price Update'"
        aria-label="Refresh Data"
      >
        <RefreshCw :size="18" :class="{ 'animate-spin': isRefreshing }" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(10, 14, 23, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(248, 208, 48, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-shadow: 0 0 16px rgba(248, 208, 48, 0.25);
  overflow: hidden;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 5px rgba(248, 208, 48, 0.7));
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  background: linear-gradient(120deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.logo-subtitle {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #F8D030;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--profit);
  box-shadow: 0 0 8px var(--profit);
  animation: pulseGlow 2s infinite;
}

.status-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--profit);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.currency-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 2px;
}

.currency-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.currency-btn.active {
  background: rgba(248, 208, 48, 0.18);
  color: #F8D030;
  box-shadow: 0 0 10px rgba(248, 208, 48, 0.25);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.action-btn.active {
  background: rgba(244, 63, 94, 0.15);
  border-color: rgba(244, 63, 94, 0.35);
  color: var(--loss);
}

@media (max-width: 640px) {
  .status-indicator {
    display: none;
  }
  .header-container {
    padding: 12px 16px;
  }
}
</style>

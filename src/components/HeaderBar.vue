<script setup lang="ts">
import { usePortfolio } from '../composables/usePortfolio';
import type { Currency } from '../types/portfolio';
import { Eye, EyeOff, RefreshCw, Sparkles } from 'lucide-vue-next';

const {
  currency,
  setCurrency,
  isPrivacyMasked,
  togglePrivacy,
  isRefreshing,
  refreshData,
} = usePortfolio();

const currencies: Currency[] = ['CHF', 'USD', 'EUR'];
</script>

<template>
  <header class="header-container safe-area-top">
    <div class="header-left">
      <div class="logo-badge">
        <div class="logo-glow"></div>
        <div class="logo-icon">
          <Sparkles class="icon-sparkle" :size="18" />
        </div>
        <div class="logo-text">
          <div class="logo-title">AURA</div>
          <div class="logo-subtitle">WEALTH ENGINE</div>
        </div>
      </div>
      <div class="status-indicator">
        <span class="live-dot"></span>
        <span class="status-label">5 Vaults Connected</span>
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
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 50%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #060912;
  box-shadow: 0 0 16px rgba(0, 210, 255, 0.4);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  background: linear-gradient(120deg, #ffffff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.logo-subtitle {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--accent-cyan);
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
  background: rgba(0, 210, 255, 0.18);
  color: var(--accent-cyan);
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
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

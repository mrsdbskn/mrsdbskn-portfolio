<script setup lang="ts">
import { usePortfolio } from '../composables/usePortfolio';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Upload,
  Settings,
} from 'lucide-vue-next';

const { activeTab } = usePortfolio();

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: '5 Vaults', icon: ShieldCheck },
  { id: 'performance', label: 'Analytics', icon: TrendingUp },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;
</script>

<template>
  <nav class="bottom-nav-container safe-area-bottom">
    <div class="bottom-nav-inner">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="nav-tab-btn"
        :class="{ active: activeTab === t.id }"
        @click="activeTab = t.id"
      >
        <div class="icon-wrap">
          <component :is="t.icon" :size="20" />
          <span v-if="activeTab === t.id" class="active-dot"></span>
        </div>
        <span class="nav-tab-label">{{ t.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 45;
  display: flex;
  justify-content: center;
  padding: 8px 16px 12px 16px;
  background: linear-gradient(180deg, rgba(6, 8, 13, 0.7) 0%, rgba(6, 8, 13, 0.98) 30%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid var(--border-subtle);
}

.bottom-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  max-width: 580px;
  background: rgba(18, 24, 38, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  padding: 6px 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.nav-tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
  position: relative;
}

.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-dot {
  position: absolute;
  bottom: -4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
}

.nav-tab-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.nav-tab-btn:hover {
  color: var(--text-secondary);
}

.nav-tab-btn.active {
  color: var(--accent-cyan);
}

.nav-tab-btn.active .icon-wrap {
  transform: translateY(-1px);
}
</style>

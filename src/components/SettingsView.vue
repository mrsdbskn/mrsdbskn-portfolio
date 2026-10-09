<script setup lang="ts">
import { ref } from 'vue';
import { usePortfolio } from '../composables/usePortfolio';
import type { Currency } from '../types/portfolio';
import {
  Shield,
  Download,
  Upload,
  RotateCcw,
  Smartphone,
  Lock,
  Globe,
  CheckCircle2,
  Trash2,
} from 'lucide-vue-next';

const {
  currency,
  setCurrency,
  isPrivacyMasked,
  togglePrivacy,
  exportBackup,
  importBackup,
  resetToMockData,
  clearAllPositions,
  fxRates,
} = usePortfolio();

const fileInputRef = ref<HTMLInputElement | null>(null);
const restoreStatus = ref<string>('');

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileRestore(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target?.result as string;
    if (text) {
      const ok = importBackup(text);
      if (ok) {
        restoreStatus.value = 'Backup restored successfully!';
        setTimeout(() => { restoreStatus.value = ''; }, 3000);
      } else {
        alert('Invalid backup file format.');
      }
    }
  };
  reader.readAsText(file);
}

function handleReset() {
  if (confirm('Are you sure you want to reset your portfolio back to the initial demo data? Any custom entries will be replaced.')) {
    resetToMockData();
  }
}

function handleClearAll() {
  if (confirm('Clear all positions to start completely fresh? You can enter your own real positions step by step, or reset to demo data anytime.')) {
    clearAllPositions();
    restoreStatus.value = 'Portfolio cleared! You can now add your own real vault holdings.';
    setTimeout(() => { restoreStatus.value = ''; }, 3500);
  }
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2 class="settings-title">Settings & Privacy Vault</h2>
      <p class="settings-subtitle">Configure base currency, client-side data backups, and mobile installation</p>
    </div>

    <!-- Base Currency Card -->
    <div class="settings-card glass-card">
      <div class="card-title-row">
        <Globe :size="18" class="text-cyan" />
        <span class="card-title">Base Display Currency</span>
      </div>
      <p class="card-desc">Your holdings are unified into this single currency with automatic conversions.</p>

      <div class="currency-options">
        <button
          v-for="curr in (['CHF', 'USD', 'EUR'] as Currency[])"
          :key="curr"
          class="curr-card"
          :class="{ active: currency === curr }"
          @click="setCurrency(curr)"
        >
          <div class="curr-name">{{ curr }}</div>
          <div class="curr-rate font-mono">
            {{ curr === 'CHF' ? 'Base (1.00)' : `1 CHF = ${fxRates[curr]} ${curr}` }}
          </div>
        </button>
      </div>
    </div>

    <!-- Privacy Shield -->
    <div class="settings-card glass-card">
      <div class="card-title-row">
        <Lock :size="18" class="text-cyan" />
        <span class="card-title">Privacy Shield (Public Mode)</span>
      </div>
      <p class="card-desc">Instantly blur and mask all currency numbers when opening the app in public or on trains.</p>

      <div class="toggle-row">
        <span class="toggle-label">{{ isPrivacyMasked ? 'Masking is ON (Numbers Hidden)' : 'Masking is OFF (Numbers Visible)' }}</span>
        <button class="btn btn-secondary" @click="togglePrivacy">
          {{ isPrivacyMasked ? 'Reveal Numbers' : 'Enable Mask' }}
        </button>
      </div>
    </div>

    <!-- Backup & Restore Card -->
    <div class="settings-card glass-card">
      <div class="card-title-row">
        <Shield :size="18" class="text-cyan" />
        <span class="card-title">Zero-Server Client-Side Backup</span>
      </div>
      <p class="card-desc">
        Since this app is hosted on <strong>GitHub Pages</strong>, all data lives exclusively in your browser's private storage. Export your portfolio to an offline JSON file for safe-keeping.
      </p>

      <div class="backup-actions">
        <button class="btn btn-primary" @click="exportBackup">
          <Download :size="16" />
          <span>Export Encrypted Backup (.json)</span>
        </button>

        <button class="btn btn-secondary" @click="triggerFileInput">
          <Upload :size="16" />
          <span>Restore from Backup</span>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden-input"
          @change="handleFileRestore"
        />

        <button class="btn btn-secondary reset-btn" @click="handleReset">
          <RotateCcw :size="16" />
          <span>Reset to Demo Data</span>
        </button>

        <button class="btn btn-secondary clear-btn" @click="handleClearAll">
          <Trash2 :size="16" />
          <span>Clear All Positions (Start Fresh)</span>
        </button>
      </div>

      <div v-if="restoreStatus" class="restore-alert">
        <CheckCircle2 :size="16" class="text-profit" />
        <span>{{ restoreStatus }}</span>
      </div>
    </div>

    <!-- Google Pixel 10 XL Installation Guide -->
    <div class="settings-card glass-card">
      <div class="card-title-row">
        <Smartphone :size="18" class="text-cyan" />
        <span class="card-title">Google Pixel 10 XL Mobile App Installation</span>
      </div>
      <p class="card-desc">
        This app is built as a Progressive Web App (PWA). You can install it on your Pixel without an app store:
      </p>

      <div class="steps-list">
        <div class="step-item">
          <div class="step-badge">1</div>
          <div class="step-text">Open this URL in Google Chrome on your Pixel 10 XL.</div>
        </div>
        <div class="step-item">
          <div class="step-badge">2</div>
          <div class="step-text">Tap the three vertical dots (<strong>⋮</strong>) in the top-right corner.</div>
        </div>
        <div class="step-item">
          <div class="step-badge">3</div>
          <div class="step-text">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</div>
        </div>
        <div class="step-item">
          <div class="step-badge">4</div>
          <div class="step-text">It will launch full-screen with no browser address bar, OLED dark mode, and fluid animations!</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.settings-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.settings-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-cyan {
  color: var(--accent-cyan);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.currency-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
}

.curr-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  transition: all var(--transition-fast);
}

.curr-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border-strong);
}

.curr-card.active {
  background: rgba(0, 210, 255, 0.12);
  border-color: var(--accent-cyan);
  box-shadow: 0 0 15px rgba(0, 210, 255, 0.2);
}

.curr-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.curr-rate {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.backup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hidden-input {
  display: none;
}

.reset-btn {
  color: var(--loss);
  border-color: rgba(244, 63, 94, 0.3);
}

.reset-btn:hover {
  background: rgba(244, 63, 94, 0.15);
}

.restore-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  color: var(--profit);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.step-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 210, 255, 0.15);
  color: var(--accent-cyan);
  font-weight: 700;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-text {
  line-height: 1.5;
}
</style>

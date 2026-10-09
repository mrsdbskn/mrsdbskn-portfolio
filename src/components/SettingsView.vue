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
  Sparkles,
  Undo2,
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
  hasDemoData,
  demoAssetCount,
  realAssetCount,
  clearDemoPositions,
  restoreDemoPositions,
  fxRates,
  vaultMode,
  switchVaultMode,
  clearPrivateVault,
  hasPrivateVaultStored,
} = usePortfolio();

const fileInputRef = ref<HTMLInputElement | null>(null);
const restoreStatus = ref<string>('');

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleSwitchToDemo() {
  switchVaultMode('demo');
  restoreStatus.value = 'Switched to Public Demo Mode! Safe for screen sharing or public viewing.';
  setTimeout(() => { restoreStatus.value = ''; }, 3500);
}

function handleSwitchToPrivate() {
  const ok = switchVaultMode('private');
  if (ok) {
    restoreStatus.value = 'Switched to My Private Vault! Showing your real holdings.';
  } else {
    triggerFileInput();
  }
  setTimeout(() => { restoreStatus.value = ''; }, 3500);
}

function handleClearPrivateVault() {
  if (confirm('Are you sure you want to delete your private vault data from this browser? Make sure you have downloaded a backup (mrsdbskn-portfolio-backup.json) first.')) {
    clearPrivateVault();
    restoreStatus.value = 'Private vault removed from this browser. Reverted to public demo mode.';
    setTimeout(() => { restoreStatus.value = ''; }, 3500);
  }
}

function handleFileRestore(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target?.result as string;
    if (text) {
      const res = importBackup(text);
      if (res.success) {
        restoreStatus.value = res.message;
        setTimeout(() => { restoreStatus.value = ''; }, 4000);
      } else {
        alert(res.message);
      }
    }
  };
  reader.readAsText(file);
}

function handleClearDemo() {
  if (confirm(`Are you sure you want to clear the ${demoAssetCount.value} demo positions (Tangem & MetaMask)? Your verified UBS, Neon, and Binance holdings will be kept.`)) {
    const removed = clearDemoPositions();
    restoreStatus.value = `Cleared ${removed} demo positions! Showing verified UBS Gold, Neon Coinbase & Binance holdings only.`;
    setTimeout(() => { restoreStatus.value = ''; }, 4000);
  }
}

function handleRestoreDemo() {
  const added = restoreDemoPositions();
  restoreStatus.value = `Restored ${added} sample demo positions (Tangem & MetaMask).`;
  setTimeout(() => { restoreStatus.value = ''; }, 3500);
}

function handleReset() {
  if (confirm('Are you sure you want to reset your portfolio back to the initial demo template? Any custom entries will be replaced.')) {
    resetToMockData();
    restoreStatus.value = 'Portfolio reset to default demo template!';
    setTimeout(() => { restoreStatus.value = ''; }, 3500);
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

    <!-- Demo Data & Portfolio Management Card -->
    <div class="settings-card glass-card">
      <div class="card-title-row">
        <Sparkles :size="18" class="text-accent" />
        <span class="card-title">Demo Data & Portfolio Management</span>
      </div>
      <p class="card-desc">
        Easily manage sample demo holdings vs. your real verified assets. You can clear the placeholder Tangem and MetaMask data while keeping your real UBS Gold, Neon Coinbase, and Binance holdings intact.
      </p>

      <div class="demo-status-box" :class="hasDemoData ? 'status-demo' : 'status-clean'">
        <div class="status-left">
          <div class="status-indicator-badge">
            {{ hasDemoData ? 'DEMO DATA ACTIVE' : 'VERIFIED HOLDINGS ONLY' }}
          </div>
          <div class="status-text">
            <template v-if="hasDemoData">
              <strong>{{ demoAssetCount }} demo positions</strong> currently loaded in Tangem & MetaMask.
              <span class="status-sub">Your {{ realAssetCount }} verified positions (UBS Gold, Neon Coinbase, Binance) will be kept intact when cleared.</span>
            </template>
            <template v-else>
              Demo data is cleared! Currently displaying only your <strong>{{ realAssetCount }} verified holdings</strong>.
            </template>
          </div>
        </div>

        <div class="status-right">
          <button
            v-if="hasDemoData"
            class="btn btn-clear-demo"
            @click="handleClearDemo"
          >
            <Trash2 :size="15" />
            <span>Clear Demo Data</span>
          </button>
          <button
            v-else
            class="btn btn-secondary"
            @click="handleRestoreDemo"
          >
            <Undo2 :size="15" />
            <span>Restore Demo Data</span>
          </button>
        </div>
      </div>

      <div class="data-actions-grid">
        <div class="data-action-item">
          <div class="item-title">Clear All Positions</div>
          <div class="item-desc">Wipes all current holdings to 0 CHF for a completely clean slate.</div>
          <button class="btn btn-secondary btn-sm clear-btn" @click="handleClearAll">
            <Trash2 :size="14" />
            <span>Clear All (0 CHF)</span>
          </button>
        </div>

        <div class="data-action-item">
          <div class="item-title">Reset to Default Template</div>
          <div class="item-desc">Restores the default starting template with both demo and verified samples.</div>
          <button class="btn btn-secondary btn-sm reset-btn" @click="handleReset">
            <RotateCcw :size="14" />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Private Vault & GitHub Privacy Shield Card -->
    <div class="settings-card glass-card">
      <div class="card-title-row">
        <Shield :size="18" class="text-accent" />
        <span class="card-title">Private Vault & GitHub Pages Privacy Shield</span>
      </div>
      <p class="card-desc">
        Your real UBS Gold, Neon Coinbase, and Binance data lives <strong>exclusively inside your browser's private local storage</strong> on this device. Anyone visiting your public GitHub Pages link will only see anonymous dummy numbers.
      </p>

      <!-- Active Mode Status Box -->
      <div class="demo-status-box" :class="vaultMode === 'private' ? 'status-private' : 'status-demo'">
        <div class="status-left">
          <div class="status-indicator-badge">
            {{ vaultMode === 'private' ? '🔐 PRIVATE VAULT ACTIVE' : '🛡️ PUBLIC DEMO MODE' }}
          </div>
          <div class="status-text">
            <template v-if="vaultMode === 'private'">
              Displaying your personal portfolio. All changes are stored offline on this device.
              <span class="status-sub">Zero cloud tracking. Public GitHub visitors cannot access your data.</span>
            </template>
            <template v-else>
              Displaying anonymous demo placeholders. Safe for public viewing and screen-sharing.
              <span class="status-sub">Switch to Private Vault or restore your backup file anytime.</span>
            </template>
          </div>
        </div>

        <div class="status-right">
          <button
            v-if="vaultMode === 'private'"
            class="btn btn-secondary"
            @click="handleSwitchToDemo"
            title="Switch to public demo profile"
          >
            <Shield :size="15" />
            <span>Switch to Demo Mode</span>
          </button>
          <button
            v-else
            class="btn btn-primary"
            @click="handleSwitchToPrivate"
            title="Switch to your private vault stored in browser"
          >
            <Lock :size="15" />
            <span>{{ hasPrivateVaultStored ? 'Open Private Vault' : 'Restore Private Vault' }}</span>
          </button>
        </div>
      </div>

      <!-- Backup Actions -->
      <div class="backup-actions">
        <button class="btn btn-primary" @click="exportBackup">
          <Download :size="16" />
          <span>Download Backup (mrsdbskn-portfolio-backup.json)</span>
        </button>

        <button class="btn btn-secondary" @click="triggerFileInput">
          <Upload :size="16" />
          <span>Restore from Backup (.json)</span>
        </button>

        <button
          v-if="hasPrivateVaultStored"
          class="btn btn-secondary text-loss"
          @click="handleClearPrivateVault"
          title="Delete private data from this browser's local storage"
        >
          <Trash2 :size="15" />
          <span>Clear Local Private Data</span>
        </button>

        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden-input"
          @change="handleFileRestore"
        />
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

.text-accent {
  color: #F8D030;
}

.demo-status-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.03);
  flex-wrap: wrap;
}

.demo-status-box.status-demo {
  background: rgba(0, 210, 255, 0.06);
  border-color: rgba(0, 210, 255, 0.3);
}

.demo-status-box.status-clean {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
}

.demo-status-box.status-private {
  background: rgba(248, 208, 48, 0.08);
  border-color: rgba(248, 208, 48, 0.4);
}

.status-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 240px;
}

.status-indicator-badge {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.status-demo .status-indicator-badge {
  background: rgba(0, 210, 255, 0.18);
  color: #00d2ff;
  border: 1px solid rgba(0, 210, 255, 0.35);
}

.status-private .status-indicator-badge {
  background: rgba(248, 208, 48, 0.2);
  color: #F8D030;
  border: 1px solid rgba(248, 208, 48, 0.45);
}

.status-clean .status-indicator-badge {
  background: rgba(16, 185, 129, 0.2);
  color: var(--profit);
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.status-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.status-sub {
  display: block;
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.btn-clear-demo {
  background: linear-gradient(135deg, #F8D030 0%, #eab308 100%);
  color: #0b0f19;
  font-weight: 700;
  font-size: 0.84rem;
  border: none;
  box-shadow: 0 0 16px rgba(248, 208, 48, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-clear-demo:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 22px rgba(248, 208, 48, 0.5);
}

.data-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 4px;
}

.data-action-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.item-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
  flex: 1;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 0.78rem;
  align-self: flex-start;
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

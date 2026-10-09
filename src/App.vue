<script setup lang="ts">
import { ref } from 'vue';
import { usePortfolio } from './composables/usePortfolio';
import type { AccountType, Asset } from './types/portfolio';

// Components
import HeaderBar from './components/HeaderBar.vue';
import NetWorthCard from './components/NetWorthCard.vue';
import PerformanceChart from './components/PerformanceChart.vue';
import AllocationChart from './components/AllocationChart.vue';
import CostVsValueChart from './components/CostVsValueChart.vue';
import AccountList from './components/AccountList.vue';
import AssetTable from './components/AssetTable.vue';
import AssetModal from './components/AssetModal.vue';
import ImportModal from './components/ImportModal.vue';
import AccountDetailModal from './components/AccountDetailModal.vue';
import SettingsView from './components/SettingsView.vue';
import BottomNav from './components/BottomNav.vue';

const { activeTab } = usePortfolio();

// Modal States
const isAssetModalOpen = ref<boolean>(false);
const editingAsset = ref<Asset | null>(null);

const isImportModalOpen = ref<boolean>(false);

const selectedModalAccount = ref<AccountType | null>(null);
const isAccountDetailOpen = ref<boolean>(false);

// Modal Triggers
function openAddAsset(defaultAccount?: AccountType) {
  editingAsset.value = null;
  if (defaultAccount) {
    selectedModalAccount.value = defaultAccount;
  }
  isAssetModalOpen.value = true;
}

function openEditAsset(asset: Asset) {
  editingAsset.value = asset;
  isAssetModalOpen.value = true;
}

function openAccountDetail(accId: AccountType) {
  selectedModalAccount.value = accId;
  isAccountDetailOpen.value = true;
}

function handleAddFromAccount(accId: AccountType) {
  isAccountDetailOpen.value = false;
  openAddAsset(accId);
}
</script>

<template>
  <div class="app-layout">
    <!-- Top Header Bar -->
    <HeaderBar />

    <!-- Main Scrollable Content View -->
    <main class="main-content">
      <!-- 1. DASHBOARD TAB -->
      <section v-if="activeTab === 'dashboard'" class="tab-view dashboard-view">
        <!-- Hero Net Worth Card -->
        <NetWorthCard
          @open-add-asset="openAddAsset"
          @open-import="isImportModalOpen = true"
        />

        <!-- Analytics Preview Row -->
        <div class="charts-row">
          <div class="chart-col-lg">
            <PerformanceChart />
          </div>
          <div class="chart-col-sm">
            <AllocationChart />
          </div>
        </div>

        <!-- 5 Accounts Grid -->
        <AccountList @select-account="openAccountDetail" />

        <!-- Cost vs Value Bar Comparison -->
        <CostVsValueChart />

        <!-- Asset Positions Table -->
        <AssetTable
          @add-asset="openAddAsset"
          @edit-asset="openEditAsset"
        />
      </section>

      <!-- 2. VAULTS / ACCOUNTS TAB -->
      <section v-else-if="activeTab === 'accounts'" class="tab-view">
        <AccountList @select-account="openAccountDetail" />
        <CostVsValueChart />
        <AssetTable
          @add-asset="openAddAsset"
          @edit-asset="openEditAsset"
        />
      </section>

      <!-- 3. PERFORMANCE & ANALYTICS TAB -->
      <section v-else-if="activeTab === 'performance'" class="tab-view">
        <PerformanceChart />
        <div class="charts-row">
          <div class="chart-col-half">
            <AllocationChart />
          </div>
          <div class="chart-col-half">
            <CostVsValueChart />
          </div>
        </div>
        <AssetTable
          @add-asset="openAddAsset"
          @edit-asset="openEditAsset"
        />
      </section>

      <!-- 4. IMPORT & SMART PARSER TAB -->
      <section v-else-if="activeTab === 'import'" class="tab-view">
        <div class="import-tab-wrapper">
          <div class="import-hero glass-card">
            <h2 class="import-hero-title">Sync & Import Assets</h2>
            <p class="import-hero-sub">
              Drag-and-drop your monthly Neon statements, Binance trade histories, or UBS Gold custody records.
            </p>
            <button class="btn btn-primary" @click="isImportModalOpen = true">
              Open Interactive Statement Parser
            </button>
          </div>
        </div>
        <AssetTable
          @add-asset="openAddAsset"
          @edit-asset="openEditAsset"
        />
      </section>

      <!-- 5. SETTINGS & PRIVACY TAB -->
      <section v-else-if="activeTab === 'settings'" class="tab-view">
        <SettingsView />
      </section>
    </main>

    <!-- Modals -->
    <AssetModal
      :is-open="isAssetModalOpen"
      :editing-asset="editingAsset"
      @close="isAssetModalOpen = false"
    />

    <ImportModal
      v-if="isImportModalOpen"
      @close="isImportModalOpen = false"
    />

    <AccountDetailModal
      :is-open="isAccountDetailOpen"
      :account-id="selectedModalAccount"
      @close="isAccountDetailOpen = false"
      @add-asset="handleAddFromAccount"
      @edit-asset="openEditAsset"
    />

    <!-- Bottom Navigation Bar for Google Pixel 10 XL & Mobile -->
    <BottomNav />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 100px 20px; /* 100px bottom padding for BottomNav clearance */
}

.tab-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.chart-col-lg {
  min-width: 0;
}

.chart-col-sm {
  min-width: 0;
}

.chart-col-half {
  min-width: 0;
}

.import-tab-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.import-hero {
  padding: 36px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.import-hero-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
}

.import-hero-sub {
  font-size: 0.88rem;
  color: var(--text-muted);
  max-width: 520px;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 16px 12px 110px 12px;
  }
  .tab-view {
    gap: 16px;
  }
}
</style>

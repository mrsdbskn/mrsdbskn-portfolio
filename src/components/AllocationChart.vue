<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
import { usePortfolio } from '../composables/usePortfolio';
import { PieChart } from 'lucide-vue-next';

Chart.register(...registerables);

const {
  categoryAllocation,
  formatMoney,
  currency,
} = usePortfolio();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

function initChart() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  const data = categoryAllocation.value;
  const labels = data.map(d => d.label);
  const values = data.map(d => d.valueCHF);
  const colors = data.map(d => d.color);

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: '#0a0e17',
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(14, 19, 31, 0.95)',
          titleColor: '#94a3b8',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: function (context) {
              const val = context.parsed;
              const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
              const pct = ((val / total) * 100).toFixed(1);
              return ` ${currency.value} ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(val)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function updateChart() {
  if (!chartInstance) return;
  const data = categoryAllocation.value;
  chartInstance.data.labels = data.map(d => d.label);
  chartInstance.data.datasets[0].data = data.map(d => d.valueCHF);
  chartInstance.data.datasets[0].backgroundColor = data.map(d => d.color);
  chartInstance.update();
}

watch([categoryAllocation, currency], () => {
  updateChart();
});

onMounted(() => {
  initChart();
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<template>
  <div class="allocation-card glass-card">
    <div class="card-header">
      <div class="title-group">
        <div class="card-title">
          <PieChart :size="16" class="text-cyan" />
          <span>Asset Class Allocation</span>
        </div>
        <div class="card-subtitle">Diversification across vaults & asset types</div>
      </div>
    </div>

    <div class="donut-content">
      <!-- Donut Canvas with Center Stats -->
      <div class="donut-wrapper">
        <div class="canvas-box">
          <canvas ref={canvasRef}></canvas>
        </div>
        <div class="donut-center-text">
          <div class="center-count">{{ categoryAllocation.length }}</div>
          <div class="center-sub">Classes</div>
        </div>
      </div>

      <!-- Categories Breakdown List -->
      <div class="category-list">
        <div
          v-for="cat in categoryAllocation"
          :key="cat.key"
          class="category-item"
        >
          <div class="cat-top">
            <div class="cat-left">
              <span class="color-dot" :style="{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }"></span>
              <span class="cat-name">{{ cat.label }}</span>
            </div>
            <div class="cat-right font-mono">
              <span class="cat-val">{{ formatMoney(cat.valueCHF) }}</span>
              <span class="cat-pct">{{ cat.percentage.toFixed(1) }}%</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="cat-progress-track">
            <div
              class="cat-progress-fill"
              :style="{ width: `${cat.percentage}%`, backgroundColor: cat.color }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.allocation-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.text-cyan {
  color: var(--accent-cyan);
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.donut-content {
  display: grid;
  grid-template-columns: 220px 1fr;
  align-items: center;
  gap: 24px;
}

.donut-wrapper {
  position: relative;
  width: 190px;
  height: 190px;
  margin: 0 auto;
}

.canvas-box {
  width: 100%;
  height: 100%;
}

.donut-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.center-count {
  font-size: 1.6rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: var(--text-primary);
  line-height: 1;
}

.center-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.cat-name {
  color: var(--text-secondary);
  font-weight: 600;
}

.cat-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-val {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.84rem;
}

.cat-pct {
  color: var(--text-muted);
  font-size: 0.78rem;
  min-width: 42px;
  text-align: right;
}

.cat-progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 99px;
  overflow: hidden;
}

.cat-progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease;
}

@media (max-width: 720px) {
  .donut-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
import { usePortfolio } from '../composables/usePortfolio';
import { BarChart3 } from 'lucide-vue-next';

Chart.register(...registerables);

const {
  accountStats,
  accounts,
  convert,
  currency,
} = usePortfolio();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

function initChart() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  const labels = accounts.value.map(a => a.name.replace(' Wallet', '').replace(' Global', '').replace(' & Metals', ''));
  const costData = accounts.value.map(a => {
    const stat = accountStats.value.get(a.id);
    return convert(stat ? stat.totalCostCHF : 0);
  });
  const valueData = accounts.value.map(a => {
    const stat = accountStats.value.get(a.id);
    return convert(stat ? stat.totalValueCHF : 0);
  });

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Invested Cost Basis',
          data: costData,
          backgroundColor: 'rgba(148, 163, 184, 0.35)',
          hoverBackgroundColor: 'rgba(148, 163, 184, 0.55)',
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.75,
        },
        {
          label: 'Current Market Value',
          data: valueData,
          backgroundColor: '#F8D030',
          hoverBackgroundColor: '#fde047',
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.75,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#94a3b8',
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 11,
              weight: 'bold',
            },
            boxWidth: 12,
            boxHeight: 12,
            useBorderRadius: true,
            borderRadius: 3,
          },
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
              const val = Number(context.parsed.y) || 0;
              return ` ${context.dataset.label}: ${currency.value} ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(val)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 11,
              weight: 'bold',
            },
          },
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
            },
            callback: function (val) {
              return `${Math.round(Number(val) / 1000)}k`;
            },
          },
        },
      },
    },
  });
}

function updateChart() {
  if (!chartInstance) return;
  const costData = accounts.value.map(a => {
    const stat = accountStats.value.get(a.id);
    return convert(stat ? stat.totalCostCHF : 0);
  });
  const valueData = accounts.value.map(a => {
    const stat = accountStats.value.get(a.id);
    return convert(stat ? stat.totalValueCHF : 0);
  });

  chartInstance.data.datasets[0].data = costData;
  chartInstance.data.datasets[1].data = valueData;
  chartInstance.update();
}

watch([accountStats, currency], () => {
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
  <div class="cost-value-card glass-card">
    <div class="card-header">
      <div class="title-group">
        <div class="card-title">
          <BarChart3 :size="16" class="text-blue" />
          <span>Average Cost vs. Market Value per Vault</span>
        </div>
        <div class="card-subtitle">Visualizes cost basis against current valuation for each account</div>
      </div>
    </div>

    <div class="canvas-container">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.cost-value-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: flex-start;
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

.text-blue {
  color: var(--accent-blue);
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.canvas-container {
  position: relative;
  height: 260px;
  width: 100%;
}

@media (max-width: 640px) {
  .cost-value-card {
    padding: 16px;
  }
  .canvas-container {
    height: 220px;
  }
}
</style>

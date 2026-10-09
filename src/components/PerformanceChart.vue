<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
import { usePortfolio } from '../composables/usePortfolio';
import type { TimeRange } from '../types/portfolio';
import { TrendingUp, Layers } from 'lucide-vue-next';

Chart.register(...registerables);

const {
  selectedTimeRange,
  performanceHistory,
  convert,
  currency,
} = usePortfolio();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
const showCostBasis = ref<boolean>(true);

const timeRanges: TimeRange[] = ['24H', '7D', '1M', '6M', '1Y', 'ALL'];

function initChart() {
  if (!canvasRef.value) return;

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  const currentData = performanceHistory[selectedTimeRange.value] || performanceHistory['1M'];
  const labels = currentData.map(d => d.date);
  const values = currentData.map(d => convert(d.value));
  const costs = currentData.map(d => convert(d.costBasis));

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(248, 208, 48, 0.38)');
  gradient.addColorStop(0.5, 'rgba(248, 208, 48, 0.10)');
  gradient.addColorStop(1, 'rgba(10, 14, 23, 0.0)');

  const datasets: any[] = [
    {
      label: 'Net Worth',
      data: values,
      borderColor: '#F8D030',
      borderWidth: 2.5,
      backgroundColor: gradient,
      fill: true,
      tension: 0.35,
      pointRadius: values.length > 10 ? 0 : 3.5,
      pointHoverRadius: 6,
      pointBackgroundColor: '#F8D030',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
  ];

  if (showCostBasis.value) {
    datasets.push({
      label: 'Invested Cost Basis',
      data: costs,
      borderColor: 'rgba(255, 255, 255, 0.35)',
      borderWidth: 1.5,
      borderDash: [5, 5],
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
    });
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
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
          titleFont: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 11,
          },
          bodyFont: {
            family: "'JetBrains Mono', monospace",
            size: 13,
            weight: 'bold',
          },
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
            color: '#64748b',
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 11,
            },
          },
        },
        y: {
          position: 'right',
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
  const currentData = performanceHistory[selectedTimeRange.value] || performanceHistory['1M'];
  const labels = currentData.map(d => d.date);
  const values = currentData.map(d => convert(d.value));
  const costs = currentData.map(d => convert(d.costBasis));

  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = values;

  if (showCostBasis.value) {
    if (chartInstance.data.datasets.length > 1) {
      chartInstance.data.datasets[1].data = costs;
    } else {
      chartInstance.data.datasets.push({
        label: 'Invested Cost Basis',
        data: costs,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    }
  } else {
    if (chartInstance.data.datasets.length > 1) {
      chartInstance.data.datasets.pop();
    }
  }

  chartInstance.update();
}

watch([selectedTimeRange, currency, showCostBasis], () => {
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
  <div class="chart-card glass-card">
    <div class="chart-header">
      <div class="chart-title-group">
        <div class="chart-title">
          <TrendingUp :size="16" class="text-accent" />
          <span>Historical Growth & Cost Curve</span>
        </div>
        <div class="chart-subtitle">Tracks aggregated valuation against your invested cost basis</div>
      </div>

      <div class="chart-controls">
        <!-- Cost Basis Toggle -->
        <button
          class="toggle-btn"
          :class="{ active: showCostBasis }"
          @click="showCostBasis = !showCostBasis"
          title="Toggle Cost Basis benchmark line"
        >
          <Layers :size="14" />
          <span>Cost Basis</span>
        </button>

        <!-- Time Range Selector -->
        <div class="timeframe-group">
          <button
            v-for="range in timeRanges"
            :key="range"
            class="range-btn"
            :class="{ active: selectedTimeRange === range }"
            @click="selectedTimeRange = range"
          >
            {{ range }}
          </button>
        </div>
      </div>
    </div>

    <!-- Chart Canvas Container -->
    <div class="canvas-container">
      <canvas ref={canvasRef}></canvas>
    </div>

    <!-- Chart Legend Info -->
    <div class="chart-legend-footer">
      <div class="legend-indicator">
        <span class="line-dot cyan"></span>
        <span>Portfolio Net Worth</span>
      </div>
      <div v-if="showCostBasis" class="legend-indicator">
        <span class="line-dot dashed"></span>
        <span>Invested Cost Basis</span>
      </div>
      <div class="legend-note">
        Updated in real-time
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.chart-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.text-accent {
  color: var(--accent-cyan);
}

.chart-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.toggle-btn.active {
  background: rgba(0, 210, 255, 0.15);
  border-color: rgba(0, 210, 255, 0.35);
  color: var(--accent-cyan);
}

.timeframe-group {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 2px;
}

.range-btn {
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

.range-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.canvas-container {
  position: relative;
  height: 280px;
  width: 100%;
}

.chart-legend-footer {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.legend-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.line-dot {
  width: 12px;
  height: 3px;
  border-radius: 2px;
}

.line-dot.cyan {
  background: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
}

.line-dot.dashed {
  background: transparent;
  border-top: 2px dashed rgba(255, 255, 255, 0.5);
}

.legend-note {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--text-dim);
}

@media (max-width: 640px) {
  .chart-card {
    padding: 16px;
  }
  .canvas-container {
    height: 220px;
  }
  .chart-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

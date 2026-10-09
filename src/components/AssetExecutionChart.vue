<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { Asset, Transaction } from '../types/portfolio';
import { usePortfolio } from '../composables/usePortfolio';


Chart.register(...registerables);

const props = defineProps<{
  asset: Asset;
  transactions: Transaction[];
  availableAssets?: Asset[];
}>();

const emit = defineEmits<{
  (e: 'select-asset', asset: Asset): void;
}>();

const { formatMoney, convert, currency } = usePortfolio();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// Filter transactions that belong to this specific asset
const assetTransactions = computed(() => {
  const sym = props.asset.symbol.toLowerCase();
  const name = props.asset.name.toLowerCase();

  return props.transactions.filter(t => {
    if (t.accountId !== props.asset.accountId) return false;
    const p = (t.product || '').toLowerCase();

    if (props.asset.accountId === 'ubs') {
      return p.includes('gold') || p.includes('feingold') || props.asset.symbol === 'FG.g';
    }

    if (props.asset.accountId === 'neon') {
      if (props.asset.symbol === 'COIN') {
        return p.includes('coinbase') || p.includes('coin') || t.isin === 'US19260Q1076';
      }
      return p.includes(sym) || p.includes(name);
    }

    return p.includes(sym) || p.includes(name) || (props.asset.symbol === 'WBETH' && p.includes('wbeth'));
  });
});

// Separate buys and sells
const buyOrders = computed(() => assetTransactions.value.filter(t => t.type === 'BUY'));
const sellOrders = computed(() => assetTransactions.value.filter(t => t.type === 'SELL'));

// Execution analytics
const executionStats = computed(() => {
  const totalBoughtUnits = buyOrders.value.reduce((acc, t) => acc + t.quantity, 0);
  const totalBoughtCost = buyOrders.value.reduce((acc, t) => acc + t.totalValue, 0);
  const avgBuy = totalBoughtUnits > 0 ? totalBoughtCost / totalBoughtUnits : props.asset.avgBuyPrice;

  const totalSoldUnits = sellOrders.value.reduce((acc, t) => acc + t.quantity, 0);
  const totalSoldProceeds = sellOrders.value.reduce((acc, t) => acc + t.totalValue, 0);
  const avgSell = totalSoldUnits > 0 ? totalSoldProceeds / totalSoldUnits : 0;

  // Realized PnL on closed positions
  const realizedPnL = totalSoldUnits > 0 ? (avgSell - avgBuy) * totalSoldUnits : 0;

  // Unrealized PnL on current remaining holdings
  const currentPrice = props.asset.currentPrice;
  const unrealizedPnL = props.asset.quantity * (currentPrice - avgBuy);
  const unrealizedPercent = avgBuy > 0 ? ((currentPrice - avgBuy) / avgBuy) * 100 : 0;

  return {
    totalBoughtUnits,
    totalBoughtCost,
    avgBuy,
    totalSoldUnits,
    totalSoldProceeds,
    avgSell,
    realizedPnL,
    unrealizedPnL,
    unrealizedPercent,
  };
});

// Parse dates into timestamps for chronologic ordering
function parseDate(dateStr: string): number {
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day).getTime();
  }
  return new Date(dateStr).getTime() || Date.now();
}

// Generate Timeline series with Buy & Sell points
const chartTimeline = computed(() => {
  const txs = [...assetTransactions.value].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  
  const timelinePoints: {
    date: string;
    timestamp: number;
    price: number;
    buyTx?: Transaction;
    sellTx?: Transaction;
  }[] = [];

  if (txs.length > 0) {
    txs.forEach((t) => {
      timelinePoints.push({
        date: t.date,
        timestamp: parseDate(t.date),
        price: t.pricePerUnit,
        buyTx: t.type === 'BUY' ? t : undefined,
        sellTx: t.type === 'SELL' ? t : undefined,
      });
    });

    // Add today/latest current price point
    const lastTx = txs[txs.length - 1];
    if (lastTx.date !== 'Today') {
      timelinePoints.push({
        date: 'Today',
        timestamp: Date.now(),
        price: props.asset.currentPrice,
      });
    }
  } else {
    // If no individual order ledger exists (e.g. cold wallet demo asset), synthesize timeline from avgBuy to current
    timelinePoints.push({
      date: 'Acquisition',
      timestamp: Date.now() - 60 * 24 * 3600 * 1000,
      price: props.asset.avgBuyPrice,
      buyTx: {
        id: 'synth-buy',
        accountId: props.asset.accountId,
        date: 'Acquisition',
        type: 'BUY',
        product: props.asset.name,
        quantity: props.asset.quantity,
        unit: props.asset.unit,
        pricePerUnit: props.asset.avgBuyPrice,
        totalValue: props.asset.quantity * props.asset.avgBuyPrice,
        currency: 'CHF',
      },
    });
    timelinePoints.push({
      date: 'Today',
      timestamp: Date.now(),
      price: props.asset.currentPrice,
    });
  }

  return timelinePoints;
});

function initChart() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  const points = chartTimeline.value;
  const labels = points.map(p => p.date);
  const priceValues = points.map(p => convert(p.price));
  const avgBuyConverted = convert(executionStats.value.avgBuy);
  const avgSellConverted = convert(executionStats.value.avgSell);

  // Buy marker points (null when no buy)
  const buyData = points.map(p => (p.buyTx ? convert(p.price) : null));
  // Sell marker points (null when no sell)
  const sellData = points.map(p => (p.sellTx ? convert(p.price) : null));

  // Avg buy constant line
  const avgBuyLine = points.map(() => avgBuyConverted);
  // Avg sell line (if sells exist)
  const avgSellLine = executionStats.value.totalSoldUnits > 0 ? points.map(() => avgSellConverted) : null;

  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(248, 208, 48, 0.25)');
  gradient.addColorStop(0.6, 'rgba(248, 208, 48, 0.05)');
  gradient.addColorStop(1, 'rgba(10, 14, 23, 0)');

  const datasets: any[] = [
    // 1. Historical Price Trajectory
    {
      label: 'Asset Price',
      data: priceValues,
      borderColor: '#F8D030',
      borderWidth: 2.2,
      backgroundColor: gradient,
      fill: true,
      tension: 0.25,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#F8D030',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      order: 3,
    },
    // 2. Average Buy Cost Basis Line
    {
      label: 'Avg Buy (Cost Basis)',
      data: avgBuyLine,
      borderColor: 'rgba(248, 208, 48, 0.65)',
      borderWidth: 1.8,
      borderDash: [6, 4],
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      order: 4,
    },
    // 3. Green Buy Execution Pins
    {
      label: 'Buy Execution',
      data: buyData,
      borderColor: '#ffffff',
      borderWidth: 2,
      backgroundColor: '#10b981',
      pointRadius: (ctx: any) => (ctx.raw !== null ? 7 : 0),
      pointHoverRadius: 10,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2.5,
      showLine: false,
      order: 1,
    },
  ];

  // 4. Red Sell Execution Pins (if any exist)
  if (executionStats.value.totalSoldUnits > 0) {
    datasets.push({
      label: 'Sell Execution',
      data: sellData,
      borderColor: '#ffffff',
      borderWidth: 2,
      backgroundColor: '#ef4444',
      pointRadius: (ctx: any) => (ctx.raw !== null ? 7 : 0),
      pointHoverRadius: 10,
      pointBackgroundColor: '#ef4444',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2.5,
      showLine: false,
      order: 1,
    });

    if (avgSellLine) {
      datasets.push({
        label: 'Avg Sell Execution',
        data: avgSellLine,
        borderColor: 'rgba(239, 68, 68, 0.6)',
        borderWidth: 1.5,
        borderDash: [4, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 4,
      });
    }
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
        mode: 'nearest',
        intersect: true,
      },
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
            boxWidth: 10,
            boxHeight: 10,
            useBorderRadius: true,
            borderRadius: 3,
            filter: (legendItem) => legendItem.text !== 'Asset Price',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(14, 19, 31, 0.96)',
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
            size: 12,
          },
          callbacks: {
            title: function (items) {
              const idx = items[0]?.dataIndex;
              const pt = points[idx];
              return pt ? `Date: ${pt.date}` : '';
            },
            label: function (context) {
              const idx = context.dataIndex;
              const pt = points[idx];
              const dsLabel = context.dataset.label;

              if (dsLabel === 'Buy Execution' && pt?.buyTx) {
                const tx = pt.buyTx;
                return [
                  `🟢 BUY ORDER EXECUTED`,
                  `  Quantity: +${tx.quantity} ${tx.unit}`,
                  `  Price: ${currency.value} ${convert(tx.pricePerUnit).toFixed(2)} / unit`,
                  `  Total Flow: ${currency.value} ${convert(tx.totalValue).toFixed(2)}`,
                  tx.orderRef ? `  Ref: ${tx.orderRef}` : '',
                ].filter(Boolean);
              }

              if (dsLabel === 'Sell Execution' && pt?.sellTx) {
                const tx = pt.sellTx;
                return [
                  `🔴 SELL ORDER EXECUTED`,
                  `  Quantity: -${tx.quantity} ${tx.unit}`,
                  `  Price: ${currency.value} ${convert(tx.pricePerUnit).toFixed(2)} / unit`,
                  `  Total Flow: ${currency.value} ${convert(tx.totalValue).toFixed(2)}`,
                  tx.orderRef ? `  Ref: ${tx.orderRef}` : '',
                ].filter(Boolean);
              }

              if (dsLabel === 'Avg Buy (Cost Basis)') {
                return `🟡 Cost Basis Benchmark: ${currency.value} ${avgBuyConverted.toFixed(2)}`;
              }

              if (dsLabel === 'Avg Sell Execution') {
                return `🔴 Avg Sell Benchmark: ${currency.value} ${avgSellConverted.toFixed(2)}`;
              }

              return `Price: ${currency.value} ${Number(context.parsed.y).toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
          },
          ticks: {
            color: '#64748b',
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 10,
            },
          },
        },
        y: {
          position: 'right',
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
            },
            callback: function (val) {
              return `${currency.value} ${Number(val).toFixed(0)}`;
            },
          },
        },
      },
    },
  });
}

function updateChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  initChart();
}

watch([() => props.asset, () => props.transactions, currency], () => {
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
  <div class="asset-chart-container glass-card">
    <!-- Header with Asset Info & Asset Switcher Pills -->
    <div class="chart-top-bar">
      <div class="asset-profile">
        <div class="asset-titles">
          <div class="asset-symbol-row">
            <span class="symbol-pill">{{ asset.symbol }}</span>
            <span class="asset-title-text">{{ asset.name }}</span>
          </div>
          <div class="asset-sub-text">
            Interactive Price & Trade Execution Ledger
          </div>
        </div>
      </div>

      <!-- Asset Switcher if multiple exist in vault -->
      <div v-if="availableAssets && availableAssets.length > 1" class="asset-switcher">
        <button
          v-for="a in availableAssets"
          :key="a.id"
          class="switch-pill"
          :class="{ active: a.id === asset.id }"
          @click="emit('select-asset', a)"
        >
          {{ a.symbol }}
        </button>
      </div>
    </div>

    <!-- Metric Badges Row -->
    <div class="metrics-grid font-mono">
      <!-- 1. Current Price -->
      <div class="metric-card">
        <div class="m-label">Current Price</div>
        <div class="m-val text-accent">
          {{ currency }} {{ convert(asset.currentPrice).toFixed(2) }}
        </div>
        <div
          class="m-sub"
          :class="asset.currentPrice >= asset.avgBuyPrice ? 'text-profit' : 'text-loss'"
        >
          {{ asset.currentPrice >= asset.avgBuyPrice ? '+' : '' }}{{ (((asset.currentPrice - asset.avgBuyPrice) / (asset.avgBuyPrice || 1)) * 100).toFixed(1) }}% spread
        </div>
      </div>

      <!-- 2. Weighted Average Buy (Cost Basis) -->
      <div class="metric-card">
        <div class="m-label">
          <span class="dot-indicator green-dot"></span>
          Avg Buy Price
        </div>
        <div class="m-val">
          {{ currency }} {{ convert(executionStats.avgBuy).toFixed(2) }}
        </div>
        <div class="m-sub">
          {{ buyOrders.length > 0 ? `${buyOrders.length} Buy orders` : 'Holding basis' }}
        </div>
      </div>

      <!-- 3. Realized / Avg Sell (if sells exist) or Total Acquired -->
      <div v-if="executionStats.totalSoldUnits > 0" class="metric-card">
        <div class="m-label">
          <span class="dot-indicator red-dot"></span>
          Avg Sell Price
        </div>
        <div class="m-val text-loss">
          {{ currency }} {{ convert(executionStats.avgSell).toFixed(2) }}
        </div>
        <div class="m-sub" :class="executionStats.realizedPnL >= 0 ? 'text-profit' : 'text-loss'">
          Realized: {{ formatMoney(executionStats.realizedPnL, { showSign: true }) }}
        </div>
      </div>

      <div v-else class="metric-card">
        <div class="m-label">Total Acquired</div>
        <div class="m-val">
          {{ executionStats.totalBoughtUnits > 0 ? executionStats.totalBoughtUnits.toFixed(1) : asset.quantity }} {{ asset.unit }}
        </div>
        <div class="m-sub">
          Cost: {{ formatMoney(executionStats.totalBoughtCost || (asset.quantity * asset.avgBuyPrice)) }}
        </div>
      </div>

      <!-- 4. Unrealized PnL -->
      <div class="metric-card" :class="executionStats.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'">
        <div class="m-label">Unrealized PnL</div>
        <div class="m-val">
          {{ formatMoney(executionStats.unrealizedPnL, { showSign: true }) }}
        </div>
        <div class="m-sub">
          {{ executionStats.unrealizedPercent >= 0 ? '+' : '' }}{{ executionStats.unrealizedPercent.toFixed(1) }}% ROI
        </div>
      </div>
    </div>

    <!-- Chart Canvas -->
    <div class="chart-canvas-wrapper">
      <canvas ref="canvasRef"></canvas>
    </div>

    <!-- Visual Legend / Execution Explainer -->
    <div class="chart-guide-row">
      <div class="guide-item">
        <span class="pin-symbol green-pin"></span>
        <span>Green Pins = Buy Execution Dates & Prices</span>
      </div>
      <div v-if="executionStats.totalSoldUnits > 0" class="guide-item">
        <span class="pin-symbol red-pin"></span>
        <span>Red Pins = Sell Execution Dates & Prices</span>
      </div>
      <div class="guide-item">
        <span class="line-sample yellow-dashed"></span>
        <span>Dashed Line = Average Buy Cost Basis Benchmark</span>
      </div>
      <div class="guide-item hint">
        <span>Hover pins to view quantity & order ID</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asset-chart-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(14, 19, 31, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  margin-bottom: 20px;
}

.chart-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.asset-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asset-symbol-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.symbol-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(248, 208, 48, 0.15);
  color: #F8D030;
  border: 1px solid rgba(248, 208, 48, 0.3);
}

.asset-title-text {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.asset-sub-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.asset-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.switch-pill {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-pill:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.switch-pill.active {
  background: #F8D030;
  color: #0b0f19;
  font-weight: 700;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.m-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.green-dot {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}

.red-dot {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
}

.m-val {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.m-sub {
  font-size: 11px;
  color: #94a3b8;
}

.chart-canvas-wrapper {
  position: relative;
  height: 240px;
  width: 100%;
}

.chart-guide-row {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: #94a3b8;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.guide-item.hint {
  margin-left: auto;
  color: #64748b;
  font-style: italic;
}

.pin-symbol {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  border: 2px solid #ffffff;
}

.green-pin {
  background: #10b981;
}

.red-pin {
  background: #ef4444;
}

.line-sample {
  width: 16px;
  height: 0px;
  display: inline-block;
}

.yellow-dashed {
  border-top: 2px dashed #F8D030;
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
  .chart-canvas-wrapper {
    height: 200px;
  }
  .guide-item.hint {
    margin-left: 0;
  }
}
</style>

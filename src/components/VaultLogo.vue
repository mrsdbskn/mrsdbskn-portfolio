<script setup lang="ts">
import type { AccountType } from '../types/portfolio';
import metamaskSvg from '../assets/metamask.svg';
import binanceSvg from '../assets/binance.svg';
import tangemSvg from '../assets/tangem.svg';
import ubsSvg from '../assets/ubs.svg';
import neonSvg from '../assets/neon.svg';

const props = withDefaults(
  defineProps<{
    type: AccountType | string;
    size?: number;
  }>(),
  {
    size: 24,
  }
);

function getLogoSrc(type: string): string {
  switch (type.toLowerCase()) {
    case 'metamask':
    case 'crypto_hot':
    case 'web3':
      return metamaskSvg;
    case 'binance':
    case 'crypto_cex':
      return binanceSvg;
    case 'tangem':
    case 'crypto_cold':
      return tangemSvg;
    case 'ubs':
    case 'gold':
      return ubsSvg;
    case 'neon':
    case 'equities':
      return neonSvg;
    default:
      return metamaskSvg;
  }
}
</script>

<template>
  <div
    class="vault-logo-container"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
  >
    <img
      :src="getLogoSrc(props.type)"
      :alt="`${props.type} logo`"
      class="vault-logo-img"
    />
  </div>
</template>

<style scoped>
.vault-logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vault-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}
</style>

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Aura Portfolio E2E & Visual Verification', () => {
  const screenshotsDir = path.resolve('e2e-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  async function setupPrivateVault(page: any) {
    const backup = JSON.parse(fs.readFileSync(path.resolve('mrsdbskn-portfolio-backup.json'), 'utf8'));
    await page.addInitScript((backupData: any) => {
      localStorage.setItem('mrsdbskn_vault_mode_v5', 'private');
      localStorage.setItem('mrsdbskn_private_vault_v5', JSON.stringify({
        accounts: backupData.accounts,
        assets: backupData.assets,
        transactions: backupData.transactions,
      }));
    }, backup);
  }

  async function setupPrivateVaultWithDemo(page: any) {
    const backup = JSON.parse(fs.readFileSync(path.resolve('mrsdbskn-portfolio-backup.json'), 'utf8'));
    const demoAssets = [
      { id: 't-btc', accountId: 'tangem', isDemo: true, symbol: 'BTC', name: 'Bitcoin', category: 'crypto_cold', quantity: 0.65, unit: 'BTC', avgBuyPrice: 42500, currentPrice: 64150, price24hChange: 1.85, sparkline: [62800, 64150] },
      { id: 't-eth', accountId: 'tangem', isDemo: true, symbol: 'ETH', name: 'Ethereum', category: 'crypto_cold', quantity: 4.20, unit: 'ETH', avgBuyPrice: 2150, currentPrice: 2890, price24hChange: 2.40, sparkline: [2780, 2890] },
      { id: 't-sol', accountId: 'tangem', isDemo: true, symbol: 'SOL', name: 'Solana', category: 'crypto_cold', quantity: 35, unit: 'SOL', avgBuyPrice: 92.00, currentPrice: 148.50, price24hChange: -0.65, sparkline: [152, 148.5] },
      { id: 'mm-eth', accountId: 'metamask', isDemo: true, symbol: 'ETH', name: 'Ethereum', category: 'crypto_hot', quantity: 1.15, unit: 'ETH', avgBuyPrice: 2650, currentPrice: 2890, price24hChange: 2.40, sparkline: [2780, 2890] },
      { id: 'mm-arb', accountId: 'metamask', isDemo: true, symbol: 'ARB', name: 'Arbitrum', category: 'crypto_hot', quantity: 1400, unit: 'ARB', avgBuyPrice: 0.88, currentPrice: 0.62, price24hChange: -1.20, sparkline: [0.65, 0.62] },
      { id: 'mm-link', accountId: 'metamask', isDemo: true, symbol: 'LINK', name: 'Chainlink', category: 'crypto_hot', quantity: 110, unit: 'LINK', avgBuyPrice: 12.40, currentPrice: 14.80, price24hChange: 3.10, sparkline: [14.1, 14.8] },
      { id: 'mm-uni', accountId: 'metamask', isDemo: true, symbol: 'UNI', name: 'Uniswap', category: 'crypto_hot', quantity: 125, unit: 'UNI', avgBuyPrice: 6.10, currentPrice: 7.90, price24hChange: 0.80, sparkline: [7.6, 7.9] },
    ];
    await page.addInitScript((data: any) => {
      localStorage.setItem('mrsdbskn_vault_mode_v5', 'private');
      localStorage.setItem('mrsdbskn_private_vault_v5', JSON.stringify({
        accounts: data.accounts,
        assets: [...data.demoAssets, ...data.assets],
        transactions: data.transactions,
      }));
    }, { accounts: backup.accounts, assets: backup.assets, transactions: backup.transactions, demoAssets });
  }

  test('Desktop: loads dashboard, checks 5 vaults, currency switch & privacy mode', async ({ page }) => {
    await setupPrivateVault(page);
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto('/');

    // 1. Check title & header
    await expect(page).toHaveTitle(/mrsdbskn-portfolio/i);
    await expect(page.locator('.logo-title')).toHaveText('mrsdbskn');
    await expect(page.locator('.logo-image')).toBeVisible();

    // 2. Verify Net Worth card loaded
    const mainNumber = page.locator('.main-number');
    await expect(mainNumber).toBeVisible();
    const netWorthText = await mainNumber.innerText();
    expect(netWorthText).toContain('CHF');

    // 3. Verify all 5 accounts in the grid
    const accountNames = ['Tangem Wallet', 'MetaMask Wallet', 'Binance Global', 'UBS key4 gold', 'Neon Invest'];
    for (const name of accountNames) {
      await expect(page.locator(`.account-name:has-text("${name}")`)).toBeVisible();
    }

    // Capture Desktop Dashboard screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01-desktop-dashboard.png'), fullPage: false });

    // 4. Test Currency Switcher to USD
    const usdBtn = page.locator('button.currency-btn:has-text("USD")');
    await usdBtn.click();
    await expect(page.locator('.currency-tag')).toHaveText('USD');
    expect(await mainNumber.innerText()).toContain('$');

    // Switch back to CHF
    await page.locator('button.currency-btn:has-text("CHF")').click();
    await expect(page.locator('.currency-tag')).toHaveText('CHF');
    expect(await mainNumber.innerText()).toContain('CHF');

    // 5. Test Privacy Mode Toggle
    const privacyBtn = page.locator('button[aria-label="Toggle Privacy"]');
    await privacyBtn.click();
    expect(await mainNumber.innerText()).toContain('••••••');

    // Capture Privacy Masked screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '02-desktop-privacy-masked.png') });

    // Turn Privacy Mode back off
    await privacyBtn.click();
    expect(await mainNumber.innerText()).not.toContain('••••••');
  });

  test('Mobile: Google Pixel 10 XL viewport & bottom navigation', async ({ page }) => {
    // Pixel 9 / 10 XL viewport: 412 x 915
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');

    await expect(page.locator('.hero-card')).toBeVisible();

    // Capture Pixel Mobile Dashboard
    await page.screenshot({ path: path.join(screenshotsDir, '03-pixel-mobile-dashboard.png') });

    // Tap 'Analytics' tab on bottom nav
    const analyticsTab = page.locator('.nav-tab-btn:has-text("Analytics")');
    await analyticsTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '04-pixel-mobile-analytics.png') });

    // Tap '5 Vaults' tab
    const vaultsTab = page.locator('.nav-tab-btn:has-text("5 Vaults")');
    await vaultsTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '05-pixel-mobile-vaults.png') });

    // Tap 'Settings' tab
    const settingsTab = page.locator('.nav-tab-btn:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '06-pixel-mobile-settings.png') });
  });

  test('Modals: Add Position, Statement Parser, & Tangem Vault Details', async ({ page }) => {
    await setupPrivateVault(page);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    // 1. Open Add Position modal
    await page.locator('button:has-text("Add Position")').first().click();
    const modal = page.locator('.modal-card');
    await expect(modal).toBeVisible();
    await expect(page.locator('.modal-title')).toHaveText('Add New Asset Position');
    await page.screenshot({ path: path.join(screenshotsDir, '07-modal-add-position.png') });
    await page.locator('.close-btn').click();
    await expect(modal).not.toBeVisible();

    // 2. Open Smart Statement Parser modal
    await page.locator('button:has-text("Import Statement")').first().click();
    await expect(page.locator('.modal-title')).toContainText('Smart Statement');
    
    // Click 'Neon Shares' tab and load extract
    await page.locator('.source-tab:has-text("Neon Shares")').click();
    await page.locator('button:has-text("Simulate: Follow-up Advice")').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.preview-box')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '08-modal-import-neon-parsed.png') });
    await page.locator('.close-btn').click();

    // 3. Open Tangem Wallet details
    await page.locator('.account-card:has-text("Tangem Wallet")').click();
    await expect(page.locator('.vault-title')).toHaveText('Tangem Wallet');
    await page.screenshot({ path: path.join(screenshotsDir, '09-modal-tangem-vault-detail.png') });
    await page.locator('.close-btn').click();

    // 4. Open UBS key4 gold vault details & verify order tranches ledger & execution chart
    await page.locator('.account-card:has-text("UBS key4 gold")').click();
    await expect(page.locator('.vault-title')).toHaveText('UBS key4 gold');
    await expect(page.locator('.stat-number').first()).toBeVisible();
    await expect(page.locator('.asset-chart-container')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '10-modal-ubs-gold-vault.png') });

    // Switch to 'Order Tranches' subtab
    const tranchesTab = page.locator('button.subtab-btn:has-text("Order Tranches")');
    await expect(tranchesTab).toBeVisible();
    await tranchesTab.click();
    await expect(page.locator('.tx-card')).toHaveCount(7);
    await expect(page.locator('.tx-sum-val:has-text("308.8 FG.g")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '11-modal-ubs-gold-tranches.png') });
    await page.locator('.close-btn').click();

    // 5. Open Neon Invest vault details & verify Coinbase position, buys/sells chart and trade ledger
    await page.locator('.account-card:has-text("Neon Invest")').click();
    await expect(page.locator('.vault-title')).toHaveText('Neon Invest');
    await expect(page.locator('.holding-card:has-text("COIN")')).toBeVisible();
    await expect(page.locator('.asset-chart-container')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '12-modal-neon-vault.png') });

    // Switch to Neon 'Order Tranches' subtab
    const neonTranchesTab = page.locator('button.subtab-btn:has-text("Order Tranches")');
    await expect(neonTranchesTab).toBeVisible();
    await neonTranchesTab.click();
    await expect(page.locator('.tx-card:has-text("Coinbase")').first()).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '13-modal-neon-tranches.png') });
    await page.locator('.close-btn').click();

    // 6. Open Binance Global vault details & verify WBETH, BNB, USDC holdings, switcher & execution chart
    await page.locator('.account-card:has-text("Binance Global")').click();
    await expect(page.locator('.vault-title')).toHaveText('Binance Global');
    await expect(page.locator('.holding-card:has-text("WBETH")')).toBeVisible();
    await expect(page.locator('.holding-card:has-text("BNB")')).toBeVisible();
    await expect(page.locator('.holding-card:has-text("USDC")')).toBeVisible();
    await expect(page.locator('.asset-chart-container')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '14-modal-binance-vault.png') });

    // Switch to Binance 'Order Tranches' subtab
    const binanceTranchesTab = page.locator('button.subtab-btn:has-text("Order Tranches")');
    await expect(binanceTranchesTab).toBeVisible();
    await binanceTranchesTab.click();
    await expect(page.locator('.tx-card:has-text("WBETH")').first()).toBeVisible();
    await expect(page.locator('.tx-card:has-text("BNB")').first()).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '15-modal-binance-tranches.png') });
    await page.locator('.close-btn').click();
  });

  test('Demo Data Clearing: Table banner quick clear, Settings management & Undo', async ({ page }) => {
    await setupPrivateVaultWithDemo(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // 1. Verify Demo Data Active banner is visible initially in AssetTable
    const demoBanner = page.locator('.demo-table-banner');
    await expect(demoBanner).toBeVisible();
    await expect(page.locator('.demo-pill')).toHaveText('DEMO DATA ACTIVE');

    // Initially 12 positions (7 demo + 5 verified)
    await expect(page.locator('.asset-row')).toHaveCount(12);

    // 2. Click 'Clear Demo Data' on the table banner
    const clearDemoBtn = page.locator('.btn-clear-demo-table');
    await clearDemoBtn.click();

    // Verify toast appeared
    const toast = page.locator('.table-toast-msg');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Cleared 7 demo positions');

    // Demo banner should disappear
    await expect(demoBanner).not.toBeVisible();

    // Now exactly 5 verified real positions remain: UBS, Neon, and Binance
    await expect(page.locator('.asset-row')).toHaveCount(5);
    await expect(page.locator('.asset-symbol:has-text("UBS key4 gold")')).toBeVisible();
    await expect(page.locator('.asset-symbol:has-text("COIN")')).toBeVisible();
    await expect(page.locator('.asset-symbol:has-text("WBETH")')).toBeVisible();
    await expect(page.locator('.asset-symbol:has-text("BNB")')).toBeVisible();
    await expect(page.locator('.asset-symbol:has-text("USDC")')).toBeVisible();

    // Demo assets (BTC, ETH, SOL from Tangem) are gone
    await expect(page.locator('.account-tag:has-text("Tangem Wallet")')).not.toBeVisible();

    // Capture screenshot of portfolio with ONLY real verified assets
    await page.screenshot({ path: path.join(screenshotsDir, '16-cleared-demo-dashboard.png') });

    // 3. Test Undo / Restore from toast
    const undoBtn = page.locator('.btn-undo-link');
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();

    // Demo banner should reappear with 12 positions
    await expect(page.locator('.demo-table-banner')).toBeVisible();
    await expect(page.locator('.asset-row')).toHaveCount(12);

    // 4. Navigate to Settings and test Demo Management Card
    const settingsNav = page.locator('.nav-tab-btn:has-text("Settings")');
    if (await settingsNav.isVisible()) {
      await settingsNav.click();
    } else {
      // In desktop view, click bottom nav or settings tab
      await page.locator('button.nav-tab-btn:has-text("Settings")').click();
    }
    await page.waitForTimeout(300);

    // Verify Demo Management Card
    const demoCard = page.locator('.settings-card:has-text("Demo Data & Portfolio Management")');
    await expect(demoCard).toBeVisible();
    await expect(demoCard.locator('.status-indicator-badge')).toHaveText('DEMO DATA ACTIVE');
    await page.screenshot({ path: path.join(screenshotsDir, '17-settings-demo-management.png') });

    // Accept browser confirm dialog and click Clear Demo Data in Settings
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('.btn-clear-demo').click();
    await page.waitForTimeout(300);

    // Verify verified mode status
    await expect(demoCard.locator('.status-indicator-badge')).toHaveText('VERIFIED HOLDINGS ONLY');
    await page.screenshot({ path: path.join(screenshotsDir, '18-settings-demo-cleared.png') });
  });

  test('Smart Sync & Deduplication: Last sync date anchor, duplicate detection & partial import', async ({ page }) => {
    await setupPrivateVault(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // 1. Open Import Modal
    await page.locator('button:has-text("Import Statement")').first().click();
    const modal = page.locator('.modal-card');
    await expect(modal).toBeVisible();

    // 2. Select UBS Gold and verify last sync anchor is 31.07.2026 (the last transaction date, NOT today!)
    await page.locator('.source-tab:has-text("UBS Gold")').click();
    const anchorDate = page.locator('.anchor-date');
    await expect(anchorDate).toHaveText('31.07.2026');

    // 3. Test Full Statement upload (All 7 tranches already synced)
    const fullBtn = page.locator('button:has-text("Full UBS Statement (All 7 Tranches Already Synced)")');
    await fullBtn.click();
    await page.waitForTimeout(500);

    // Verify all 7 are flagged as duplicates
    await expect(page.locator('.status-headline')).toContainText('All 7 transaction(s) were already synced on or before 31.07.2026');
    const commitDisabled = page.locator('.commit-btn-disabled');
    await expect(commitDisabled).toBeVisible();
    await expect(commitDisabled).toHaveText('All Transactions Already Synced (0 New)');

    await page.screenshot({ path: path.join(screenshotsDir, '19-import-all-duplicates-detected.png') });

    // 4. Test Follow-up / Overlapping Statement (Jul 31 overlap + New Aug 28 tranche)
    const followupBtn = page.locator('button:has-text("Follow-up Statement (Jul 31 Overlap + New Aug 28 Tranche)")');
    await followupBtn.click();
    await page.waitForTimeout(500);

    // Verify 1 new transaction and 1 duplicate skipped
    await expect(page.locator('.status-headline')).toContainText('Found 1 new transaction(s) after 31.07.2026');
    await expect(page.locator('.dup-highlight')).toContainText('1 duplicate/prior records');

    // Toggle skipped list to verify details
    const toggleSkippedBtn = page.locator('.toggle-skipped-btn');
    await expect(toggleSkippedBtn).toBeVisible();
    await toggleSkippedBtn.click();
    await expect(page.locator('.p-reason')).toContainText(/Already recorded|31\.07\.2026/);

    await page.screenshot({ path: path.join(screenshotsDir, '20-import-partial-overlap-detected.png') });

    // 5. Commit the new transaction
    const mergeBtn = page.locator('.commit-btn');
    await expect(mergeBtn).toContainText('Merge 1 New Transaction(s)');
    await mergeBtn.click();

    // Verify success banner and updated sync date
    const successBanner = page.locator('.success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('Last sync date updated to 28.08.2026');

    await page.screenshot({ path: path.join(screenshotsDir, '21-after-smart-sync-ubs.png') });
  });

  test('Privacy Architecture: Public Demo Fallback, Private Vault mode & JSON backup restore', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // 1. Emulate a first-time visitor on GitHub Pages (clean browser, empty localStorage)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(600);

    // 2. Verify Public Demo Mode is active
    const demoPill = page.locator('.vault-mode-pill.demo');
    await expect(demoPill).toBeVisible();
    await expect(demoPill).toHaveText('Demo Mode');

    // Verify anonymous demo positions in table
    await expect(page.locator('.asset-row:has-text("NESN")')).toBeVisible();
    await expect(page.locator('.asset-row:has-text("Nestlé")')).toBeVisible();
    await expect(page.locator('.asset-row:has-text("Demo 35.0g")')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '26-public-demo-mode-github-pages.png') });

    // 3. Restore verified personal portfolio from mrsdbskn-portfolio-backup.json
    const backupFilePath = path.resolve('mrsdbskn-portfolio-backup.json');
    const fileInput = page.locator('header input[type="file"]');
    await fileInput.setInputFiles(backupFilePath);
    await page.waitForTimeout(600);

    // 4. Verify Private Vault Mode is unlocked
    const privatePill = page.locator('.vault-mode-pill.private');
    await expect(privatePill).toBeVisible();
    await expect(privatePill).toHaveText('Private Vault');

    // Verify verified positions loaded (COIN 59 shares, UBS Gold 308.8g, WBETH)
    await expect(page.locator('.asset-row:has-text("Coinbase")')).toBeVisible();
    await expect(page.locator('.asset-row:has-text("308.8g Feingold")')).toBeVisible();
    await expect(page.locator('.asset-row:has-text("WBETH")')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '27-private-vault-mode-restored.png') });

    // 5. Test 1-click toggle back to Demo Mode for public screen sharing
    await privatePill.click();
    await page.waitForTimeout(400);
    await expect(page.locator('.vault-mode-pill.demo')).toBeVisible();
    await expect(page.locator('.asset-row:has-text("NESN")')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '28-toggled-back-to-demo.png') });

    // 6. Return to Private Vault
    await page.locator('.vault-mode-pill.demo').click();
    await page.waitForTimeout(400);
    await expect(page.locator('.vault-mode-pill.private')).toBeVisible();
  });
});




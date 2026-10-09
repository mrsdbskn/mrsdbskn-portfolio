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

  test('Desktop: loads dashboard, checks 5 vaults, currency switch & privacy mode', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto('/');

    // 1. Check title & header
    await expect(page).toHaveTitle(/Aura Portfolio/i);
    await expect(page.locator('.logo-title')).toHaveText('AURA');

    // 2. Verify Net Worth card loaded
    const mainNumber = page.locator('.main-number');
    await expect(mainNumber).toBeVisible();
    const netWorthText = await mainNumber.innerText();
    expect(netWorthText).toContain('CHF');

    // 3. Verify all 5 accounts in the grid
    const accountNames = ['Tangem Wallet', 'MetaMask Wallet', 'Binance Global', 'UBS Safe & Metals', 'Neon Invest'];
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
    await expect(page.locator('.modal-title')).toHaveText('Smart Statement & CSV/PDF Parser');
    
    // Click 'Load NEON Sample Extract'
    await page.locator('button:has-text("Load NEON Sample Extract")').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.preview-box')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '08-modal-import-neon-parsed.png') });
    await page.locator('.close-btn').click();

    // 3. Open Tangem Wallet details
    await page.locator('.account-card:has-text("Tangem Wallet")').click();
    await expect(page.locator('.vault-title')).toHaveText('Tangem Wallet');
    await page.screenshot({ path: path.join(screenshotsDir, '09-modal-tangem-vault-detail.png') });
    await page.locator('.close-btn').click();
  });
});

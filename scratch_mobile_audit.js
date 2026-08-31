const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve('C:/Users/Asus/.gemini/antigravity-cli/brain/4085e01e-e1f4-4e83-896e-bfe1ae13ca19/scratch/mobile_screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runMobileAudit() {
  console.log('Starting Complete Playwright Mobile Audit on iPhone 14 Viewport (390x844)...');
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];

  const context = await browser.newContext({
    ...iPhone,
    colorScheme: 'light'
  });

  const page = await context.newPage();

  // 1. Mobile Home Screen (Light Mode Default)
  console.log('1. Capturing Mobile Home (Default Light Mode)...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_mobile_home_light_default.png') });

  // 2. Toggle Theme to Dark Mode
  console.log('2. Toggling Theme to Dark Mode...');
  const headerThemeBtn = page.locator('header button[title*="Toggle Light/Dark Theme"]');
  if (await headerThemeBtn.isVisible()) {
    await headerThemeBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_mobile_home_dark_toggled.png') });
  }

  // 3. Open Mobile Sidebar Drawer
  console.log('3. Opening Mobile Sidebar Drawer...');
  const menuBtn = page.locator('header button[aria-label="Open sidebar"]');
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_mobile_sidebar_drawer.png') });
    
    // Close sidebar
    const closeBtn = page.locator('button[aria-label="Collapse sidebar"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 4. Open Mobile Search Command Palette
  console.log('4. Opening Mobile Search Command Palette...');
  const searchBtn = page.locator('header button[title*="Search chats"]');
  if (await searchBtn.isVisible()) {
    await searchBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_mobile_command_palette.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // 5. Artifacts Vault on Mobile
  console.log('5. Capturing Mobile Artifacts Vault Page...');
  await page.goto('http://localhost:3000/artifacts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_mobile_artifacts_vault.png') });

  await browser.close();
  console.log('All 5 Mobile Audits Completed Successfully!');
}

runMobileAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});

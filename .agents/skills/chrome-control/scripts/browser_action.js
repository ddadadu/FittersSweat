/**
 * Chrome Automation Helper Script
 * Usage:
 *   node browser_action.js <url> [screenshot_output_path]
 */

const fs = require('fs');
const path = require('path');

async function run() {
  const url = process.argv[2];
  const outputPath = process.argv[3] || 'screenshot.png';

  if (!url) {
    console.error('Usage: node browser_action.js <url> [screenshot_output_path]');
    process.exit(1);
  }

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (err) {
    console.error('⚠️ puppeteer package is not installed. Run: npm install -g puppeteer or npx puppeteer');
    process.exit(1);
  }

  console.log(`🌐 Navigating to: ${url}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);

    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error executing browser action:', error);
  } finally {
    await browser.close();
  }
}

run();

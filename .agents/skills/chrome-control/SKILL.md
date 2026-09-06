---
name: chrome-control
description: Automated control, navigation, and testing of Google Chrome or Chromium-based browsers using MCP tools (Puppeteer) or automation scripts. Use this skill when you need to interact with web pages, inspect DOM elements, click buttons, fill out forms, capture screenshots, test frontend UI flows, or scrape dynamic JavaScript-rendered web pages.
---

# Chrome Control & Browser Automation Skill

This skill enables Antigravity to programmatically launch, control, and inspect Google Chrome or Chromium browsers for web testing, UI automation, and dynamic content scraping.

---

## 1. Capabilities & Available Tools

When controlling Chrome, you can perform the following actions:
1. **Navigate**: Open URLs, handle redirects, and wait for network idle.
2. **Interact**: Click buttons/links, type into input fields, select dropdowns, and press keys.
3. **Inspect**: Read full DOM, extract text, evaluate JavaScript expressions in page context.
4. **Capture**: Take full-page or element screenshots and store them as artifacts.
5. **Session/Cookie Management**: Connect to an active Chrome profile or launch clean isolated sandbox sessions.

---

## 2. Interaction Modes

### Mode A: Antigravity Built-in Browser Subagent
- **When to use**: Quick browsing, visual inspection, or interactive web verification directly inside chat.
- **Trigger**: Run the `/browser` slash command or ask the agent to browse and inspect a URL.

### Mode B: MCP Puppeteer Server
- **MCP Server Name**: `puppeteer` (`@modelcontextprotocol/server-puppeteer`)
- **Key Tools**:
  - `puppeteer_navigate`: Navigate to any URL.
  - `puppeteer_screenshot`: Capture a screenshot of the current page.
  - `puppeteer_click`: Click an element via CSS selector.
  - `puppeteer_fill`: Input text into form fields.
  - `puppeteer_select`: Choose select dropdown options.
  - `puppeteer_hover`: Hover over UI elements.
  - `puppeteer_evaluate`: Execute arbitrary JavaScript code in the browser context.

### Mode C: Direct Automation Scripting (Node.js + Puppeteer / Playwright)
- If MCP tools are offline or fine-grained programmatic control is required, execute automation scripts using the bundled helpers in `./scripts/`.

---

## 3. Step-by-Step Workflow

### Step 1: Launch or Connect to Chrome
- For local debugging with your own user profile:
  ```bash
  # macOS Chrome Remote Debugging Launch
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome_dev_profile" &
  ```
- Or run headless browser automation via Puppeteer scripts.

### Step 2: Navigate and Wait for State
- Always wait for network idle (`networkidle2`) or specific selector before interacting:
  ```javascript
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.target-element');
  ```

### Step 3: Perform Interactions
- Target elements using resilient CSS selectors or text-based XPath.
- For form submission:
  1. `await page.type('#input-id', 'value');`
  2. `await page.click('#submit-btn');`
  3. `await page.waitForNavigation();`

### Step 4: Verification & Artifacts
- Save screenshots to `<appDataDir>/brain/<conversation-id>/` for user visual confirmation:
  ```javascript
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  ```

---

## 4. Best Practices & Safety

1. **Credentials & Auth**: Never hardcode credentials in automation scripts. Use environment variables.
2. **Headless vs Headful**: Default to headless mode (`headless: "new"`) for speed and CI compatibility; use headful (`headless: false`) when visual debugging is required.
3. **Timeouts**: Always configure explicit navigation timeouts (e.g., 30,000ms) to prevent hanging tasks.
4. **Cleanup**: Always close pages and browser instances in `finally` blocks:
   ```javascript
   try { ... } finally { await browser.close(); }
   ```

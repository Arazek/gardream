const { chromium } = require('playwright');

const stories = [
  // DataDisplay
  { id: 'shared-datadisplay-avatar--with-image', label: 'Avatar' },
  { id: 'shared-datadisplay-badge--primary', label: 'Badge' },
  { id: 'shared-datadisplay-chip--default', label: 'Chip' },
  { id: 'shared-datadisplay-chiplist--default', label: 'ChipList' },
  // Layout
  { id: 'shared-layout-card--default', label: 'Card' },
  { id: 'shared-layout-divider--default', label: 'Divider' },
  { id: 'shared-layout-pageheader--default', label: 'PageHeader' },
  { id: 'shared-layout-section--default', label: 'Section' },
  // Forms
  { id: 'shared-forms-formfield--default', label: 'FormField' },
  { id: 'shared-forms-selectfield--default', label: 'SelectField' },
  { id: 'shared-forms-textareafield--default', label: 'TextareaField' },
  { id: 'shared-forms-togglefield--default', label: 'ToggleField' },
  { id: 'shared-forms-searchbar--default', label: 'SearchBar' },
  // Feedback
  { id: 'shared-feedback-inlinealert--info', label: 'InlineAlert' },
  { id: 'shared-feedback-errorstate--default', label: 'ErrorState' },
  { id: 'shared-feedback-successstate--default', label: 'SuccessState' },
  { id: 'shared-feedback-emptystate--default', label: 'EmptyState' },
  { id: 'shared-feedback-loadingskeleton--default', label: 'LoadingSkeleton' },
  // Media
  { id: 'shared-media-imagewithfallback--default', label: 'ImageWithFallback' },
  // Auth
  { id: 'shared-auth-logo--initial-fallback', label: 'Logo' },
  { id: 'shared-auth-socialloginbutton--google', label: 'SocialLoginButton' },
  // Lists
  { id: 'shared-lists-listitem--default', label: 'ListItem' },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const story of stories) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    const url = `http://localhost:6006/iframe.html?id=${story.id}&viewMode=story`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);

      const screenshotPath = `/tmp/story_${story.label.toLowerCase().replace(/\s+/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Check if page has content or is empty
      const bodyText = await page.evaluate(() => document.body.innerText.trim());
      const bodyHTML = await page.evaluate(() => document.body.innerHTML.trim());
      const hasContent = bodyHTML.length > 50;

      results.push({
        label: story.label,
        id: story.id,
        screenshot: screenshotPath,
        consoleErrors: consoleErrors,
        hasContent,
        bodyTextLength: bodyText.length,
        bodyHTMLLength: bodyHTML.length
      });

      console.log(`[DONE] ${story.label} - HTML: ${bodyHTML.length} chars, Errors: ${consoleErrors.length}`);
    } catch (e) {
      results.push({
        label: story.label,
        id: story.id,
        error: e.message,
        consoleErrors
      });
      console.log(`[ERROR] ${story.label}: ${e.message}`);
    }

    await page.close();
  }

  await browser.close();

  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    const issues = [];
    if (r.error) issues.push(`LOAD_ERROR: ${r.error}`);
    if (r.consoleErrors && r.consoleErrors.length > 0) issues.push(`CONSOLE_ERRORS: ${r.consoleErrors.join(' | ')}`);
    if (r.bodyHTMLLength < 100) issues.push(`LIKELY_EMPTY (HTML: ${r.bodyHTMLLength})`);

    const status = issues.length > 0 ? 'ISSUE' : 'OK';
    console.log(`${status} | ${r.label} | ${issues.join(', ')}`);
  }

  // Write JSON for detailed review
  require('fs').writeFileSync('/tmp/story_results.json', JSON.stringify(results, null, 2));
})();

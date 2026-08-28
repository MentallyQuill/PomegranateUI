import { test, expect } from '@playwright/test';

const HARNESSES = [
  ['Atmospheric Workbench', '/prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html'],
  ['Widget overhaul', '/prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html']
];

for (const [name, url] of HARNESSES) {
  test(`${name} preserved oracle`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.goto(url);
    await page.waitForFunction(() => /^(?:PASS|FAIL) —/.test(document.title), null, { timeout: 120_000 });
    const title = await page.title();
    const resultText = await page.locator('#results').innerText();
    const heading = (await page.locator('#results h1').innerText()).trim();
    const match = heading.match(/^(\d+)\/(\d+) passed$/);
    testInfo.annotations.push({ type: 'preserved-result', description: `${name}: ${heading}` });
    if (!title.startsWith('PASS —') || !match || match[1] !== match[2] || Number(match[2]) <= 0 || await page.locator('#results .fail').count()) {
      await testInfo.attach('preserved-results.txt', { body: Buffer.from(resultText), contentType: 'text/plain' });
      await testInfo.attach('preserved-results.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    }
    expect(title).toMatch(/^PASS —/);
    expect(await page.locator('#results .fail').count()).toBe(0);
    expect(match, `Unexpected result heading: ${heading}`).not.toBeNull();
    expect(Number(match[1])).toBeGreaterThan(0);
    expect(match[1]).toBe(match[2]);
  });
}

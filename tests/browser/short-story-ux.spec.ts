import { expect, test } from '@playwright/test';

for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
  test(`${theme} keeps readable transcript space below the story title in short landscape`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByText('Developer tools', { exact: true }).click();
    await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: theme, exact: true }).click();
    await page.getByText('Developer tools', { exact: true }).click();
    const evidence = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON();
      const content = document.querySelector<HTMLElement>('[data-story-stage] [data-pom-part="widget.content"]')!;
      return {
        heading: box('.story-context-heading'),
        frame: box('[data-story-stage] .widget-frame'),
        content: content.getBoundingClientRect().toJSON(),
        composer: box('[data-story-composer] [data-widget-type="story.composer"]'),
        overflow: getComputedStyle(content).overflowY
      };
    });
    await testInfo.attach('reading-geometry', { body: JSON.stringify(evidence), contentType: 'application/json' });
    expect(evidence.frame.top).toBeGreaterThanOrEqual(evidence.heading.bottom + 4);
    expect(evidence.content.height).toBeGreaterThanOrEqual(64);
    expect(evidence.frame.bottom, JSON.stringify(evidence)).toBeLessThanOrEqual(evidence.composer.top - 4);
    expect(evidence.overflow).toBe('auto');
    await page.screenshot({ path: testInfo.outputPath('short-landscape.png') });
  });
}

import { expect, test, type Page } from '@playwright/test';

async function fresh(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  const labOrigin = `http://127.0.0.1:${process.env.POM_PLAYWRIGHT_PORT ?? '4174'}`;
  await page.goto(labOrigin);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

test('Character rows cycle through name-only, small, and large modes', async ({ page }) => {
  await fresh(page);

  const widget = page.getByRole('article', { name: 'Characters' });
  const roster = widget.getByRole('list', { name: 'Characters roster' });
  const decrease = widget.getByRole('button', { name: 'Decrease character portrait size' });
  const increase = widget.getByRole('button', { name: 'Increase character portrait size' });
  const portraits = roster.locator('.recording-character-portrait');
  await expect(roster).toHaveAttribute('data-portrait-scale', '2');
  await expect(portraits).toHaveCount(4);
  const smallPortrait = await portraits.first().boundingBox();
  const smallRow = await roster.getByRole('listitem').first().boundingBox();
  expect(smallPortrait).not.toBeNull();
  expect(smallRow).not.toBeNull();

  await decrease.click();
  await expect(roster).toHaveAttribute('data-portrait-scale', '1');
  await expect(portraits).toHaveCount(0);
  await expect(decrease).toBeDisabled();
  await expect(roster.getByRole('listitem').first()).toHaveText('Aven Rook');

  await increase.click();
  await expect(roster).toHaveAttribute('data-portrait-scale', '2');
  await increase.click();
  await expect(roster).toHaveAttribute('data-portrait-scale', '3');
  await expect(increase).toBeDisabled();
  const largePortrait = await portraits.first().boundingBox();
  const largeRow = await roster.getByRole('listitem').first().boundingBox();
  expect(largePortrait).not.toBeNull();
  expect(largeRow).not.toBeNull();
  expect(largePortrait!.width).toBeGreaterThan(smallPortrait!.width + 10);
  expect(largePortrait!.height).toBeGreaterThan(smallPortrait!.height + 10);
  expect(largeRow!.height).toBeGreaterThan(smallRow!.height + 10);
});

test('Character rows reveal one concise viewpoint-safe synopsis at a time', async ({ page }) => {
  await fresh(page);

  const roster = page.getByRole('article', { name: 'Characters' })
    .getByRole('list', { name: 'Characters roster' });
  const buttons = [
    roster.getByRole('button', { name: 'Aven Rook' }),
    roster.getByRole('button', { name: 'Mara Venn' }),
    roster.getByRole('button', { name: 'Ilex' }),
    roster.getByRole('button', { name: 'The Quiet Diver' })
  ] as const;
  const synopses = [
    'Aven is a measured traveler attuned to patterns beneath the waterline. He is following the warning that drew the cast toward the reservoir.',
    'Mara is a cartographer whose voice reached Aven through the glass. Her warning about the reservoir bell still guides his search.',
    'Ilex is a signal operator Aven has encountered. Their interrupted transmission remains unexplained.',
    'The Quiet Diver is a masked figure encountered during the descent. Their identity and intentions remain unknown.'
  ] as const;
  for (const forbidden of [
    'near the western rail',
    'voice behind the glass',
    'signal room, lower deck',
    'identity unresolved',
    'SEEN',
    'NEAR',
    'AWAY'
  ]) {
    await expect(roster).not.toContainText(forbidden);
  }

  await roster.getByRole('img', { name: 'Portrait of Aven Rook' }).click();
  await expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
  await expect(buttons[0]).toHaveAttribute('aria-controls', 'character-details-0');
  await expect(roster.locator('#character-details-0')).toBeVisible();
  await expect(roster.getByText(synopses[0], { exact: true })).toBeVisible();

  await buttons[1].focus();
  await expect(buttons[1]).toBeFocused();
  await buttons[1].press('Enter');
  await expect(buttons[1]).toBeFocused();
  await expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
  await expect(buttons[0]).not.toHaveAttribute('aria-controls');
  await expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
  await expect(buttons[1]).toHaveAttribute('aria-controls', 'character-details-1');
  await expect(roster.locator('.recording-character-synopsis')).toHaveCount(1);
  await expect(roster.getByText(synopses[1], { exact: true })).toBeVisible();

  await buttons[1].press('Space');
  await expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
  await expect(buttons[1]).not.toHaveAttribute('aria-controls');
  await expect(roster.locator('.recording-character-synopsis')).toHaveCount(0);

  await buttons[2].focus();
  await buttons[2].press('Enter');
  await expect(buttons[2]).toHaveAttribute('aria-expanded', 'true');
  await expect(roster.getByText(synopses[2], { exact: true })).toBeVisible();

  await buttons[3].click();
  await expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
  await expect(buttons[3]).toHaveAttribute('aria-expanded', 'true');
  await expect(roster.locator('.recording-character-synopsis')).toHaveCount(1);
  await expect(roster.getByText(synopses[3], { exact: true })).toBeVisible();
});

test('Name-only Character rows retain a coarse-pointer hit target', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await fresh(page);
    const widget = page.getByRole('article', { name: 'Characters' });
    const roster = widget.getByRole('list', { name: 'Characters roster' });
    await widget.getByRole('button', { name: 'Decrease character portrait size' }).click();
    const nameOnly = roster.getByRole('button', { name: 'Aven Rook' });
    const box = await nameOnly.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  } finally {
    await context.close();
  }
});

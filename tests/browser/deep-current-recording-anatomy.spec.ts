import { expect, test } from '@playwright/test';

import {
  DEEP_RECORDING_IMPLEMENTATION_STATES,
  prepareDeepCurrentState
} from '../conformance/drivers/workbench-lab/deep-current.ts';

const labOrigin = process.env.POM_LAB_ORIGIN ?? 'http://127.0.0.1:4174';

test('Deep Current gives each unified dock and group exactly one material owner', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1280 });
  await page.goto(labOrigin);
  await page.evaluate(() => {
    window.localStorage.removeItem('pomegranate-ui.workbench-lab.layout.v1');
    window.localStorage.removeItem('pomegranate-ui.workbench-lab.theme.v1');
  });
  await page.reload();

  const root = page.locator('main[data-pom-theme="deep-current"]');
  await expect(root).toHaveAttribute('data-pom-widget-grouping', 'unified');

  const shell = page.locator('.workbench-shell');
  const left = page.locator('[data-conformance-region="left"]');
  const right = page.locator('[data-conformance-region="right"]');
  const leftShelf = left.locator(':scope > .dock-shelf');
  const rightShelf = right.locator(':scope > .dock-shelf');
  const leftCharacters = leftShelf.locator(':scope > [data-widget-type="story.characters"]');
  const leftTheme = leftShelf.locator(':scope > [data-widget-type="settings.custom-theme"]');
  const rightEffects = rightShelf.locator(':scope > [data-widget-type="story.room-ambience"]');
  const rightPerspective = rightShelf.locator(':scope > .widget-group');
  const header = page.locator('.top-shelf');

  const geometry = await Promise.all([header, shell, left, leftShelf, right, rightShelf, leftCharacters, leftTheme, rightEffects, rightPerspective].map(async (locator) => {
    const box = await locator.boundingBox();
    if (!box) throw new Error('Recording anatomy surface has no browser geometry.');
    return box;
  }));
  const headerBox = geometry[0]!;
  const shellBox = geometry[1]!;
  const leftBox = geometry[2]!;
  const leftShelfBox = geometry[3]!;
  const rightBox = geometry[4]!;
  const rightShelfBox = geometry[5]!;
  const leftCharactersBox = geometry[6]!;
  const leftThemeBox = geometry[7]!;
  const rightEffectsBox = geometry[8]!;
  const rightPerspectiveBox = geometry[9]!;
  expect(headerBox.height).toBeCloseTo(46, 0);
  expect(leftBox.width).toBeCloseTo(334, 0);
  expect(rightBox.width).toBeCloseTo(335, 0);
  expect(leftShelfBox.height).toBeCloseTo(leftBox.height, 0);
  expect(rightShelfBox.height).toBeCloseTo(rightBox.height, 0);
  expect(leftBox.x).toBeCloseTo(shellBox.x, 0);
  expect(rightBox.x + rightBox.width).toBeCloseTo(shellBox.x + shellBox.width, 0);
  expect(leftCharactersBox.height / leftShelfBox.height).toBeCloseTo(0.413, 2);
  expect(leftThemeBox.height / leftShelfBox.height).toBeCloseTo(0.587, 2);
  expect(rightEffectsBox.height / rightShelfBox.height).toBeCloseTo(0.363, 2);
  expect(rightPerspectiveBox.height / rightShelfBox.height).toBeCloseTo(0.637, 2);

  const stage = page.locator('[data-conformance-region="stage"]');
  const transcript = stage.locator('.transcript');
  const composer = page.locator('[data-pomegranate-region-surface="composer"] .composer');
  const [stageBox, transcriptBox, composerBox] = await Promise.all([stage, transcript, composer].map(async (locator) => {
    const box = await locator.boundingBox();
    if (!box) throw new Error('Recording reader instrument has no browser geometry.');
    return box;
  }));
  expect(transcriptBox!.width).toBeCloseTo(800, 0);
  expect(composerBox!.width).toBeCloseTo(800, 0);
  expect(transcriptBox!.x - stageBox!.x).toBeCloseTo(stageBox!.x + stageBox!.width - transcriptBox!.x - transcriptBox!.width, 0);
  expect(composerBox!.x - stageBox!.x).toBeCloseTo(stageBox!.x + stageBox!.width - composerBox!.x - composerBox!.width, 0);

  const group = page.locator('.widget-group[data-pom-part="group.surface"]').first();
  const nestedFrame = group.locator(':scope > [data-widget-type] .widget-frame').first();
  await expect(group).toBeVisible();
  await expect(nestedFrame).toBeVisible();
  await expect(nestedFrame).not.toHaveAttribute('data-pom-part', 'widget.surface');

  expect(await group.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      radius: style.borderRadius,
      shadow: style.boxShadow
    };
  })).toMatchObject({
    background: 'rgba(16, 25, 26, 0.2)',
    radius: '4px',
    shadow: expect.stringContaining('inset')
  });
  expect(await nestedFrame.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdrop: style.backdropFilter,
      background: style.backgroundColor,
      border: style.borderTopWidth,
      shadow: style.boxShadow
    };
  })).toEqual({
    backdrop: 'none',
    background: 'rgba(0, 0, 0, 0)',
    border: '0px',
    shadow: 'none'
  });

  await expect(page.getByRole('article', { name: 'Characters' }).locator('.widget-frame-meta')).toHaveText('4 / 7');
  await expect(page.getByRole('article', { name: 'Custom Theme' }).locator('.widget-frame-meta')).toHaveText('Local');
  await expect(page.getByRole('article', { name: 'Scene Effects' }).locator('.widget-frame-meta')).toHaveText('Live');

  const swatches = page.getByRole('group', { name: 'Semantic theme colors' }).getByRole('button');
  const swatchColors = await swatches.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
  expect(new Set(swatchColors).size).toBe(5);
  expect(swatchColors.slice(-3)).toEqual(['rgb(148, 217, 208)', 'rgb(231, 246, 240)', 'rgb(210, 181, 122)']);
  await expect(page.getByText('POS 74/41')).toBeVisible();
  await expect(page.getByText(/RAD\s+8/)).toBeVisible();
  await expect(page.getByText(/PWR\s+8/)).toBeVisible();
  const ambientControl = page.getByRole('application', { name: 'Ambient position' });
  expect(await ambientControl.evaluate((element) => getComputedStyle(element).backgroundImage.match(/radial-gradient/g)?.length ?? 0)).toBe(1);
  expect(await ambientControl.locator(':scope > span').evaluate((element) => ({
    radius: getComputedStyle(element).borderRadius,
    transform: getComputedStyle(element).transform
  }))).toMatchObject({ radius: '0px', transform: expect.not.stringMatching(/^none$/) });
});

test('grouped Widget actions remain reachable by pointer and keyboard without motion', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1280 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(labOrigin);
  await page.evaluate(() => {
    window.localStorage.removeItem('pomegranate-ui.workbench-lab.layout.v1');
    window.localStorage.removeItem('pomegranate-ui.workbench-lab.theme.v1');
  });
  await page.reload();

  const tab = page.getByRole('tab', { name: 'AI Connections' });
  await tab.click();
  const widget = page.getByRole('article', { name: 'AI Connections' });
  const nav = widget.getByRole('navigation', { name: 'AI Connections placement' });
  const floatAction = nav.getByRole('button', { name: 'Float' });

  await page.getByRole('link', { name: 'PomegranateUI Workbench Lab' }).focus();
  await page.mouse.move(960, 100);
  await expect(nav).toHaveCSS('opacity', '0');
  await widget.hover();
  await expect(nav).toHaveCSS('opacity', '1');
  await expect(nav).toHaveCSS('transition-duration', '0s');
  await expect(floatAction).toBeVisible();

  await tab.focus();
  await page.keyboard.press('Tab');
  await expect(nav).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => document.activeElement?.matches(':focus-visible'))).toBe(true);

  await widget.hover();
  await floatAction.click();
  await expect(page.locator('[data-pomegranate-floating-layer]').getByRole('article', { name: 'AI Connections' })).toBeVisible();
});

for (const implementationState of DEEP_RECORDING_IMPLEMENTATION_STATES) {
  test(`Deep Current reaches the recording-visible ${implementationState} state`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1280 });
    await prepareDeepCurrentState(page, labOrigin, implementationState);

    const root = page.locator('main[data-pom-theme="deep-current"]');
    await expect(root).toBeVisible();
    await expect(page.locator('[data-conformance-region="stage"] .transcript')).toBeVisible();
    await expect(page.locator('[data-pomegranate-region-surface="composer"] textarea')).toBeVisible();
  });
}

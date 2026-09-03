import { expect, test, type Page } from '@playwright/test';

const labOrigin = process.env.POM_LAB_ORIGIN ?? 'http://127.0.0.1:4174';

async function openFresh(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(labOrigin);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

type ThemeLabel = 'Deep Current' | 'PomOS' | 'Bunny' | 'Ash & Amber';

async function selectTheme(page: Page, theme: ThemeLabel) {
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' })
    .getByRole('button', { name: theme, exact: true })
    .click();
  await page.getByText('Developer tools', { exact: true }).click();
}

async function activatePomOS(page: Page) {
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' })
    .getByRole('button', { name: 'PomOS', exact: true })
    .click();
  await page.getByText('Developer tools', { exact: true }).click();
  await expect(page.locator('main[data-pom-theme-root]')).toHaveAttribute('data-pom-theme', 'pom-neutral');
}

async function colorAlpha(value: string) {
  const slash = value.match(/\/\s*([\d.]+)\s*\)$/);
  if (slash) return Number(slash[1]);
  if (!value.startsWith('rgba(')) return 1;
  return Number(value.match(/,\s*([\d.]+)\s*\)$/)?.[1] ?? 1);
}

async function seedPanelRail(page: Page) {
  const launcher = page.locator('[data-workbench-developer-drawer] > summary');
  await launcher.click();
  for (const name of ['Archive', 'Lore', 'Cast', 'Timeline', 'Notes']) {
    await page.getByRole('button', { name: 'Create Panel' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
    await dialog.getByRole('textbox', { name: 'Panel name' }).fill(name);
    await dialog.getByRole('button', { name: 'Create Panel' }).click();
  }
  await launcher.click();
}

for (const viewport of [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'short desktop', width: 1280, height: 720 },
  { name: 'compact portrait', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
  { name: '200-percent zoom equivalent', width: 800, height: 450 }
]) {
test(`PomOS ${viewport.name} keeps side stacks, composer, and chrome inside their owners`, async ({ page }) => {
  await openFresh(page, viewport.width, viewport.height);
  await activatePomOS(page);

  const evidence = await page.evaluate(() => {
    const rect = (element: Element | null, label: string) => {
      if (!(element instanceof HTMLElement)) throw new Error(`Missing ${label}.`);
      const box = element.getBoundingClientRect();
      return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
    };
    const stack = (selector: string) => {
      const owner = document.querySelector(selector);
      if (!(owner instanceof HTMLElement)) throw new Error(`Missing ${selector}.`);
      return {
        bounds: rect(owner, selector),
        children: [...owner.children]
        .filter((element): element is HTMLElement => element instanceof HTMLElement && getComputedStyle(element).display !== 'none')
        .map((element, index) => ({
          bounds: rect(element, `${selector} child ${index}`),
          internals: [...element.querySelectorAll('.widget-frame, .widget-frame > [data-pom-part="widget.content"]')]
            .filter((descendant): descendant is HTMLElement => descendant instanceof HTMLElement && getComputedStyle(descendant).display !== 'none')
            .map((descendant, descendantIndex) => rect(descendant, `${selector} child ${index} internal ${descendantIndex}`))
        }))
      };
    };
    const visibleShelfChildren = [...document.querySelectorAll('.top-shelf > *')]
      .filter((element): element is HTMLElement => element instanceof HTMLElement && getComputedStyle(element).display !== 'none')
      .map((element, index) => rect(element, `shelf child ${index}`));
    const visibleShelfInternals = [...document.querySelectorAll('.top-shelf :is([role="tab"], .story-lockup > *, .shelf-actions > *)')]
      .filter((element): element is HTMLElement => {
        if (!(element instanceof HTMLElement)) return false;
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return bounds.width > 0
          && bounds.height > 0
          && style.display !== 'none'
          && style.visibility !== 'hidden'
          && style.clip === 'auto';
      })
      .map((element, index) => rect(element, `shelf internal ${index}`));

    return {
      viewport: { width: innerWidth, height: innerHeight },
      shelf: rect(document.querySelector('.top-shelf'), 'top shelf'),
      shelfChildren: visibleShelfChildren,
      shelfInternals: visibleShelfInternals,
      panelTabs: rect(document.querySelector('.panel-tabs'), 'panel tabs'),
      tabs: [...document.querySelectorAll('.panel-tabs [role="tab"]')].map((element, index) => rect(element, `panel tab ${index}`)),
      shelfActions: rect(document.querySelector('.shelf-actions'), 'shelf actions'),
      wordmarkCopy: [...document.querySelectorAll<HTMLElement>('.wordmark > :is(strong, small)')].map((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth
      })),
      catalogLauncher: rect(document.querySelector('[data-pom-action="open-catalog"]'), 'catalog launcher'),
      developerLauncher: rect(document.querySelector('[data-workbench-developer-drawer] > summary'), 'developer launcher'),
      workbench: rect(document.querySelector('.workbench-shell'), 'workbench'),
      leftDock: rect(document.querySelector('[data-conformance-region="left"]'), 'left dock'),
      leftStack: stack('[data-conformance-region="left"] > .dock-shelf'),
      rightDock: rect(document.querySelector('[data-conformance-region="right"]'), 'right dock'),
      rightStack: stack('[data-conformance-region="right"] > .dock-shelf'),
      stage: rect(document.querySelector('[data-conformance-region="stage"]'), 'stage'),
      transcript: rect(document.querySelector('[data-widget-type="story.transcript"]'), 'transcript'),
      transcriptHeader: rect(document.querySelector('[data-widget-type="story.transcript"] .widget-frame > header'), 'transcript header'),
      transcriptContent: rect(document.querySelector('[data-widget-type="story.transcript"] .widget-frame > [data-pom-part="widget.content"]'), 'transcript content'),
      composer: rect(document.querySelector('[data-conformance-region="composer"]'), 'composer region'),
      composerSurface: rect(document.querySelector('[data-widget-type="story.composer"] .composer'), 'composer surface'),
      textarea: rect(document.querySelector('[data-widget-type="story.composer"] textarea'), 'composer textarea'),
      submit: rect(document.querySelector('[data-widget-type="story.composer"] .composer > button'), 'composer submit')
    };
  });

  const expectContained = (
    child: { top: number; right: number; bottom: number; left: number },
    owner: { top: number; right: number; bottom: number; left: number },
    label: string
  ) => {
    expect(child.top, `${label} top`).toBeGreaterThanOrEqual(owner.top - 1);
    expect(child.right, `${label} right`).toBeLessThanOrEqual(owner.right + 1);
    expect(child.bottom, `${label} bottom`).toBeLessThanOrEqual(owner.bottom + 1);
    expect(child.left, `${label} left`).toBeGreaterThanOrEqual(owner.left - 1);
  };
  const expectSeparated = (
    siblings: Array<{ top: number; bottom: number }>,
    label: string
  ) => {
    for (let index = 1; index < siblings.length; index += 1) {
      expect(siblings[index]!.top, `${label} ${index - 1}/${index} boundary`).toBeGreaterThanOrEqual(siblings[index - 1]!.bottom - 1);
    }
  };

  for (const [index, child] of evidence.shelfChildren.entries()) expectContained(child, evidence.shelf, `shelf child ${index}`);
  for (const [index, child] of evidence.shelfInternals.entries()) expectContained(child, evidence.shelf, `shelf internal ${index}`);
  expectContained(evidence.catalogLauncher, evidence.shelf, 'catalog launcher');
  expectContained(evidence.developerLauncher, evidence.shelf, 'developer launcher');
  for (const [index, tab] of evidence.tabs.entries()) expectContained(tab, evidence.panelTabs, `panel tab ${index}`);
  if (viewport.width <= 680) {
    expect(evidence.panelTabs.right, 'panel tabs end before compact Catalog launcher')
      .toBeLessThanOrEqual(evidence.catalogLauncher.left + 1);
    expect(evidence.catalogLauncher.right, 'compact Catalog launcher ends before Developer launcher')
      .toBeLessThanOrEqual(evidence.developerLauncher.left + 1);
    expect(evidence.developerLauncher.right, 'compact Developer launcher ends inside shelf actions')
      .toBeLessThanOrEqual(evidence.shelfActions.right + 1);
  } else if (viewport.width <= 860) {
    for (const [index, copy] of evidence.wordmarkCopy.entries()) {
      expect(copy.scrollWidth, `wordmark line ${index} remains unclipped`).toBeLessThanOrEqual(copy.clientWidth + 1);
    }
  }
  if (viewport.width <= 860) {
    expect(evidence.leftDock.width, 'hidden left dock width').toBeLessThanOrEqual(1);
    expect(evidence.rightDock.width, 'hidden right dock width').toBeLessThanOrEqual(1);
  } else {
    expectContained(evidence.leftStack.bounds, evidence.leftDock, 'left stack');
    for (const [index, child] of evidence.leftStack.children.entries()) {
      expectContained(child.bounds, evidence.leftStack.bounds, `left stack child ${index}`);
      for (const [internalIndex, internal] of child.internals.entries()) {
        expectContained(internal, child.bounds, `left stack child ${index} internal ${internalIndex}`);
      }
    }
    expectSeparated(evidence.leftStack.children.map((child) => child.bounds), 'left stack');
    expectContained(evidence.rightStack.bounds, evidence.rightDock, 'right stack');
    for (const [index, child] of evidence.rightStack.children.entries()) {
      expectContained(child.bounds, evidence.rightStack.bounds, `right stack child ${index}`);
      for (const [internalIndex, internal] of child.internals.entries()) {
        expectContained(internal, child.bounds, `right stack child ${index} internal ${internalIndex}`);
      }
    }
    expectSeparated(evidence.rightStack.children.map((child) => child.bounds), 'right stack');
  }
  expectContained(evidence.composer, evidence.workbench, 'composer region');
  expectContained(evidence.transcript, evidence.stage, 'transcript');
  expect(evidence.transcriptContent.top, 'transcript content begins after its visible header')
    .toBeGreaterThanOrEqual(evidence.transcriptHeader.bottom - 1);
  expect(evidence.composer.left).toBeGreaterThanOrEqual(evidence.stage.left - 1);
  expect(evidence.composer.right).toBeLessThanOrEqual(evidence.stage.right + 1);
  expectContained(evidence.composerSurface, evidence.composer, 'composer surface');
  expectContained(evidence.textarea, evidence.composerSurface, 'composer textarea');
  expectContained(evidence.submit, evidence.composerSurface, 'composer submit');
  expect(evidence.composer.bottom).toBeLessThanOrEqual(evidence.viewport.height);
});
}

test('PomOS Room Ambience keeps compact labels and stable value rows', async ({ page }) => {
  await openFresh(page, 1280, 720);
  await activatePomOS(page);

  const ambience = page.getByRole('region', { name: 'Current room ambience' });
  const rows = ambience.locator('dl > div');
  await expect(rows).toHaveCount(4);
  const geometry = await rows.evaluateAll((elements) => elements.map((element) => {
    const rect = (element: Element | null) => {
      if (!(element instanceof HTMLElement)) throw new Error('Missing Room Ambience row part.');
      const box = element.getBoundingClientRect();
      return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height, centerY: (box.top + box.bottom) / 2 };
    };
    return {
      row: rect(element),
      name: rect(element.querySelector('dt')),
      value: rect(element.querySelector('dd'))
    };
  }));
  for (const [index, row] of geometry.entries()) {
    expect(row.name.left, `row ${index} name left`).toBeGreaterThanOrEqual(row.row.left);
    expect(row.value.right, `row ${index} value right`).toBeLessThanOrEqual(row.row.right);
    expect(Math.abs(row.name.centerY - row.value.centerY), `row ${index} label/value alignment`).toBeLessThanOrEqual(1);
    expect(row.row.height, `row ${index} stable height`).toBeGreaterThanOrEqual(39);
  }
});

test('PomOS constrained side stacks expose deterministic focused scroll owners', async ({ page }) => {
  await openFresh(page, 1280, 450);
  await activatePomOS(page);

  const evidence = await page.evaluate(() => {
    const scrollOwner = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing scroll owner: ${selector}`);
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        overflowY: getComputedStyle(element).overflowY,
        before: element.scrollTop,
        after: (() => {
          element.scrollTop = element.scrollHeight;
          return element.scrollTop;
        })()
      };
    };
    return {
      characters: scrollOwner('[data-widget-type="story.characters"] .recording-characters > ul'),
      materials: scrollOwner('[data-widget-type="settings.theme-materials"] .implemented-widget'),
      ambience: scrollOwner('[data-widget-type="story.room-ambience"] .atmospheric-room-ambience')
    };
  });

  for (const [name, owner] of Object.entries(evidence)) {
    expect(owner.overflowY, `${name} overflow policy`).toBe('auto');
    expect(owner.scrollHeight, `${name} has constrained content`).toBeGreaterThan(owner.clientHeight);
    expect(owner.after, `${name} scroll position advances`).toBeGreaterThan(owner.before);
  }
});

test('PomOS grouped controls keep one translucent material owner and transparent nested rows', async ({ page }) => {
  await openFresh(page, 1440, 900);
  await activatePomOS(page);

  const evidence = await page.evaluate(() => {
    const group = document.querySelector<HTMLElement>('.widget-group:has([data-surface-type="story.room-ambience"])');
    if (!group) throw new Error('Missing Room Ambience group.');
    const nestedRow = group.querySelector<HTMLElement>('.atmospheric-room-ambience dl > div');
    if (!nestedRow) throw new Error('Missing Room Ambience row.');
    const groupStyle = getComputedStyle(group);
    const rowStyle = getComputedStyle(nestedRow);
    const alpha = (color: string) => Number(color.match(/[\d.]+(?=\))/g)?.at(-1) ?? (color.startsWith('rgb(') ? 1 : 0));
    return {
      groupPart: group.dataset.pomPart,
      groupAlpha: alpha(groupStyle.backgroundColor),
      groupBackdrop: groupStyle.backdropFilter,
      rowAlpha: alpha(rowStyle.backgroundColor),
      rowShadow: rowStyle.boxShadow,
      rowBackdrop: rowStyle.backdropFilter
    };
  });

  expect(evidence.groupPart).toBe('group.surface');
  expect(evidence.groupAlpha).toBeGreaterThanOrEqual(0.3);
  expect(evidence.groupAlpha).toBeLessThanOrEqual(0.6);
  expect(evidence.groupBackdrop).toContain('blur(');
  expect(evidence.rowAlpha).toBe(0);
  expect(evidence.rowShadow).toBe('none');
  expect(evidence.rowBackdrop).toBe('none');
});

test('PomOS metadata remains legible and the compact composer retains its complete status line', async ({ page }) => {
  await openFresh(page, 1440, 900);
  await activatePomOS(page);

  const wideType = await page.evaluate(() => {
    const fontSize = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing typography sample: ${selector}`);
      return Number.parseFloat(getComputedStyle(element).fontSize);
    };
    return {
      wordmark: fontSize('.wordmark small'),
      storyLabel: fontSize('.story-lockup span'),
      storyMeta: fontSize('.story-lockup small'),
      transcriptKicker: fontSize('.transcript .widget-kicker'),
      themeControls: fontSize('[data-theme-authoring-element="materials"]'),
      presence: fontSize('[data-testid="character-presence"]'),
      composerStatus: fontSize('.composer-field > .composer-meta')
    };
  });
  for (const [name, size] of Object.entries(wideType)) {
    expect(size, `${name} font size`).toBeGreaterThanOrEqual(name === 'themeControls' || name === 'transcriptKicker' ? 10 : 9);
  }

  await openFresh(page, 390, 844);
  await activatePomOS(page);
  const compactStatus = await page.locator('.composer-field > .composer-meta').evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const field = element.parentElement!.getBoundingClientRect();
    return {
      fontSize: Number.parseFloat(style.fontSize),
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      contained: bounds.top >= field.top - 1 && bounds.bottom <= field.bottom + 1
    };
  });
  expect(compactStatus).toMatchObject({ fontSize: 9, whiteSpace: 'normal', textOverflow: 'clip', contained: true });
  expect(compactStatus.scrollWidth).toBeLessThanOrEqual(compactStatus.clientWidth + 1);
  expect(compactStatus.scrollHeight).toBeLessThanOrEqual(compactStatus.clientHeight + 1);
});

test('PomOS icon actions keep real names and 44px targets while essential labels remain text', async ({ page }) => {
  await openFresh(page, 1440, 900);
  await activatePomOS(page);

  const actions = page.locator('[data-pom-icon-action]:visible');
  expect(await actions.count()).toBeGreaterThanOrEqual(4);
  for (let index = 0; index < await actions.count(); index += 1) {
    const evidence = await actions.nth(index).evaluate((button) => {
      const icon = button.querySelector<HTMLElement>('[data-pom-action-icon]');
      const label = button.querySelector<HTMLElement>('[data-pom-action-label]');
      if (!icon || !label) throw new Error('IconAction is missing its semantic presentation children.');
      const bounds = button.getBoundingClientRect();
      return {
        accessibleName: button.getAttribute('aria-label'),
        iconDisplay: getComputedStyle(icon).display,
        labelDisplay: getComputedStyle(label).display,
        width: bounds.width,
        height: bounds.height
      };
    });
    expect(evidence.accessibleName?.trim().length).toBeGreaterThan(0);
    expect(['grid', 'inline-grid']).toContain(evidence.iconDisplay);
    expect(evidence.labelDisplay).toBe('none');
    expect(evidence.width).toBeGreaterThanOrEqual(44);
    expect(evidence.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByRole('tab', { name: 'Scene' })).toHaveText('Scene');
  await expect(page.getByRole('article', { name: 'Transcript' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Water Remembers' })).toHaveText('The Water Remembers');

  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: 'Deep Current', exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', 'deep-current');
  const legacyAction = page.locator('[data-pom-icon-action]:visible').first();
  await expect(legacyAction.locator('[data-pom-action-icon]')).toHaveCSS('display', 'none');
  await expect(legacyAction.locator('[data-pom-action-label]')).toBeVisible();
  const legacyBounds = await legacyAction.evaluate((button) => {
    const label = button.querySelector<HTMLElement>('[data-pom-action-label]');
    if (!label) throw new Error('Legacy text action is missing its visible label.');
    const owner = button.getBoundingClientRect();
    const content = label.getBoundingClientRect();
    return { owner: { left: owner.left, right: owner.right }, content: { left: content.left, right: content.right } };
  });
  expect(legacyBounds.content.left).toBeGreaterThanOrEqual(legacyBounds.owner.left - 1);
  expect(legacyBounds.content.right).toBeLessThanOrEqual(legacyBounds.owner.right + 1);
});

test('native workbench keeps literal relationships and keyboard navigation without rail reorder', async ({ page }) => {
  await openFresh(page, 1440, 900);
  const tabs = page.getByRole('tablist', { name: 'Panels' })
    .locator(':scope > [data-pomegranate-panel-tab] > [role="tab"]');
  await expect(tabs).toHaveCount(3);
  const scene = page.getByRole('tab', { name: 'Scene' });
  const scenePanelId = await scene.getAttribute('aria-controls');
  const sceneTabId = await scene.getAttribute('id');
  expect(scenePanelId).toBeTruthy();
  expect(sceneTabId).toBeTruthy();
  await expect(page.locator(`#${scenePanelId}`)).toHaveAttribute('aria-labelledby', sceneTabId!);
  await expect(scene.locator('xpath=..')).toHaveAttribute('data-pomegranate-panel-tab', 'scene');
  await expect(scene).toHaveAttribute('aria-keyshortcuts', 'Shift+F10');
  const optionsDescriptionId = await scene.getAttribute('aria-describedby');
  expect(optionsDescriptionId).toBeTruthy();
  await expect(page.locator(`#${optionsDescriptionId}`)).toHaveText(
    'Right-click or press Shift+F10 for tab options.'
  );
  const order = await tabs.allTextContents();
  await page.getByRole('tab', { name: 'Library' }).press('Control+Shift+ArrowLeft');
  await expect(tabs).toHaveText(order);
  await expect(scene).toBeFocused();
  await page.getByRole('tab', { name: 'Scene' }).press('End');
  await expect(page.getByRole('tab', { name: 'Settings' })).toBeFocused();
  await expect(tabs).toHaveText(order);
  await page.getByRole('tab', { name: 'Settings' }).press('Home');
  await expect(scene).toBeFocused();
  await expect(page.getByLabel('Active story identity')).toContainText('STORY / 7E-19');
});

test('non-compact Panel tabs keep secondary actions out of their visible spacing', async ({ page }) => {
  await openFresh(page, 1440, 900);
  await page.getByText('Developer tools', { exact: true }).click();
  const pomosTarget = page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: 'PomOS', exact: true });
  await pomosTarget.click();
  await page.getByText('Developer tools', { exact: true }).click();

  const gaps = await page.getByRole('tablist', { name: 'Panels' }).getByRole('tab').evaluateAll((tabs) => tabs.slice(0, -1).map((tab, index) => {
    const current = tab.getBoundingClientRect();
    const next = tabs[index + 1]!.getBoundingClientRect();
    return Math.round(next.left - current.right);
  }));

  expect(gaps).toHaveLength(2);
  expect(Math.max(...gaps)).toBeLessThanOrEqual(8);
});

test('the target-aware Panel context menu escapes the tab strip and remains functional', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 980, height: 720 },
    { width: 844, height: 390 },
    { width: 720, height: 1280 },
    { width: 720, height: 450 },
    { width: 412, height: 915 }
  ]) {
    await openFresh(page, viewport.width, viewport.height);
    await page.getByRole('tab', { name: 'Settings' }).click();
    const target = page.getByRole('tab', { name: 'Settings' });
    await expect(page.getByRole('button', { name: 'Manage Settings' })).toHaveCount(0);
    await target.focus();
    await target.press('Shift+F10');

    const menu = page.getByRole('dialog', { name: 'Settings Panel actions' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('textbox', { name: 'Panel name' })).toBeFocused();
    const geometry = await menu.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const tabs = document.querySelector('[role="tablist"][aria-label="Panels"]')!.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        insideViewport: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
        extendsBeyondTabStrip: rect.bottom > tabs.bottom + 20
      };
    });
    expect(geometry.width).toBeGreaterThan(180);
    expect(geometry.height).toBeGreaterThan(180);
    expect(geometry.insideViewport).toBe(true);
    expect(geometry.extendsBeyondTabStrip).toBe(true);

    await menu.getByRole('button', { name: 'Rename' }).press('Enter');
    await expect(menu).not.toBeVisible();
    await expect(target).toBeFocused();
  }
});

test('Atmospheric composition keeps developer chrome out of the default stage and keyboard reachable', async ({ page }) => {
  await openFresh(page, 1600, 900);
  await expect(page.locator('.context-rail, .lab-footer')).toHaveCount(0);
  const drawer = page.locator('[data-workbench-developer-drawer]');
  await expect(drawer).not.toHaveAttribute('open', '');
  const launcher = page.getByText('Developer tools', { exact: true });
  const [runtimeBox, launcherBox] = await Promise.all([
    page.locator('.runtime-status').boundingBox(),
    drawer.locator('> summary').boundingBox()
  ]);
  expect(runtimeBox).not.toBeNull();
  expect(launcherBox).not.toBeNull();
  expect(runtimeBox!.x + runtimeBox!.width).toBeLessThanOrEqual(1600);
  expect(launcherBox!.width).toBeLessThanOrEqual(2);
  expect(launcherBox!.height).toBeLessThanOrEqual(2);
  await launcher.focus();
  await page.keyboard.press('Enter');
  await expect(drawer).toHaveAttribute('open', '');
  await expect(page.getByRole('button', { name: 'Save layout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveAttribute('open', '');
  await expect(launcher).toBeFocused();

  const transcript = page.locator('[data-widget-type="story.transcript"]');
  await expect(transcript.locator('[data-pom-part="widget.surface"]')).toHaveCount(0);
  await expect(transcript.locator('.transcript')).toBeVisible();
  await expect(page.locator('[data-story-composer] textarea')).toBeVisible();
});

test('compact Panel rail keeps natural tabs, truthful cues, fixed actions, and document containment', async ({ page }) => {
  await openFresh(page, 390, 844);
  await seedPanelRail(page);
  const rail = page.locator('[data-tab-rail-scroll][aria-label="Panels"]');
  const finePointerTrigger = page.locator('[data-panel-tab-actions-trigger]');
  await expect(finePointerTrigger).toHaveCount(1);
  await expect(finePointerTrigger).toHaveAttribute('aria-label', 'Open Notes Panel actions');
  await expect(finePointerTrigger).toBeHidden();
  await page.waitForTimeout(100);
  await rail.evaluate((node) => {
    node.scrollLeft = 0;
    node.dispatchEvent(new Event('scroll'));
  });
  await expect.poll(() => rail.getAttribute('data-overflow-before')).toBe('false');
  const shell = rail.locator('..');
  const beforeCue = shell.locator('[data-tab-rail-edge="before"]');
  const afterCue = shell.locator('[data-tab-rail-edge="after"]');

  const start = await rail.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    cursor: getComputedStyle(node).cursor,
    tabs: [...node.children].map((item) => {
      const tab = item.querySelector<HTMLElement>('[role="tab"]');
      if (!tab) throw new Error('Missing Panel tab.');
      return {
        shrink: getComputedStyle(item).flexShrink,
        clientWidth: tab.clientWidth,
        scrollWidth: tab.scrollWidth,
        whiteSpace: getComputedStyle(tab).whiteSpace
      };
    })
  }));
  expect(start.scrollWidth).toBeGreaterThan(start.clientWidth);
  expect(start.cursor).toBe('grab');
  for (const tab of start.tabs) {
    expect(tab.shrink).toBe('0');
    expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth + 1);
    expect(tab.whiteSpace).toBe('nowrap');
  }
  await expect(beforeCue).toHaveCSS('opacity', '0');
  await expect(afterCue).toHaveCSS('opacity', '1');
  await expect(beforeCue).toHaveCSS('pointer-events', 'none');
  await expect(afterCue).toHaveCSS('pointer-events', 'none');

  await rail.evaluate((node) => { node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2; });
  await expect.poll(() => rail.getAttribute('data-overflow-before')).toBe('true');
  await expect.poll(() => rail.getAttribute('data-overflow-after')).toBe('true');
  await expect(beforeCue).toHaveCSS('opacity', '1');
  await expect(afterCue).toHaveCSS('opacity', '1');

  await rail.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
  await expect.poll(() => rail.getAttribute('data-overflow-after')).toBe('false');
  await expect(beforeCue).toHaveCSS('opacity', '1');
  await expect(afterCue).toHaveCSS('opacity', '0');

  const containment = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    catalogWidth: document.querySelector<HTMLElement>('[data-pom-action="open-catalog"]')?.getBoundingClientRect().width ?? 0,
    developerWidth: document.querySelector<HTMLElement>('[data-workbench-developer-drawer] > summary')?.getBoundingClientRect().width ?? 0
  }));
  expect(containment.documentWidth).toBeLessThanOrEqual(containment.viewportWidth);
  expect(containment.catalogWidth).toBeGreaterThanOrEqual(44);
  expect(containment.developerWidth).toBeGreaterThanOrEqual(44);
});

test('fine-pointer Panel rail cursor reflects only active horizontal panning', async ({ page }) => {
  await openFresh(page, 390, 844);
  await seedPanelRail(page);
  const rail = page.locator('[data-tab-rail-scroll][aria-label="Panels"]');
  const tab = page.getByRole('tab', { name: 'Scene' });
  await rail.evaluate((node) => {
    node.scrollLeft = 0;
    node.dispatchEvent(new Event('scroll'));
  });
  await expect.poll(() => rail.getAttribute('data-overflow-after')).toBe('true');
  await expect(rail).toHaveAttribute('data-panning', 'false');
  await expect(rail).toHaveCSS('cursor', 'grab');

  const box = await tab.boundingBox();
  if (!box) throw new Error('Missing visible Scene tab geometry.');
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await expect(rail).toHaveAttribute('data-panning', 'false');
  await expect(rail).toHaveCSS('cursor', 'grab');
  await page.mouse.move(startX + 2, startY + 2);
  await expect(rail).toHaveAttribute('data-panning', 'false');
  await expect(rail).toHaveCSS('cursor', 'grab');
  await page.mouse.move(startX + 2, startY + 12);
  await expect(rail).toHaveAttribute('data-panning', 'false');
  await expect(rail).toHaveCSS('cursor', 'grab');
  await page.mouse.up();

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 14, startY + 2);
  await expect(rail).toHaveAttribute('data-panning', 'true');
  await expect(rail).toHaveCSS('cursor', 'grabbing');
  await page.mouse.up();
  await expect(rail).toHaveAttribute('data-panning', 'false');
  await expect(rail).toHaveCSS('cursor', 'grab');
});

test('compact Panel actions and reorder dialog are opaque bounded bottom sheets', async ({ page }) => {
  await openFresh(page, 390, 844);
  const settings = page.getByRole('tab', { name: 'Settings' });
  await settings.click({ button: 'right' });
  const actions = page.getByRole('dialog', { name: 'Settings Panel actions' });
  await expect(actions).toBeVisible();
  const panelName = actions.getByRole('textbox', { name: 'Panel name' });
  const reorderPanels = actions.getByRole('button', { name: 'Reorder Panels…' });
  await expect(panelName).toBeFocused();
  await panelName.press('Shift+Tab');
  await expect(reorderPanels).toBeFocused();
  await reorderPanels.press('Tab');
  await expect(panelName).toBeFocused();
  const actionStyle = await actions.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const backdrop = getComputedStyle(node, '::backdrop');
    return {
      bottom: box.bottom,
      viewport: innerHeight,
      maxHeight: style.maxHeight,
      overflowY: style.overflowY,
      background: style.backgroundColor,
      backdrop: backdrop.backgroundColor
    };
  });
  expect(actionStyle.bottom).toBeGreaterThanOrEqual(actionStyle.viewport - 1);
  expect(actionStyle.overflowY).toBe('auto');
  expect(await colorAlpha(actionStyle.background)).toBe(1);
  expect(await colorAlpha(actionStyle.backdrop)).toBeGreaterThan(0);

  await reorderPanels.click();
  const order = page.getByRole('dialog', { name: 'Reorder Panels' });
  const orderStyle = await order.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const list = node.querySelector<HTMLElement>('[data-tab-order-list]');
    if (!list) throw new Error('Missing Panel order list.');
    return {
      bottom: box.bottom,
      viewport: innerHeight,
      height: box.height,
      background: style.backgroundColor,
      backdrop: getComputedStyle(node, '::backdrop').backgroundColor,
      listOverflowY: getComputedStyle(list).overflowY,
      footerPaddingBottom: getComputedStyle(node.querySelector('footer')!).paddingBottom
    };
  });
  expect(orderStyle.bottom).toBeGreaterThanOrEqual(orderStyle.viewport - 1);
  expect(orderStyle.height).toBeLessThanOrEqual(orderStyle.viewport * .8 + 1);
  expect(orderStyle.listOverflowY).toBe('auto');
  expect(parseFloat(orderStyle.footerPaddingBottom)).toBeGreaterThanOrEqual(16);
  expect(await colorAlpha(orderStyle.background)).toBe(1);
  expect(await colorAlpha(orderStyle.backdrop)).toBeGreaterThan(0);
});

test('Developer tools uses a centered inline SVG and an independent 44px accessible target', async ({ page }) => {
  await openFresh(page, 390, 844);
  const button = page.locator('[data-workbench-developer-drawer] > summary');
  const icon = button.locator('svg[aria-hidden="true"]');
  await expect(button).toHaveAccessibleName('Developer tools');
  await expect(button).toHaveText('Developer tools');
  await expect(icon).toHaveCount(1);
  const geometry = await button.evaluate((node) => {
    const svg = node.querySelector('svg');
    if (!svg) throw new Error('Missing Developer tools SVG.');
    const buttonBox = node.getBoundingClientRect();
    const iconBox = svg.getBoundingClientRect();
    return {
      button: { left: buttonBox.left, right: buttonBox.right, top: buttonBox.top, bottom: buttonBox.bottom },
      icon: { left: iconBox.left, right: iconBox.right, top: iconBox.top, bottom: iconBox.bottom }
    };
  });
  expect(geometry.button.right - geometry.button.left).toBeGreaterThanOrEqual(44);
  expect(geometry.button.bottom - geometry.button.top).toBeGreaterThanOrEqual(44);
  expect(Math.abs((geometry.icon.left + geometry.icon.right) / 2 - (geometry.button.left + geometry.button.right) / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs((geometry.icon.top + geometry.icon.bottom) / 2 - (geometry.button.top + geometry.button.bottom) / 2)).toBeLessThanOrEqual(1);
});

test('normal public mode removes the developer gear and reclaims its compact chrome slot', async ({ page }) => {
  const url = new URL(labOrigin);
  url.searchParams.set('dev', '0');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url.href);

  const root = page.locator('main[data-pom-theme-root]');
  await expect(root).toHaveAttribute('data-workbench-developer-tools', 'disabled');
  await expect(page.locator('[data-workbench-developer-drawer]')).toHaveCount(0);
  const geometry = await page.locator('.shelf-actions').evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { width: box.width, right: box.right, viewport: innerWidth };
  });
  expect(geometry.width).toBe(44);
  expect(geometry.right).toBe(geometry.viewport);
});

test('explicit developer mode opens a hittable drawer on mobile', async ({ page }) => {
  const url = new URL(labOrigin);
  url.searchParams.set('dev', '1');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url.href);

  const root = page.locator('main[data-pom-theme-root]');
  await page.getByText('Developer tools', { exact: true }).click();
  const surface = page.locator('.developer-drawer-surface');
  await expect(surface).toBeVisible();
  expect(await surface.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + 24);
    return hit !== null && node.contains(hit);
  })).toBe(true);
  await expect(root).toHaveAttribute('data-workbench-developer-tools', 'enabled');
});

test('wide text-profile Developer tools keeps a centered 44px SVG launcher', async ({ page }) => {
  await openFresh(page, 1440, 900);
  await selectTheme(page, 'Ash & Amber');
  await expect(page.locator('main[data-pom-theme-root]')).toHaveAttribute('data-pom-action-content', 'text');
  const button = page.locator('[data-workbench-developer-drawer] > summary');
  const geometry = await button.evaluate((node) => {
    const svg = node.querySelector('svg[aria-hidden="true"]');
    if (!svg) throw new Error('Missing Developer tools SVG.');
    const buttonBox = node.getBoundingClientRect();
    const iconBox = svg.getBoundingClientRect();
    return {
      width: buttonBox.width,
      height: buttonBox.height,
      horizontalOffset: Math.abs((iconBox.left + iconBox.right) / 2 - (buttonBox.left + buttonBox.right) / 2),
      verticalOffset: Math.abs((iconBox.top + iconBox.bottom) / 2 - (buttonBox.top + buttonBox.bottom) / 2)
    };
  });
  expect(geometry.width).toBeGreaterThanOrEqual(44);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
  expect(geometry.horizontalOffset).toBeLessThanOrEqual(1);
  expect(geometry.verticalOffset).toBeLessThanOrEqual(1);
});

test('all themes keep centered story prose aligned with the composer instrument', async ({ page }) => {
  await openFresh(page, 1600, 900);

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await page.getByText('Developer tools', { exact: true }).click();
    await page.getByRole('group', { name: 'Visual target' })
      .getByRole('button', { name: theme, exact: true })
      .click();
    await page.getByText('Developer tools', { exact: true }).click();

    const geometry = await page.evaluate(() => {
      const box = (selector: string) => {
        const node = document.querySelector<HTMLElement>(selector);
        if (!node) throw new Error(`Missing alignment owner: ${selector}`);
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          center: (rect.left + rect.right) / 2
        };
      };
      const field = document.querySelector<HTMLElement>('[data-widget-type="story.composer"] .composer-field');
      if (!field) throw new Error('Missing composer field');
      return {
        grouping: document.querySelector('main')?.getAttribute('data-pom-widget-grouping'),
        shellPresentation: document.querySelector('main')?.getAttribute('data-pom-shell-presentation'),
        stage: box('[data-conformance-region="stage"]'),
        prose: box('[data-widget-type="story.transcript"] .transcript > p:not(.widget-kicker)'),
        transcript: box('[data-widget-type="story.transcript"] .widget-frame'),
        composer: box('[data-widget-type="story.composer"] .composer'),
        field: box('[data-widget-type="story.composer"] .composer-field'),
        textarea: box('[data-widget-type="story.composer"] textarea'),
        fieldDisplay: getComputedStyle(field).display
      };
    });

    expect(Math.abs(geometry.transcript.center - geometry.stage.center), `${theme} transcript center`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.composer.center - geometry.stage.center), `${theme} composer center`).toBeLessThanOrEqual(1);
    if (geometry.grouping === 'unified') {
      expect(geometry.composer.right - geometry.composer.left, `${theme} unified composer width`).toBeLessThanOrEqual(800.5);
    }
    if (geometry.shellPresentation === 'instrumented') {
      expect(Math.abs(geometry.prose.left - geometry.composer.left), `${theme} Atmospheric prose left edge`).toBeLessThanOrEqual(1);
      expect(Math.abs((geometry.composer.right - geometry.prose.right) - 30), `${theme} Atmospheric prose right gutter`).toBeLessThanOrEqual(1);
    } else {
      expect(Math.abs(geometry.prose.center - geometry.stage.center), `${theme} prose center`).toBeLessThanOrEqual(1);
      expect(
        Math.abs((geometry.prose.left - geometry.composer.left) - (geometry.composer.right - geometry.prose.right)),
        `${theme} prose inset within composer`
      ).toBeLessThanOrEqual(1);
    }
    expect(geometry.fieldDisplay, `${theme} composer field layout`).toBe('grid');
    expect(Math.abs(geometry.textarea.left - (geometry.field.left + 12)), `${theme} textarea left inset`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.textarea.right - (geometry.field.right - 12)), `${theme} textarea right inset`).toBeLessThanOrEqual(1);
  }
});

for (const viewport of [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'recording', width: 1920, height: 1280 },
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 }
]) {
  test(`all themes keep composer text and metadata unclipped at ${viewport.name}`, async ({ page }) => {
    await openFresh(page, viewport.width, viewport.height);

    for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber'] as const) {
      await selectTheme(page, theme);
      const evidence = await page.locator('[data-widget-type="story.composer"] .composer-field')
         .evaluate((field) => {
           const textarea = field.querySelector('textarea');
           const metadata = field.querySelector(':scope > span');
           const placement = field.closest('[data-widget-type="story.composer"]');
           const shelf = field.closest('.dock-shelf');
           const region = field.closest('.dock-region');
           if (!(textarea instanceof HTMLTextAreaElement) || !(metadata instanceof HTMLElement)
             || !(placement instanceof HTMLElement) || !(shelf instanceof HTMLElement)
             || !(region instanceof HTMLElement)) {
             throw new Error('Missing composer text geometry.');
           }
           const fieldBox = field.getBoundingClientRect();
           const metadataBox = metadata.getBoundingClientRect();
           const placementBox = placement.getBoundingClientRect();
           const shelfBox = shelf.getBoundingClientRect();
           const regionBox = region.getBoundingClientRect();
           const textareaStyle = getComputedStyle(textarea);
           return {
            lineHeight: Number.parseFloat(textareaStyle.lineHeight),
            textareaClientHeight: textarea.clientHeight,
            textareaScrollHeight: textarea.scrollHeight,
             metadataClientWidth: metadata.clientWidth,
             metadataScrollWidth: metadata.scrollWidth,
             textareaTop: textarea.getBoundingClientRect().top,
             textareaBottom: textarea.getBoundingClientRect().bottom,
             metadataTop: metadataBox.top,
             fieldTop: fieldBox.top,
             metadataBottom: metadataBox.bottom,
             fieldBottom: fieldBox.bottom,
             fieldWidth: fieldBox.width,
             placementTop: placementBox.top,
             placementBottom: placementBox.bottom,
             placementWidth: placementBox.width,
             shelfTop: shelfBox.top,
             shelfBottom: shelfBox.bottom,
             shelfWidth: shelfBox.width,
             regionTop: regionBox.top,
             regionBottom: regionBox.bottom
           };
         });

      expect(evidence.textareaClientHeight, `${theme} ${viewport.name} textarea line box`)
        .toBeGreaterThanOrEqual(evidence.lineHeight);
      expect(evidence.textareaScrollHeight, `${theme} ${viewport.name} textarea content`)
        .toBeLessThanOrEqual(evidence.textareaClientHeight + 1);
       expect(evidence.metadataScrollWidth, `${theme} ${viewport.name} composer metadata width`)
         .toBeLessThanOrEqual(evidence.metadataClientWidth + 1);
       expect(evidence.textareaTop, `${theme} ${viewport.name} textarea top containment`)
         .toBeGreaterThanOrEqual(evidence.fieldTop - 1);
       expect(evidence.metadataTop, `${theme} ${viewport.name} composer metadata top containment`)
         .toBeGreaterThanOrEqual(evidence.fieldTop - 1);
       expect(evidence.metadataBottom, `${theme} ${viewport.name} composer metadata containment`)
         .toBeLessThanOrEqual(evidence.fieldBottom + 1);
       expect(evidence.placementWidth, `${theme} ${viewport.name} composer width`).toBeGreaterThan(0);
       expect(evidence.fieldWidth, `${theme} ${viewport.name} composer field width`).toBeGreaterThan(0);
       expect(evidence.placementWidth, `${theme} ${viewport.name} composer shelf width`)
         .toBeLessThanOrEqual(evidence.shelfWidth + 1);
       expect(evidence.placementTop, `${theme} ${viewport.name} composer shelf top containment`)
         .toBeGreaterThanOrEqual(evidence.shelfTop - 1);
       expect(evidence.placementBottom, `${theme} ${viewport.name} composer shelf bottom containment`)
         .toBeLessThanOrEqual(evidence.shelfBottom + 1);
       expect(evidence.placementTop, `${theme} ${viewport.name} composer region top containment`)
         .toBeGreaterThanOrEqual(evidence.regionTop - 1);
        expect(evidence.placementBottom, `${theme} ${viewport.name} composer region bottom containment`)
          .toBeLessThanOrEqual(evidence.regionBottom + 1);
        expect(evidence.fieldTop, `${theme} ${viewport.name} composer field shelf top containment`)
          .toBeGreaterThanOrEqual(evidence.shelfTop - 1);
        expect(evidence.fieldBottom, `${theme} ${viewport.name} composer field shelf bottom containment`)
          .toBeLessThanOrEqual(evidence.shelfBottom + 1);
        expect(evidence.textareaTop, `${theme} ${viewport.name} textarea shelf top containment`)
          .toBeGreaterThanOrEqual(evidence.shelfTop - 1);
        expect(evidence.textareaBottom, `${theme} ${viewport.name} textarea shelf bottom containment`)
          .toBeLessThanOrEqual(evidence.shelfBottom + 1);
        expect(evidence.fieldTop, `${theme} ${viewport.name} composer field region top containment`)
          .toBeGreaterThanOrEqual(evidence.regionTop - 1);
        expect(evidence.fieldBottom, `${theme} ${viewport.name} composer field region bottom containment`)
          .toBeLessThanOrEqual(evidence.regionBottom + 1);
      }
  });
}

test('shared Widget headers retain one-line titles without reserving hidden action space', async ({ page }) => {
  await openFresh(page, 1440, 900);

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber'] as const) {
    await selectTheme(page, theme);
    for (const title of ['World State', 'Theme Materials']) {
      const article = page.getByRole('article', { name: title });
      const evidence = await article.evaluate((node) => {
        const heading = node.querySelector('.widget-frame-heading h2');
        const actions = node.querySelector('.widget-frame > header nav');
        if (!(heading instanceof HTMLElement) || !(actions instanceof HTMLElement)) {
          throw new Error('Missing Widget header geometry.');
        }
        const style = getComputedStyle(heading);
        const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.35;
        return {
          headingHeight: heading.getBoundingClientRect().height,
          headingScrollWidth: heading.scrollWidth,
          headingClientWidth: heading.clientWidth,
          lineHeight,
          actionPosition: getComputedStyle(actions).position
        };
      });
      expect(evidence.headingHeight, `${theme} ${title} title height`).toBeLessThanOrEqual(evidence.lineHeight + 1);
      expect(evidence.headingClientWidth, `${theme} ${title} title face`).toBeGreaterThan(0);
      if (theme === 'Ash & Amber') {
        expect(evidence.headingScrollWidth, `${theme} ${title} title width`).toBeLessThanOrEqual(evidence.headingClientWidth + 1);
      }
      expect(evidence.actionPosition, `${theme} ${title} action presentation`)
        .toBe(theme === 'Bunny' ? 'relative' : 'absolute');
    }
  }
});

test('every theme gives the active Panel tab a stable focus-color edge', async ({ page }) => {
  await openFresh(page, 1440, 900);

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber'] as const) {
    await selectTheme(page, theme);
    await page.locator('main').evaluate((root) => root.style.setProperty('--pom-material-button-inset', 'none'));
    const style = await page.getByRole('tab', { name: 'Scene' }).evaluate((tab) => {
      const computed = getComputedStyle(tab);
      const edge = getComputedStyle(tab, '::after');
      return {
        boxShadow: computed.boxShadow,
        edgeColor: edge.backgroundColor,
        edgeContent: edge.content,
        edgeHeight: Number.parseFloat(edge.height),
        selected: tab.getAttribute('aria-selected'),
        shellPresentation: tab.closest('main')?.getAttribute('data-pom-shell-presentation')
      };
    });
    expect(style.selected, `${theme} active Panel identity`).toBe('true');
    expect(style.boxShadow, `${theme} zero-rim material`).toBe('none');
    expect(style.edgeContent, `${theme} active Panel edge content`).not.toBe('none');
    expect(style.edgeHeight, `${theme} active Panel edge height`).toBeGreaterThanOrEqual(style.shellPresentation === 'instrumented' ? 1 : 2);
    expect(style.edgeColor, `${theme} active Panel edge color`).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('all themes keep story prose inside the visible reading stage', async ({ page }) => {
  for (const viewport of [
    { name: 'wide', width: 1440, height: 900 },
    { name: 'short landscape', width: 844, height: 390 }
  ]) {
    await openFresh(page, viewport.width, viewport.height);
    await page.locator('[data-widget-type="story.transcript"] [data-pom-part="widget.content"]')
      .evaluateAll((nodes) => {
        for (const node of nodes as HTMLElement[]) {
          node.style.fontSize = '17px';
          node.style.lineHeight = '1.4';
          node.style.letterSpacing = '.01em';
        }
      });

    for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
      await page.getByText('Developer tools', { exact: true }).click();
      await page.getByRole('group', { name: 'Visual target' })
        .getByRole('button', { name: theme, exact: true })
        .click();
      await page.getByText('Developer tools', { exact: true }).click();

      const geometry = await page.evaluate(() => {
        const rect = (selector: string) => {
          const node = document.querySelector<HTMLElement>(selector);
          if (!node) throw new Error(`Missing visibility owner: ${selector}`);
          const box = node.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height };
        };
        return {
          stage: rect('[data-conformance-region="stage"]'),
          transcript: rect('[data-widget-type="story.transcript"]'),
          prose: rect('[data-widget-type="story.transcript"] .transcript')
        };
      });

      const transcriptIntersection = Math.max(
        0,
        Math.min(geometry.stage.bottom, geometry.transcript.bottom)
          - Math.max(geometry.stage.top, geometry.transcript.top)
      );
      const proseIntersection = Math.max(
        0,
        Math.min(geometry.stage.bottom, geometry.prose.bottom)
          - Math.max(geometry.stage.top, geometry.prose.top)
      );
      expect(transcriptIntersection, `${theme} transcript intersects the ${viewport.name} stage`).toBeGreaterThan(0);
      expect(proseIntersection, `${theme} prose intersects the ${viewport.name} stage`).toBeGreaterThan(0);
    }
  }
});

test('reduced motion removes themed Widget action-rail transitions', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await openFresh(page, 1440, 900);

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await page.getByText('Developer tools', { exact: true }).click();
    await page.getByRole('group', { name: 'Visual target' })
      .getByRole('button', { name: theme, exact: true })
      .click();
    await page.getByText('Developer tools', { exact: true }).click();

    const transition = await page.locator('[data-widget-type="story.characters"]')
      .getByRole('navigation')
      .evaluate((nav) => {
        const style = getComputedStyle(nav);
        return { duration: style.transitionDuration, property: style.transitionProperty };
      });
    expect(transition, `${theme} reduced-motion action rail`).toEqual({ duration: '0s', property: 'none' });
  }
});

test('native workbench Catalog contains focus and restores exact keyboard-placement state', async ({ page }) => {
  await openFresh(page, 1024, 768);
  const launcher = page.getByRole('button', { name: 'Open Widget Catalog', includeHidden: true });
  await launcher.focus();
  await expect(launcher).toBeVisible();
  const focusGeometry = await launcher.evaluate((button) => {
    const shelf = button.closest('.top-shelf');
    if (!(shelf instanceof HTMLElement)) throw new Error('Missing top shelf.');
    const buttonBox = button.getBoundingClientRect();
    const shelfBox = shelf.getBoundingClientRect();
    const style = getComputedStyle(button);
    const outline = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
    return {
      paintedTop: buttonBox.top - outline,
      paintedRight: buttonBox.right + outline,
      paintedBottom: buttonBox.bottom + outline,
      shelfTop: shelfBox.top,
      shelfRight: shelfBox.right,
      shelfBottom: shelfBox.bottom
    };
  });
  expect(focusGeometry.paintedTop).toBeGreaterThanOrEqual(focusGeometry.shelfTop);
  expect(focusGeometry.paintedRight).toBeLessThanOrEqual(focusGeometry.shelfRight);
  expect(focusGeometry.paintedBottom).toBeLessThanOrEqual(focusGeometry.shelfBottom);
  await launcher.press('Enter');
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  await expect(catalog).toBeVisible();
  expect(await catalog.evaluate((element) => element.matches(':modal'))).toBe(true);
  expect(await catalog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  expect(await catalog.evaluate((element) => document.elementFromPoint(2, innerHeight / 2) === element)).toBe(true);
  const results = catalog.locator('[data-catalog-result]');
  await expect(results).toHaveCount(98);
  await expect(catalog.locator('.catalog-foot')).toContainText('98 widgets');
  expect(await catalog.locator('.catalog-results').evaluate((list) => list.scrollHeight > list.clientHeight)).toBe(true);
  const search = catalog.getByRole('searchbox', { name: 'Search Widgets' });
  await search.fill('character');
  await catalog.getByRole('button', { name: 'Library', exact: true }).click();
  await catalog.getByRole('button', { name: 'Compact' }).click();
  await expect(catalog).toHaveAttribute('data-result-mode', 'compact');
  const origin = catalog.locator('[data-catalog-result][data-widget-type="library.character-card"]');
  await origin.scrollIntoViewIfNeeded();
  const scrollTop = await catalog.locator('.catalog-results').evaluate((list) => list.scrollTop);
  await origin.focus();
  await origin.press('Space');
  await expect(catalog).toBeHidden();
  const proxy = page.locator('[data-catalog-placement-proxy]');
  await expect(proxy).toHaveAttribute('data-placement-input', 'keyboard');
  const targets = page.locator('[data-catalog-placement-target]');
  expect(await targets.count()).toBeGreaterThan(0);
  await expect(targets.filter({ has: page.locator('.is-catalog-target-active') })).toHaveCount(0);
  await expect(page.locator('[data-catalog-placement-target].is-catalog-target-active')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-catalog-placement-target].is-catalog-target-active')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(catalog).toBeVisible();
  await expect(catalog).toHaveAttribute('data-result-mode', 'compact');
  await expect(search).toHaveValue('character');
  await expect(catalog.getByRole('button', { name: 'Library', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(origin).toBeFocused();
  await expect.poll(() => catalog.locator('.catalog-results').evaluate((list) => list.scrollTop)).toBe(scrollTop);
  await origin.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-widget-type="library.character-card"]:not([data-catalog-result])')).toHaveCount(1);
  await expect(catalog).toBeVisible();
  await expect(origin).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(catalog).toBeHidden();
  await expect(launcher).toBeFocused();
});

test('Catalog touch commits after 300ms while pointer cancellation and window blur restore exact state', async ({ page, context }) => {
  await openFresh(page, 1024, 768);
  const launcher = page.getByRole('button', { name: 'Open Widget Catalog', includeHidden: true });
  await launcher.press('Enter');
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.scrollIntoViewIfNeeded();
  const box = await result.boundingBox();
  if (!box) throw new Error('Missing touch Catalog result geometry.');
  const point = { x: box.x + 12, y: box.y + 12 };
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await page.waitForTimeout(280);
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveCount(0);
  await page.waitForTimeout(35);
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveAttribute('data-placement-input', 'pointer');
  await expect(catalog).toBeHidden();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(catalog).toBeVisible();
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveCount(0);
  await expect(page.locator('[data-widget-type="library.workspace"]:not([data-catalog-result])')).toHaveCount(0);

  const successBox = await result.boundingBox();
  if (!successBox) throw new Error('Missing successful touch Catalog geometry.');
  const successStart = { x: successBox.x + 12, y: successBox.y + 12 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [successStart] });
  await page.waitForTimeout(315);
  const target = page.locator('[data-catalog-placement-target]').first();
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('Missing successful touch placement target.');
  const destination = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [destination] });
  await expect(page.locator('[data-catalog-placement-target].is-catalog-target-active')).toHaveCount(1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('[data-widget-type="library.workspace"]:not([data-catalog-result])')).toHaveCount(1);
  await expect(catalog).toBeVisible();

  const search = catalog.getByRole('searchbox', { name: 'Search Widgets' });
  await search.fill('library');
  await catalog.getByRole('button', { name: 'Library', exact: true }).click();
  await catalog.getByRole('button', { name: 'Compact', exact: true }).click();
  await result.scrollIntoViewIfNeeded();
  const restoredScrollTop = await catalog.locator('.catalog-results').evaluate((list) => list.scrollTop);
  const blurBox = await result.boundingBox();
  if (!blurBox) throw new Error('Missing blur-cancellation Catalog geometry.');
  const blurStart = { x: blurBox.x + 12, y: blurBox.y + 12 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [blurStart] });
  await page.waitForTimeout(315);
  await expect(catalog).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(catalog).toBeVisible();
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveCount(0);
  await expect(search).toHaveValue('library');
  await expect(catalog.getByRole('button', { name: 'Library', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(catalog).toHaveAttribute('data-result-mode', 'compact');
  await expect.poll(() => catalog.locator('.catalog-results').evaluate((list) => list.scrollTop)).toBe(restoredScrollTop);
  await expect(page.locator('[data-widget-type="library.workspace"]:not([data-catalog-result])')).toHaveCount(1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
});

test('Ash Catalog stays modal, contained, and singly scrollable at every authority viewport', async ({ page }) => {
  for (const viewport of [
    { name: 'reference wide', width: 1920, height: 1080, zoom: 1 },
    { name: 'wide', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'short landscape', width: 844, height: 390 },
    { name: '200 percent zoom equivalent', width: 960, height: 540, zoom: 2 }
  ]) {
    await openFresh(page, viewport.width, viewport.height);
    await selectTheme(page, 'Ash & Amber');
    if (viewport.zoom) {
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: viewport.zoom });
    }
    const launcher = page.getByRole('button', { name: 'Open Widget Catalog' });
    await launcher.focus();
    await launcher.press('Enter');
    const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
    await expect(catalog).toBeVisible();

    const evidence = await catalog.evaluate((dialog) => {
      const list = dialog.querySelector('.catalog-results');
      const status = dialog.querySelector('.catalog-foot');
      if (!(list instanceof HTMLElement) || !(status instanceof HTMLElement)) {
        throw new Error('Missing Catalog scroll evidence.');
      }
      const box = dialog.getBoundingClientRect();
      const statusBox = status.getBoundingClientRect();
      const descendants = [dialog, ...dialog.querySelectorAll<HTMLElement>('*')];
      return {
        modal: dialog.matches(':modal'),
        box: { top: box.top, right: box.right, bottom: box.bottom, left: box.left },
        viewport: { width: innerWidth, height: innerHeight },
        listScrollable: list.scrollHeight > list.clientHeight,
        scrollOwners: descendants.filter((node) => {
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)) return false;
          const overflow = getComputedStyle(node).overflowY;
          return ['auto', 'scroll'].includes(overflow) && node.scrollHeight > node.clientHeight + 1;
        }).length,
        statusTop: statusBox.top,
        statusBottom: statusBox.bottom,
        fieldContainment: [...dialog.querySelectorAll<HTMLElement>('.catalog-widget-preview input, .catalog-widget-preview textarea')]
          .filter((field) => {
            const box = field.getBoundingClientRect();
            const style = getComputedStyle(field);
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
              && box.width > 0 && box.height > 0;
          }).map((field) => {
          const card = field.closest<HTMLElement>('[data-catalog-result]');
          if (!card) throw new Error('Catalog preview field has no result owner.');
          const fieldBox = field.getBoundingClientRect();
          const cardBox = card.getBoundingClientRect();
          return {
            label: `${card.dataset.widgetType}:${field.tagName.toLowerCase()}.${field.className || '-'}`,
            left: fieldBox.left - cardBox.left,
            right: cardBox.right - fieldBox.right,
            top: fieldBox.top - cardBox.top,
            bottom: cardBox.bottom - fieldBox.bottom
          };
        })
      };
    });
    expect(evidence.modal, `${viewport.name} Catalog modality`).toBe(true);
    expect(evidence.box.top, `${viewport.name} Catalog top`).toBeGreaterThanOrEqual(0);
    expect(evidence.box.left, `${viewport.name} Catalog left`).toBeGreaterThanOrEqual(0);
    expect(evidence.box.right, `${viewport.name} Catalog right`).toBeLessThanOrEqual(evidence.viewport.width);
    expect(evidence.box.bottom, `${viewport.name} Catalog bottom`).toBeLessThanOrEqual(evidence.viewport.height);
    expect(evidence.listScrollable, `${viewport.name} Catalog results`).toBe(true);
    expect(evidence.scrollOwners, `${viewport.name} Catalog scroll ownership`).toBe(1);
    expect(evidence.statusTop, `${viewport.name} Catalog scroll cue`).toBeGreaterThanOrEqual(evidence.box.top);
    expect(evidence.statusBottom, `${viewport.name} Catalog scroll cue`).toBeLessThanOrEqual(evidence.box.bottom + 1);
    expect(evidence.fieldContainment.length, `${viewport.name} actual preview descendants`).toBeGreaterThan(0);
    for (const field of evidence.fieldContainment) {
      expect(field.left, `${viewport.name} ${field.label} left`).toBeGreaterThanOrEqual(-1);
      expect(field.right, `${viewport.name} ${field.label} right`).toBeGreaterThanOrEqual(-1);
      expect(field.top, `${viewport.name} ${field.label} top`).toBeGreaterThanOrEqual(-1);
      expect(field.bottom, `${viewport.name} ${field.label} bottom`).toBeGreaterThanOrEqual(-1);
    }
    await page.keyboard.press('Escape');
    await expect(catalog).toBeHidden();
    await expect(launcher).toBeFocused();
  }
});

test('native workbench keeps persistence actions reachable at the medium breakpoint', async ({ page }) => {
  await openFresh(page, 1024, 768);
  await page.getByText('Developer tools', { exact: true }).click();

  for (const name of ['Save layout', 'Reload saved layout', 'Clear saved layout']) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
});

test('compact Panel changes keep chrome anchored and the document contained', async ({ page }) => {
  await openFresh(page, 390, 844);
  await page.screenshot({ animations: 'disabled', caret: 'hide' });
  await page.getByRole('tab', { name: 'Settings' }).click();

  const evidence = await page.evaluate(() => {
    function rect(selector: string) {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}.`);
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height };
    }
    return {
      scrollY: window.scrollY,
      mainScrollTop: document.querySelector('main')?.scrollTop ?? -1,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      shelf: rect('.top-shelf'),
      workbench: rect('.workbench-shell')
    };
  });
  expect(evidence.scrollY).toBe(0);
  expect(evidence.mainScrollTop).toBe(0);
  expect(evidence.documentHeight).toBe(evidence.viewportHeight);
  expect(evidence.shelf.top).toBeGreaterThanOrEqual(0);
  expect(evidence.shelf.height).toBeGreaterThanOrEqual(40);
  expect(evidence.workbench.top).toBeGreaterThanOrEqual(evidence.shelf.bottom);
});

for (const viewport of [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'medium', width: 1024, height: 768 },
  { name: 'compact', width: 390, height: 844 }
]) {
  test(`native workbench ${viewport.name} surface has no horizontal overflow`, async ({ page }) => {
    await openFresh(page, viewport.width, viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByRole('tablist', { name: 'Panels' }).getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('article', { name: 'Transcript' })).toBeVisible();
  });
}

for (const viewport of [
  { name: 'authority wide', width: 1600, height: 900 },
  { name: 'authority medium', width: 1180, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'large phone', width: 430, height: 932 },
  { name: 'small phone', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
  { name: '200-percent zoom equivalent', width: 800, height: 450 }
]) {
  test(`Deep Current ${viewport.name} keeps the stage and composer reachable`, async ({ page }) => {
    await openFresh(page, viewport.width, viewport.height);
    const evidence = await page.evaluate(() => {
      const region = (id: string) => {
        const element = document.querySelector(`[data-conformance-region="${id}"]`);
        if (!(element instanceof HTMLElement)) throw new Error(`Missing ${id} region.`);
        const box = element.getBoundingClientRect();
        return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
      };
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        shelf: region('shelf'),
        left: region('left'),
        stage: region('stage'),
        right: region('right'),
        composer: region('composer')
      };
    });
    expect(evidence.documentWidth).toBeLessThanOrEqual(evidence.viewport.width);
    expect(evidence.documentHeight).toBeLessThanOrEqual(evidence.viewport.height);
    expect(evidence.composer.bottom).toBeLessThanOrEqual(evidence.viewport.height);
    expect(evidence.composer.top).toBeGreaterThanOrEqual(evidence.stage.top);
    expect(evidence.composer.left).toBeGreaterThanOrEqual(evidence.stage.left);
    expect(evidence.composer.right).toBeLessThanOrEqual(evidence.stage.right);
    if (viewport.width <= 860) {
      expect(evidence.left.width).toBeLessThanOrEqual(1);
      expect(evidence.right.width).toBeLessThanOrEqual(1);
    }
  });
}

test('native workbench exposes coarse-pointer targets separately from compact icons', async ({ page }) => {
  await openFresh(page, 390, 844);
  const style = await page.locator('body').evaluate(() => {
    const sheet = [...document.styleSheets].find((entry) => [...entry.cssRules].some((rule) => rule.cssText.includes('pointer: coarse')));
    return sheet ? [...sheet.cssRules].map((rule) => rule.cssText).join('\n') : '';
  });
  expect(style).toContain('min-height: 44px');
  expect(style).toContain('width: 44px');
});

test.describe('coarse-pointer Deep controls', () => {
  test.use({ hasTouch: true });

  test('preserves 44px material-slider hit targets in the exact wide shell', async ({ page }) => {
    await openFresh(page, 1440, 900);
    const sliders = page.locator('[data-theme-authoring-element="materials"] input[type="range"]');
    await expect(sliders).toHaveCount(4);
    for (const slider of await sliders.all()) {
      expect(Math.round((await slider.boundingBox())?.height ?? 0)).toBeGreaterThanOrEqual(44);
    }
  });
});

test('Panel creation uses the browser modal top layer and restores focus', async ({ page }) => {
  await openFresh(page, 1024, 768);
  await page.getByText('Developer tools', { exact: true }).click();
  const launcher = page.getByRole('button', { name: 'Create Panel' });
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();
});

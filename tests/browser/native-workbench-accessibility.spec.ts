import { expect, test, type Page } from '@playwright/test';

async function openFresh(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
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

test('native workbench keeps literal relationships and keyboard reorder behavior', async ({ page }) => {
  await openFresh(page, 1440, 900);
  const tabs = page.getByRole('tablist', { name: 'Panels' }).getByRole('tab');
  await expect(tabs).toHaveCount(3);
  const scene = page.getByRole('tab', { name: 'Scene' });
  const scenePanelId = await scene.getAttribute('aria-controls');
  const sceneTabId = await scene.getAttribute('id');
  expect(scenePanelId).toBeTruthy();
  expect(sceneTabId).toBeTruthy();
  await expect(page.locator(`#${scenePanelId}`)).toHaveAttribute('aria-labelledby', sceneTabId!);
  await expect(scene.locator('xpath=..')).toHaveAttribute('data-pomegranate-panel-tab', 'scene');
  await page.getByRole('tab', { name: 'Library' }).press('ArrowLeft');
  await expect(tabs).toHaveText(['Library', 'Scene', 'Settings']);
  await expect(page.getByLabel('Active story identity')).toContainText('story-lab-reservoir');
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
  expect(runtimeBox!.x + runtimeBox!.width).toBeLessThanOrEqual(launcherBox!.x);
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
    expect(Math.abs(geometry.prose.center - geometry.stage.center), `${theme} prose center`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.composer.center - geometry.stage.center), `${theme} composer center`).toBeLessThanOrEqual(1);
    if (geometry.grouping === 'unified') {
      expect(geometry.composer.right - geometry.composer.left, `${theme} unified composer width`).toBeLessThanOrEqual(800.5);
    }
    expect(
      Math.abs((geometry.prose.left - geometry.composer.left) - (geometry.composer.right - geometry.prose.right)),
      `${theme} prose inset within composer`
    ).toBeLessThanOrEqual(1);
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
    for (const title of ['Scene Effects', 'Custom Theme']) {
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
        .toBe(theme === 'Bunny' ? 'static' : 'absolute');
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
        selected: tab.getAttribute('aria-selected')
      };
    });
    expect(style.selected, `${theme} active Panel identity`).toBe('true');
    expect(style.boxShadow, `${theme} zero-rim material`).toBe('none');
    expect(style.edgeContent, `${theme} active Panel edge content`).not.toBe('none');
    expect(style.edgeHeight, `${theme} active Panel edge height`).toBeGreaterThanOrEqual(2);
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

test('native workbench Catalog supports keyboard placement and stable attributes', async ({ page }) => {
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
  await expect(catalog.getByRole('listitem')).toHaveCount(94);
  await expect(catalog.getByText('Scroll results · 94 widgets')).toBeVisible();
  expect(await catalog.getByRole('list').evaluate((list) => list.scrollHeight > list.clientHeight)).toBe(true);
  await catalog.getByRole('button', { name: 'Compact' }).click();
  await expect(catalog).toHaveAttribute('data-result-mode', 'compact');
  const add = catalog.getByRole('button', { name: 'Add Accessibility', exact: true });
  await add.focus();
  await add.press('Enter');
  await expect(page.getByRole('article', { name: 'Accessibility' })).toHaveAttribute('data-pomegranate-placement', 'docked');
  await expect(page.locator('[data-surface-type="settings.accessibility"]')).toHaveAttribute('data-surface-state', 'ready');
  await page.keyboard.press('Escape');
  await expect(catalog).toBeHidden();
  await expect(launcher).toBeFocused();
});

test('Ash Catalog stays modal, contained, and singly scrollable at every authority viewport', async ({ page }) => {
  for (const viewport of [
    { name: 'reference wide', width: 1920, height: 1280 },
    { name: 'wide', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'short landscape', width: 844, height: 390 }
  ]) {
    await openFresh(page, viewport.width, viewport.height);
    await selectTheme(page, 'Ash & Amber');
    const launcher = page.getByRole('button', { name: 'Open Widget Catalog' });
    await launcher.focus();
    await launcher.press('Enter');
    const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
    await expect(catalog).toBeVisible();

    const evidence = await catalog.evaluate((dialog) => {
      const list = dialog.querySelector('ul');
      const status = dialog.querySelector('.catalog-scroll-status');
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
          const overflow = getComputedStyle(node).overflowY;
          return ['auto', 'scroll'].includes(overflow) && node.scrollHeight > node.clientHeight + 1;
        }).length,
        statusTop: statusBox.top,
        statusBottom: statusBox.bottom
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

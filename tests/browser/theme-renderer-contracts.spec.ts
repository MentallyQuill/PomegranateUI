import { expect, test, type Page } from '@playwright/test';
import { compileCanvasLayers, compileThemeBindings, resolveThemeV2 } from '@pomegranate-ui/theme';
import { EXTERNAL_THEME } from '../fixtures/external-theme.js';

const TARGETS = [
  { id: 'deep-current', label: 'Deep Current' },
  { id: 'pom-neutral', label: 'PomOS' },
  { id: 'bunny', label: 'Bunny' }
] as const;
const ASH_TARGET = { id: 'ash-amber', label: 'Ash & Amber' } as const;

async function fresh(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function selectTheme(
  page: Page,
  target: (typeof TARGETS)[number] | typeof ASH_TARGET,
  { closeDrawer = true }: { readonly closeDrawer?: boolean } = {}
) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: target.label, exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', target.id);
  if (closeDrawer) await page.getByText('Developer tools', { exact: true }).click();
}

type MaterialSample = {
  readonly alpha: number;
  readonly backdrop: string;
  readonly background: string;
  readonly borderRadius: string;
  readonly borderWidth: string;
  readonly boxShadow: string;
  readonly clipPath: string;
};

async function material(page: Page, selector: string): Promise<MaterialSample> {
  return page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    const match = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    return {
      alpha: match.length === 4 ? match[3]! : 1,
      backdrop: style.backdropFilter,
      background: style.backgroundColor,
      borderRadius: style.borderRadius,
      borderWidth: style.borderWidth,
      boxShadow: style.boxShadow,
      clipPath: style.clipPath
    };
  });
}

function blurPx(filter: string): number {
  return Number(filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0);
}

function technicalRailPresentation(page: Page) {
  return page.locator('main[data-pom-theme-root]').evaluate((root) => {
    const sceneLabel = root.querySelector<HTMLElement>('.scene-effects label > span')!;
    const authoring = root.querySelector<HTMLElement>('.compact-theme')!;
    const left = root.querySelector<HTMLElement>('[data-conformance-region="left"]')!.getBoundingClientRect();
    const stage = root.querySelector<HTMLElement>('[data-conformance-region="stage"]')!.getBoundingClientRect();
    const right = root.querySelector<HTMLElement>('[data-conformance-region="right"]')!.getBoundingClientRect();
    const rootBox = root.getBoundingClientRect();
    const shell = root.querySelector<HTMLElement>('.workbench-shell')!.getBoundingClientRect();
    const style = getComputedStyle(root);
    return {
      expressionRowSize: style.getPropertyValue('--pom-expression-row-surface-font-size').trim(),
      expressionSliderSize: style.getPropertyValue('--pom-expression-slider-input-font-size').trim(),
      sceneLabelSize: getComputedStyle(sceneLabel).fontSize,
      authoringSize: getComputedStyle(authoring).fontSize,
      geometry: {
        root: { x: rootBox.x, right: rootBox.right, width: rootBox.width },
        shell: { x: shell.x, right: shell.right, width: shell.width },
        left: { x: left.x, right: left.right, width: left.width },
        stage: { x: stage.x, right: stage.right, width: stage.width },
        right: { x: right.x, right: right.right, width: right.width },
        viewportWidth: innerWidth
      }
    };
  });
}

test('the canvas remains behind every interactive Workbench surface', async ({ page }) => {
  await fresh(page);

  await expect(page.locator('[data-pomegranate-floating-layer]')).not.toHaveAttribute('data-pom-part');

  for (const target of TARGETS) {
    await selectTheme(page, target);
    await expect.poll(() => page.locator('[data-pom-canvas-root]').evaluate((canvas) => Number(getComputedStyle(canvas).zIndex)))
      .toBeLessThan(0);
    const widget = page.getByRole('article', { name: 'Characters' });
    const box = await widget.boundingBox();
    expect(box, `${target.label} widget bounds`).not.toBeNull();
    const painted = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return {
        canvas: element?.closest('[data-pom-canvas-root]') !== null,
        widget: element?.closest('[data-pomegranate-widget]')?.getAttribute('data-pomegranate-widget') ?? null
      };
    }, { x: box!.x + box!.width / 2, y: box!.y + 24 });
    expect(painted.canvas, `${target.label} canvas interception`).toBe(false);
    expect(painted.widget, `${target.label} visible Widget`).toBe('scene-characters');
  }
});

test('the Lab loads theme-appropriate character art and independent ambient imagery', async ({ page }) => {
  await fresh(page);

  await selectTheme(page, TARGETS[0]);
  await expect(page.getByRole('article', { name: 'Characters' }).locator('.recording-character-portrait > img')).toHaveCount(0);

  for (const target of [
    { ...TARGETS[1], portraitAsset: 'pomos-character-atlas', canvasAsset: null },
    { ...TARGETS[2], portraitAsset: 'bunny-character-atlas', canvasAsset: 'bunny-garden-canvas' },
    { ...ASH_TARGET, portraitAsset: 'ash-amber-character-atlas', canvasAsset: 'ash-amber-stage' }
  ]) {
    await selectTheme(page, target);
    await expect(page.getByRole('article', { name: 'Custom Theme' }).getByText(target.label, { exact: true })).toBeVisible();
    const portraits = page.getByRole('article', { name: 'Characters' }).locator('.recording-character-portrait > img');
    await expect(portraits).toHaveCount(4);
    expect(await portraits.evaluateAll((images: HTMLImageElement[], portraitAsset) => images.every((image) => (
      image.complete && image.naturalWidth > 0 && image.currentSrc.includes(portraitAsset)
    )), target.portraitAsset), `${target.label} portrait atlas`).toBe(true);

    const imageLayer = page.locator('[data-pom-canvas-layer="image"]');
    if (target.canvasAsset === null) {
      await expect(imageLayer).toHaveCount(0);
    } else {
      await expect(imageLayer).toHaveCount(1);
      expect(await imageLayer.evaluate((layer) => getComputedStyle(layer).backgroundImage), `${target.label} canvas asset`)
        .toContain(target.canvasAsset);
    }
  }
});

test('Ash and Amber renders neutral graphite chrome, restrained amber ambience, and rounded bevels', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, ASH_TARGET);

  const evidence = await page.locator('main').evaluate((root) => {
    const style = getComputedStyle(root);
    return {
      canvas: style.getPropertyValue('--pom-color-canvas').trim(),
      surface: style.getPropertyValue('--pom-color-surface').trim(),
      chrome: style.getPropertyValue('--pom-color-chrome').trim(),
      accent: style.getPropertyValue('--pom-color-accent').trim(),
      ambient: style.getPropertyValue('--pom-ambient-color').trim(),
      layers: [...root.querySelectorAll<HTMLElement>('[data-pom-canvas-layer]')].map((layer) => ({
        kind: layer.dataset.pomCanvasLayer,
        background: getComputedStyle(layer).backgroundColor,
        filter: getComputedStyle(layer).filter,
        opacity: getComputedStyle(layer).opacity
      }))
    };
  });
  expect(evidence).toMatchObject({
    canvas: '#242321',
    surface: '#302E2A',
    chrome: '#625B52',
    accent: '#C18A3D',
    ambient: '#51493E',
    layers: [
      { kind: 'solid', background: 'rgb(36, 35, 33)' },
      { kind: 'image', filter: 'blur(0px) saturate(0.82)', opacity: '0.72' },
      { kind: 'linear-gradient' },
      { kind: 'radial-gradient' },
      { kind: 'veil', background: 'rgb(48, 46, 42)', opacity: '0.28' }
    ]
  });

  const shelf = await material(page, '[data-pom-part="chrome.shelf"]');
  const header = await material(page, '[data-conformance-region="left"] [data-pom-part="widget.header"]');
  expect(shelf).toMatchObject({
    background: 'rgba(98, 91, 82, 0.6)',
    borderRadius: '4px',
    clipPath: 'none'
  });
  expect(header).toMatchObject({
    background: 'rgba(98, 91, 82, 0.74)',
    borderRadius: '4px 4px 0px 0px',
    clipPath: 'none'
  });
});

test('composition metadata and icon art survive data-only theme compilation', async ({ page }) => {
  await fresh(page);

  for (const target of TARGETS) {
    await selectTheme(page, target);
    const root = page.locator('main');
    await expect(root).toHaveAttribute('data-pom-widget-grouping', /^(individual|unified)$/);
    await expect(root).toHaveAttribute('data-pom-chrome-presentation', /^(compact|overlay|full)$/);
    await expect(root).toHaveAttribute('data-pom-action-presentation', /^(compact|hover-focus|full|always)$/);
    const image = await page.getByRole('article', { name: 'Characters' })
      .getByRole('button', { name: 'Drag Widget' })
      .evaluate((button) => getComputedStyle(button).backgroundImage);
    expect(image, `${target.label} icon image`).toContain('url(');
    const pseudoContent = await page.getByRole('article', { name: 'Characters' })
      .locator(':scope > header')
      .evaluate((header) => [getComputedStyle(header, '::before').content, getComputedStyle(header, '::after').content]);
    expect(pseudoContent, `${target.label} decorative stoplights`).toEqual(['none', 'none']);
  }
});

test('PomOS is a seamless continuous-rounded blue glass composition', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[1]);

  await expect(page.locator('[data-pom-canvas-layer]')).toHaveCount(6);
  const root = page.locator('main');
  await expect(root).toHaveAttribute('data-pom-widget-grouping', 'individual');
  await expect(root).toHaveAttribute('data-pom-chrome-presentation', 'overlay');
  await expect(root).toHaveAttribute('data-pom-action-presentation', 'hover-focus');

  for (const selector of ['.workbench-shell', '[data-conformance-region="left"]', '[data-conformance-region="right"]']) {
    const sample = await material(page, selector);
    expect(sample.alpha, `${selector} fill`).toBe(0);
    expect(blurPx(sample.backdrop), `${selector} blur`).toBe(0);
    expect(sample.borderWidth, `${selector} border`).toBe('0px');
    expect(sample.boxShadow, `${selector} shadow`).toBe('none');
    expect(sample.clipPath, `${selector} clipping`).toBe('none');
  }

  const widget = await material(page, '[data-conformance-region="left"] .widget-frame');
  expect(widget.alpha).toBeCloseTo(0.42, 2);
  expect(blurPx(widget.backdrop)).toBe(28);
  expect(widget.borderRadius).toBe('18px');
  expect(widget.boxShadow).not.toBe('none');
  for (const selector of [
    '[data-conformance-region="left"] .widget-frame > header',
    '[data-conformance-region="left"] .widget-frame > [data-pom-part="widget.content"]'
  ]) {
    const child = await material(page, selector);
    expect(blurPx(child.backdrop), `${selector} duplicate blur`).toBe(0);
    expect(child.borderWidth, `${selector} artifact edge`).toBe('0px');
    expect(child.boxShadow, `${selector} bevel`).toBe('none');
  }

  for (const edge of ['left', 'right']) {
    const handle = page.locator(`[data-dock-resizer="${edge}"]`);
    await expect(handle).not.toHaveAttribute('data-pom-part');
    await expect(handle.locator('span')).toHaveAttribute('data-pom-part', 'separator');
    const hitSurface = await material(page, `[data-dock-resizer="${edge}"]`);
    expect(hitSurface.alpha, `${edge} resize hit surface`).toBe(0);
    expect(hitSurface.borderWidth, `${edge} resize artifact`).toBe('0px');
  }

  const factRows = page.getByRole('article', { name: 'Characters' }).locator('.recording-characters li');
  expect(await factRows.count()).toBeGreaterThan(1);
  for (const row of await factRows.all()) {
    await expect(row).toHaveAttribute('data-pom-part', 'row.surface');
    expect(await row.evaluate((element) => getComputedStyle(element).borderRadius)).not.toBe('0px');
  }

  const characterWindow = page.getByRole('article', { name: 'Characters' });
  const unusedTail = await characterWindow.evaluate((article) => {
    const content = article.querySelector('.recording-characters li:last-child')!;
    return article.getBoundingClientRect().bottom - content.getBoundingClientRect().bottom;
  });
  expect(unusedTail, 'individual window dead space').toBeLessThanOrEqual(32);

  const effectsWindow = page.getByRole('article', { name: 'Scene Effects' });
  const effectsSlot = page.locator(
    '[data-conformance-region="right"] > .dock-shelf > [data-widget-type="story.room-ambience"]',
  );
  const effectsBox = await effectsWindow.boundingBox();
  const effectsSlotBox = await effectsSlot.boundingBox();
  const finalEffectBox = await effectsWindow.getByRole('slider', { name: 'Reading Veil' }).boundingBox();
  expect(effectsBox).not.toBeNull();
  expect(effectsSlotBox).not.toBeNull();
  expect(finalEffectBox).not.toBeNull();
  expect(effectsBox!.y + effectsBox!.height, 'PomOS Scene Effects window stays inside its shelf slot')
    .toBeLessThanOrEqual(effectsSlotBox!.y + effectsSlotBox!.height + 1);
  expect(finalEffectBox!.y + finalEffectBox!.height, 'PomOS exposes all four Scene Effects controls inside the window')
    .toBeLessThanOrEqual(effectsBox!.y + effectsBox!.height + 1);

  for (const target of TARGETS.slice(1)) {
    await selectTheme(page, target);
    const rightDock = page.locator('[data-conformance-region="right"]');
    const rightDockBox = await rightDock.boundingBox();
    const finalRightWidgetBox = await rightDock.getByRole('article').last().boundingBox();
    expect(rightDockBox).not.toBeNull();
    expect(finalRightWidgetBox).not.toBeNull();
    expect(
      finalRightWidgetBox!.y + finalRightWidgetBox!.height,
      `${target.label} right-stack widgets stay inside their dock`,
    ).toBeLessThanOrEqual(rightDockBox!.y + rightDockBox!.height + 1);
  }
});

test('Bunny matches the stationery reference through reusable expression bindings', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[2]);

  await expect(page.locator('[data-pom-canvas-layer]')).toHaveCount(4);
  await expect(page.locator('main')).toHaveAttribute('data-pom-action-presentation', 'always');
  expect(await page.locator('[data-pom-canvas-layer]').evaluateAll((layers) => layers.map((layer) => ({
    kind: layer.getAttribute('data-pom-canvas-layer'),
    image: getComputedStyle(layer).backgroundImage
  })))).toEqual([
    { kind: 'solid', image: 'none' },
    { kind: 'image', image: expect.stringContaining('bunny-garden-canvas') },
    { kind: 'four-corner', image: expect.stringContaining('radial-gradient') },
    { kind: 'veil', image: 'none' }
  ]);

  const evidence = await page.locator('main').evaluate((root) => {
    const style = (selector: string) => {
      const element = root.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing Bunny evidence selector: ${selector}`);
      const computed = getComputedStyle(element);
      return {
        radius: computed.borderRadius,
        backgroundImage: computed.backgroundImage,
        backdrop: computed.backdropFilter,
        fontSize: computed.fontSize,
        textTransform: computed.textTransform,
        height: element.getBoundingClientRect().height
      };
    };
    const computed = getComputedStyle(root);
    const stage = root.querySelector<HTMLElement>('[data-conformance-region="stage"]');
    const reader = root.querySelector<HTMLElement>('[data-widget-type="story.transcript"] .widget-frame > [data-pom-part="widget.content"]');
    const readerBody = root.querySelector<HTMLElement>('[data-widget-type="story.transcript"] .transcript');
    const composer = root.querySelector<HTMLElement>('[data-widget-type="story.composer"] .widget-frame > [data-pom-part="widget.content"]');
    if (!stage || !reader || !readerBody || !composer) throw new Error('Missing Bunny story presentation evidence.');
    const stageBox = stage.getBoundingClientRect();
    const readerBox = reader.getBoundingClientRect();
    return {
      colors: {
        canvas: computed.getPropertyValue('--pom-color-canvas').trim(),
        accent: computed.getPropertyValue('--pom-color-accent').trim(),
        text: computed.getPropertyValue('--pom-color-text').trim()
      },
      shelf: style('.top-shelf'),
      shell: style('.workbench-shell'),
      dock: style('[data-conformance-region="left"]'),
      widget: style('[data-conformance-region="left"] .widget-frame'),
      header: style('[data-conformance-region="left"] .widget-frame > header'),
      icon: style('[data-conformance-region="left"] .widget-frame nav button'),
      row: style('[data-widget-type="story.characters"] [data-pom-part="row.surface"]'),
      button: style('.top-shelf [data-pom-part="button.surface"]'),
      reader: {
        ...style('[data-widget-type="story.transcript"] .widget-frame > [data-pom-part="widget.content"]'),
        lineHeight: getComputedStyle(readerBody).lineHeight,
        bodyFontSize: getComputedStyle(readerBody).fontSize,
        intersectsStage: readerBox.right > stageBox.left && readerBox.left < stageBox.right
          && readerBox.bottom > stageBox.top && readerBox.top < stageBox.bottom
      },
      composer: style('[data-widget-type="story.composer"] .widget-frame > [data-pom-part="widget.content"]')
    };
  });

  expect(evidence.colors).toEqual({ canvas: '#faeef6', accent: '#ed75aa', text: '#45364d' });
  expect(evidence.shelf).toMatchObject({ radius: '24px 24px 12px 12px', height: 52, fontSize: '12px', textTransform: 'none' });
  expect(evidence.shelf.backgroundImage).toContain('linear-gradient(150deg');
  expect(evidence.shell.radius).toBe('12px 12px 26px 26px');
  expect(evidence.dock.radius).toBe('20px');
  expect(evidence.widget).toMatchObject({
    radius: '17px',
    backdrop: 'blur(9.6px) saturate(1.08) brightness(1.03)',
    fontSize: '12px'
  });
  expect(evidence.widget.backgroundImage).toContain('linear-gradient(150deg');
  expect(evidence.header).toMatchObject({ radius: '17px 17px 0px 0px', fontSize: '12px', textTransform: 'none' });
  expect(evidence.icon).toMatchObject({ fontSize: '0px', textTransform: 'none' });
  expect(evidence.icon.backgroundImage).not.toBe('none');
  expect(evidence.row.radius).toBe('999px');
  expect(evidence.row.backgroundImage).toContain('linear-gradient(150deg');
  expect(evidence.button).toMatchObject({ radius: '999px', fontSize: '11px', textTransform: 'none' });
  expect(evidence.reader).toMatchObject({
    radius: '18px', bodyFontSize: '17px', lineHeight: '26.35px', intersectsStage: true
  });
  expect(evidence.reader.backgroundImage).toContain('linear-gradient(150deg');
  expect(evidence.composer.radius).toBe('18px');
  expect(evidence.composer.backgroundImage).toContain('linear-gradient(150deg');

  const catalogButton = page.getByRole('button', { name: 'Open Widget Catalog' });
  await catalogButton.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(catalogButton).toBeFocused();
  expect(await catalogButton.evaluate((button) => {
    const style = getComputedStyle(button);
    return { focusVisible: button.matches(':focus-visible'), color: style.outlineColor, width: style.outlineWidth };
  })).toEqual({ focusVisible: true, color: 'rgb(105, 81, 161)', width: '2px' });
});

test('Bunny keeps the compact reader expressive, contained, and responsive', async ({ page }) => {
  await fresh(page, 390, 844);
  await selectTheme(page, TARGETS[2]);

  const evidence = await page.locator('main').evaluate((root) => {
    const stage = root.querySelector<HTMLElement>('[data-conformance-region="stage"]');
    const reader = root.querySelector<HTMLElement>('[data-widget-type="story.transcript"] .widget-frame > [data-pom-part="widget.content"]');
    const readerBody = root.querySelector<HTMLElement>('[data-widget-type="story.transcript"] .transcript');
    const composer = root.querySelector<HTMLElement>('[data-widget-type="story.composer"] .composer');
    const textarea = root.querySelector<HTMLTextAreaElement>('[data-widget-type="story.composer"] textarea');
    const send = root.querySelector<HTMLButtonElement>('[data-widget-type="story.composer"] .composer > button');
    const leftDock = root.querySelector<HTMLElement>('[data-conformance-region="left"]');
    const rightDock = root.querySelector<HTMLElement>('[data-conformance-region="right"]');
    if (!stage || !reader || !readerBody || !composer || !textarea || !send || !leftDock || !rightDock) {
      throw new Error('Missing compact Bunny evidence.');
    }
    const stageBox = stage.getBoundingClientRect();
    const readerBox = reader.getBoundingClientRect();
    const composerBox = composer.getBoundingClientRect();
    const textareaBox = textarea.getBoundingClientRect();
    const sendBox = send.getBoundingClientRect();
    const readerStyle = getComputedStyle(reader);
    const typeStyle = getComputedStyle(readerBody);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      leftDisplay: getComputedStyle(leftDock).display,
      rightDisplay: getComputedStyle(rightDock).display,
      readerRadius: readerStyle.borderRadius,
      readerImage: readerStyle.backgroundImage,
      fontSize: typeStyle.fontSize,
      lineHeight: typeStyle.lineHeight,
      intersectsStage: readerBox.right > stageBox.left && readerBox.left < stageBox.right
        && readerBox.bottom > stageBox.top && readerBox.top < stageBox.bottom,
      composerControlsContained: textareaBox.top >= composerBox.top && textareaBox.bottom <= composerBox.bottom
        && sendBox.top >= composerBox.top && sendBox.bottom <= composerBox.bottom,
      composerDraft: textarea.value,
      sendLabel: send.textContent?.trim()
    };
  });

  expect(evidence).toMatchObject({
    viewportWidth: 390,
    scrollWidth: 390,
    leftDisplay: 'none',
    rightDisplay: 'none',
    readerRadius: '18px',
    fontSize: '14px',
    lineHeight: '21.7px',
    intersectsStage: true,
    composerControlsContained: true,
    composerDraft: 'Ask Mara what the bell means.',
    sendLabel: 'Send action'
  });
  expect(evidence.readerImage).toContain('linear-gradient(150deg');
});

test('Bunny removes decorative gradients under reduced transparency without losing shape', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }]
  });
  await fresh(page);
  await selectTheme(page, TARGETS[2]);

  expect(await page.locator('[data-conformance-region="left"] .widget-frame').first().evaluate((widget) => {
    const style = getComputedStyle(widget);
    return {
      radius: style.borderRadius,
      image: style.backgroundImage,
      backdrop: style.backdropFilter,
      alpha: style.backgroundColor.match(/[\d.]+/g)?.map(Number)[3] ?? 1
    };
  })).toEqual({ radius: '17px', image: 'none', backdrop: 'none', alpha: 1 });
});

test('Bunny action rails stop decorative motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fresh(page);
  await selectTheme(page, TARGETS[2]);

  expect(await page.locator('[data-conformance-region="left"] .widget-frame nav').first().evaluate((actions) => {
    const style = getComputedStyle(actions);
    return {
      animation: style.animationName,
      transitionDuration: style.transitionDuration,
      transitionProperty: style.transitionProperty
    };
  })).toEqual({ animation: 'none', transitionDuration: '0s', transitionProperty: 'none' });
});

test('unified compositions allocate rail space to functional content', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[0]);

  const effects = page.getByRole('article', { name: 'Scene Effects' });
  const finalControl = effects.getByRole('slider', { name: 'Reading Veil' });
  const effectsBox = await effects.boundingBox();
  const controlBox = await finalControl.boundingBox();
  expect(effectsBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  expect(controlBox!.y + controlBox!.height, 'final effect control stays inside its assigned unified row')
    .toBeLessThanOrEqual(effectsBox!.y + effectsBox!.height + 1);
});

test('each target keeps one glass owner per Widget and a seamless structural dock', async ({ page }) => {
  await fresh(page);
  for (const target of TARGETS) {
    await selectTheme(page, target);
    const dock = await material(page, '[data-conformance-region="left"]');
    const widget = await material(page, '[data-conformance-region="left"] .widget-frame');
    const header = await material(page, '[data-conformance-region="left"] .widget-frame > header');
    const content = await material(page, '[data-conformance-region="left"] .widget-frame > [data-pom-part="widget.content"]');
    expect(dock.alpha, `${target.label} dock fill`).toBe(0);
    expect(blurPx(dock.backdrop), `${target.label} dock blur`).toBe(0);
    expect(blurPx(widget.backdrop), `${target.label} Widget blur`).toBeGreaterThan(0);
    expect(widget.alpha, `${target.label} Widget alpha`).toBeGreaterThan(0);
    expect(widget.alpha, `${target.label} Widget translucency`).toBeLessThan(1);
    expect(blurPx(header.backdrop), `${target.label} header duplicate blur`).toBe(0);
    expect(blurPx(content.backdrop), `${target.label} content duplicate blur`).toBe(0);
  }
});

test('material controls have refined geometry and visibly control glass', async ({ page }) => {
  for (const target of TARGETS) {
    await fresh(page);
    await selectTheme(page, target);
    await page.getByRole('tab', { name: 'Settings' }).click();
    const settings = page.locator('[data-widget-type="settings.custom-theme"]');
    const glass = settings.getByRole('slider', { name: 'Glass Density' });
    const frost = settings.getByRole('slider', { name: 'Frost Level' });
    const geometry = await glass.evaluate((input) => {
      const root = input.closest('[data-pom-theme-root]')!;
      const style = getComputedStyle(root);
      return {
        height: input.getBoundingClientRect().height,
        track: Number.parseFloat(style.getPropertyValue('--pom-control-slider-track-size')),
        thumb: Number.parseFloat(style.getPropertyValue('--pom-control-slider-thumb-size')),
        hit: Number.parseFloat(style.getPropertyValue('--pom-control-slider-hit-size'))
      };
    });
    expect(geometry.track).toBeGreaterThanOrEqual(3);
    expect(geometry.track).toBeLessThanOrEqual(4);
    expect(geometry.thumb).toBeGreaterThanOrEqual(10);
    expect(geometry.thumb).toBeLessThanOrEqual(12);
    expect(geometry.hit).toBeGreaterThanOrEqual(44);
    expect(geometry.height, 'native range geometry may quantize below its CSS size by a subpixel')
      .toBeGreaterThanOrEqual(geometry.hit - 0.01);

    const progress = await glass.evaluate((input) => ({
      authored: getComputedStyle(input).getPropertyValue('--pom-slider-progress').trim(),
      background: getComputedStyle(input).backgroundImage,
      value: (input as HTMLInputElement).value
    }));
    expect(progress.authored).toBe(`${progress.value}%`);
    expect(progress.background).toContain('linear-gradient');

    await glass.fill('0');
    await expect.poll(() => glass.evaluate((input) => getComputedStyle(input).getPropertyValue('--pom-slider-progress').trim())).toBe('0%');
    await frost.fill('0');
    expect((await material(page, '[data-widget-type="settings.custom-theme"] > .widget-frame')).alpha).toBe(0);
    expect(blurPx((await material(page, '[data-widget-type="settings.custom-theme"] > .widget-frame')).backdrop)).toBe(0);
    await glass.fill('100');
    await expect.poll(() => glass.evaluate((input) => getComputedStyle(input).getPropertyValue('--pom-slider-progress').trim())).toBe('100%');
    await frost.fill('100');
    expect((await material(page, '[data-widget-type="settings.custom-theme"] > .widget-frame')).alpha).toBe(1);
    expect(blurPx((await material(page, '[data-widget-type="settings.custom-theme"] > .widget-frame')).backdrop)).toBe(40);
  }
});

test('reduced transparency selects an opaque no-blur semantic fallback', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }]
  });
  await fresh(page);
  await selectTheme(page, TARGETS[1]);
  await page.getByText('Developer tools', { exact: true }).click();
  for (const selector of ['.top-shelf', '.developer-drawer-surface', '[data-conformance-region="left"] .widget-frame']) {
    const sample = await material(page, selector);
    expect(sample.alpha, `${selector} opacity`).toBe(1);
    expect(blurPx(sample.backdrop), `${selector} blur`).toBe(0);
  }
  await expect(page.locator('[data-pom-ambient-layer]')).toHaveCSS('opacity', '0');
  const selectedTheme = page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: 'PomOS', exact: true });
  expect((await material(page, '.theme-targets button[aria-pressed="true"]')).alpha).toBe(1);
  await selectedTheme.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(selectedTheme).toBeFocused();
  expect(await selectedTheme.evaluate((button) => {
    const style = getComputedStyle(button);
    const alpha = style.backgroundColor.match(/[\d.]+/g)?.map(Number)[3] ?? 1;
    return { focusVisible: button.matches(':focus-visible'), alpha, backdrop: style.backdropFilter };
  })).toEqual({ focusVisible: true, alpha: 1, backdrop: 'none' });

  await page.locator('main').evaluate((root) => {
    for (const state of ['pressed', 'inactive', 'disabled']) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.pomPart = 'button.surface';
      button.dataset.reducedTransparencyState = state;
      button.textContent = state;
      if (state === 'inactive') button.dataset.pomInactive = 'true';
      if (state === 'disabled') button.disabled = true;
      root.append(button);
    }
  });
  const stateSample = async (state: string) => page.locator(`[data-reduced-transparency-state="${state}"]`).evaluate((button) => {
    const style = getComputedStyle(button);
    return {
      opacity: Number(style.opacity),
      alpha: style.backgroundColor.match(/[\d.]+/g)?.map(Number)[3] ?? 1,
      backdrop: style.backdropFilter
    };
  });
  expect(await stateSample('inactive')).toEqual({ opacity: 1, alpha: 1, backdrop: 'none' });
  expect(await stateSample('disabled')).toEqual({ opacity: 1, alpha: 1, backdrop: 'none' });
  const pressed = page.locator('[data-reduced-transparency-state="pressed"]');
  const box = await pressed.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  expect(await stateSample('pressed')).toEqual({ opacity: 1, alpha: 1, backdrop: 'none' });
  await page.mouse.up();
});

test('Ash and Amber reduced transparency resolves every elevated owner to neutral opaque ash', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }]
  });
  await fresh(page);
  await selectTheme(page, ASH_TARGET);
  await page.getByText('Developer tools', { exact: true }).click();

  for (const selector of [
    '[data-pom-part="chrome.shelf"]',
    '.developer-drawer-surface',
    '[data-conformance-region="left"] .widget-frame',
    '[data-conformance-region="left"] [data-pom-part="widget.header"]'
  ]) {
    const sample = await material(page, selector);
    expect(sample).toMatchObject({
      alpha: 1,
      backdrop: 'none',
      background: 'rgb(48, 46, 42)'
    });
  }
  await expect(page.locator('[data-pom-ambient-layer]')).toHaveCSS('opacity', '0');
});

test('Catalog keeps an opaque neutral modal and no-blur backdrop under reduced transparency', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }]
  });
  await fresh(page);
  await selectTheme(page, ASH_TARGET);
  const launcher = page.getByRole('button', { name: 'Open Widget Catalog' });
  await launcher.focus();
  await launcher.press('Enter');
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  await expect(catalog).toBeVisible();

  const surface = await material(page, '.widget-catalog');
  expect(surface).toMatchObject({ alpha: 1, backdrop: 'none', background: 'rgb(48, 46, 42)' });
  const backdrop = await catalog.evaluate((dialog) => {
    const style = getComputedStyle(dialog, '::backdrop');
    const channels = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    return {
      alpha: channels.length === 4 ? channels[3] : 1,
      backdrop: style.backdropFilter
    };
  });
  expect(backdrop).toEqual({ alpha: 1, backdrop: 'none' });
});

test('Ash readability expression leaves Deep compact technical rail defaults unchanged', async ({ page }) => {
  await fresh(page);
  const deepRail = await technicalRailPresentation(page);
  expect(deepRail).toMatchObject({
    expressionRowSize: '',
    expressionSliderSize: '',
    sceneLabelSize: '8px',
    authoringSize: '9px'
  });
  await selectTheme(page, ASH_TARGET);
  expect(await technicalRailPresentation(page)).toMatchObject({
    expressionRowSize: '11px',
    expressionSliderSize: '11px',
    sceneLabelSize: '11px',
    authoringSize: '11px'
  });
  await selectTheme(page, TARGETS[0]);
  expect(await technicalRailPresentation(page)).toEqual(deepRail);
});

test('an external non-preset definition renders the same live Workbench tree', async ({ page }) => {
  await fresh(page);
  const deepRail = await technicalRailPresentation(page);

  const registry = {
    'icons.external-fixture': { kind: 'icon-pack' as const, source: 'icons.external-fixture' }
  };
  const resolution = resolveThemeV2(EXTERNAL_THEME, registry);
  expect(resolution.ok).toBe(true);
  if (!resolution.ok) return;
  const canvas = compileCanvasLayers(resolution.theme, resolution.theme.assets);
  expect(canvas.ok).toBe(true);
  if (!canvas.ok) return;
  const before = await page.locator('main').evaluate((root) => ({
    revision: root.getAttribute('data-workbench-revision'),
    widgets: [...root.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
  }));

  await page.evaluate(({ bindings, layers, recipes }) => {
    const root = document.querySelector<HTMLElement>('main[data-pom-theme-root]')!;
    for (const [property, value] of Object.entries(bindings)) root.style.setProperty(property, value);
    root.dataset.pomTheme = 'external-fixture';
    root.dataset.pomWidgetGrouping = recipes.widgetGrouping;
    root.dataset.pomChromePresentation = recipes.chromePresentation;
    root.dataset.pomActionPresentation = recipes.actionPresentation;
    root.dataset.pomDensity = 'compact';
    root.querySelector('[data-pom-part="row.surface"]')?.setAttribute('data-pom-spacing', 'recipe');
    const canvasRoot = root.querySelector<HTMLElement>('[data-pom-canvas-root]')!;
    canvasRoot.replaceChildren(...layers.map((layer) => {
      const element = document.createElement('i');
      element.dataset.pomCanvasLayer = layer.kind;
      element.dataset.pomCanvasOrder = String(layer.order);
      Object.assign(element.style, layer.style);
      return element;
    }));
  }, {
    bindings: compileThemeBindings(resolution.theme),
    layers: canvas.layers,
    recipes: resolution.theme.recipes
  });

  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', 'external-fixture');
  await expect(page.locator('main')).toHaveAttribute('data-pom-widget-grouping', resolution.theme.recipes.widgetGrouping);
  await expect(page.locator('main')).toHaveAttribute('data-pom-chrome-presentation', resolution.theme.recipes.chromePresentation);
  await expect(page.locator('main')).toHaveAttribute('data-pom-action-presentation', resolution.theme.recipes.actionPresentation);
  const copperRail = await technicalRailPresentation(page);
  expect(copperRail).toMatchObject({
    expressionRowSize: '',
    expressionSliderSize: '',
    sceneLabelSize: deepRail.sceneLabelSize,
    authoringSize: deepRail.authoringSize
  });
  expect(copperRail.geometry.left.x).toBeGreaterThanOrEqual(copperRail.geometry.shell.x);
  expect(copperRail.geometry.right.right).toBeLessThanOrEqual(copperRail.geometry.shell.right);
  expect(copperRail.geometry.left.x - copperRail.geometry.shell.x)
    .toBeCloseTo(copperRail.geometry.shell.right - copperRail.geometry.right.right, 0);
  expect(copperRail.geometry.root.right).toBeLessThanOrEqual(copperRail.geometry.viewportWidth);
  expect(copperRail.geometry.left.right).toBeCloseTo(copperRail.geometry.stage.x, 0);
  expect(copperRail.geometry.stage.right).toBeCloseTo(copperRail.geometry.right.x, 0);
  expect(Math.abs(copperRail.geometry.left.width - copperRail.geometry.right.width)).toBeLessThanOrEqual(1);
  expect(await page.locator('main').evaluate((root) => ({
    revision: root.getAttribute('data-workbench-revision'),
    widgets: [...root.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
  }))).toEqual(before);
  expect(await page.getByRole('article', { name: 'Characters' }).evaluate((article) => {
    const style = getComputedStyle(article);
    return { radius: style.borderRadius, family: style.fontFamily, color: style.color };
  })).toMatchObject({ radius: '0px' });
  await expect.poll(() => page.locator('[data-pom-part="row.surface"][data-pom-spacing="recipe"]').first()
    .evaluate((row) => getComputedStyle(row).paddingTop)).toBe('6px');
  if (process.platform === 'win32') {
    await expect(page).toHaveScreenshot('external-copper-fixture.png', { animations: 'disabled', caret: 'hide' });
  }
});

test('focused and floating compositions retain exactly one elevated material owner', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[1]);
  const world = page.getByRole('article', { name: 'Scene Effects' });

  await world.getByRole('button', { name: 'Focus Widget' }).click();
  const dialog = await material(page, '.focused-widget-dialog');
  expect(blurPx(dialog.backdrop)).toBeGreaterThan(0);
  const focusedFrame = page.locator('.focused-widget-dialog .widget-frame');
  await expect(focusedFrame).not.toHaveAttribute('data-pom-part');
  expect(blurPx((await material(page, '.focused-widget-dialog .widget-frame')).backdrop)).toBe(0);
  await page.getByRole('button', { name: 'Back to Workbench' }).click();

  await world.getByRole('button', { name: 'Float' }).click();
  const floatingWrapper = page.locator('.widget-float');
  await expect(floatingWrapper).not.toHaveAttribute('data-pom-part');
  const floatingFrame = floatingWrapper.locator('.widget-frame');
  await expect(floatingFrame).toHaveAttribute('data-pom-part', 'floating.surface');
  expect(blurPx((await material(page, '.widget-float .widget-frame')).backdrop)).toBeGreaterThan(0);
});

test('theme changes retain the Workbench tree and keyboard focus', async ({ page }) => {
  await fresh(page);
  const root = page.locator('main');
  const before = await root.evaluate((element) => ({
    revision: element.getAttribute('data-workbench-revision'),
    widgets: [...element.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
  }));
  for (const target of TARGETS) {
    await selectTheme(page, target, { closeDrawer: false });
    await expect(page.getByRole('button', { name: target.label, exact: true })).toBeFocused();
    expect(await root.evaluate((element) => ({
      revision: element.getAttribute('data-workbench-revision'),
      widgets: [...element.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
    }))).toEqual(before);
  }
});

test('all target compositions remain horizontally contained across wide, compact, and phone viewports', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await fresh(page, viewport.width, viewport.height);
    for (const target of TARGETS) {
      await selectTheme(page, target);
      expect(await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        root: document.querySelector('main')!.scrollWidth - document.querySelector('main')!.clientWidth
      })), `${target.label} at ${viewport.width}`).toEqual({ document: 0, root: 0 });
    }
  }
});

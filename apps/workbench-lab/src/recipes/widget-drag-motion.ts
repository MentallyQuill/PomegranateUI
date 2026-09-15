import type { DockRect } from './widget-docking.js';

const pending = new WeakMap<Document, () => void>();
const itemFor = (article: Element): HTMLElement => (article.closest('[data-widget-group]')
  ?? article.closest('[data-widget-type]') ?? article) as HTMLElement;

export function finishWidgetMotion(document: Document): void { pending.get(document)?.(); }

export function captureWidgetRects(root: ParentNode): ReadonlyMap<string, DOMRect> {
  return new Map([...root.querySelectorAll<HTMLElement>('[data-pomegranate-widget]')]
    .filter(node => !node.closest('[data-catalog-placement-proxy], .widget-drag-preview'))
    .map(node => [node.dataset.pomegranateWidget!, itemFor(node).getBoundingClientRect()]));
}

/** An inert snapshot, with no duplicate identities or active form controls. */
export function createDragVisual(source: HTMLElement, width: number, height: number, instanceId?: string): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  if (instanceId && clone.matches('[data-widget-group]')) {
    clone.querySelector('.widget-gesture-description')?.remove();
    for (const tab of clone.querySelectorAll<HTMLElement>('[data-group-tab]')) {
      if (tab.dataset.groupTab !== instanceId) (tab.closest('[data-tab-reorder-item]') ?? tab).remove();
      else tab.setAttribute('aria-selected', 'true');
    }
  }
  clone.dataset.dragVisual = 'true';
  clone.classList.remove('is-widget-dragging');
  clone.removeAttribute('data-widget-drag-placeholder');
  for (const node of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
    for (const attribute of [...node.attributes]) {
      if (['id', 'name', 'for', 'data-pomegranate-widget', 'data-pomegranate-placement'].includes(attribute.name)
        || attribute.name.startsWith('on')) node.removeAttribute(attribute.name);
    }
    node.removeAttribute('autofocus');
    if (node.matches('a, button, input, select, textarea, [tabindex]')) node.tabIndex = -1;
  }
  clone.inert = true;
  clone.style.cssText = `position:relative!important;left:0!important;top:0!important;width:${width}px!important;height:${height}px!important;min-width:0!important;min-height:0!important;margin:0!important;transform-origin:0 0;`;
  return clone;
}

/** The floating preview and command consume these exact same bounds. */
export function floatingBounds(surface: DockRect, source: DockRect, grab: { x: number; y: number }, point: { x: number; y: number }): DockRect {
  const width = Math.min(source.width, Math.max(1, surface.width - 16));
  const height = Math.min(source.height, Math.max(1, surface.height - 16));
  return {
    x: Math.max(8, Math.min(Math.max(8, surface.width - width - 8), point.x - surface.x - grab.x)),
    y: Math.max(8, Math.min(Math.max(8, surface.height - height - 8), point.y - surface.y - grab.y)),
    width, height
  };
}

export function animateWidgetPlacement(options: {
  readonly document: Document;
  readonly held: HTMLElement;
  readonly before: ReadonlyMap<string, DOMRect>;
  readonly destination: () => HTMLElement | null;
  readonly finished: () => void;
}): () => void {
  const { document, held } = options;
  const view = document.defaultView!;
  finishWidgetMotion(document);
  let done = false;
  let destination: HTMLElement | null = null;
  const animations: Animation[] = [];
  let frame = 0;
  const finish = () => {
    if (done) return;
    done = true;
    view.cancelAnimationFrame(frame);
    view.removeEventListener('blur', finish);
    view.removeEventListener('resize', finish);
    document.removeEventListener('scroll', finish, true);
    for (const animation of animations) animation.cancel();
    destination?.removeAttribute('data-widget-arriving');
    if (pending.get(document) === finish) pending.delete(document);
    options.finished();
  };
  pending.set(document, finish);
  view.addEventListener('blur', finish);
  view.addEventListener('resize', finish);
  document.addEventListener('scroll', finish, true);
  held.dataset.dropCommitting = 'true';
  frame = view.requestAnimationFrame(() => {
    if (done) return;
    const article = options.destination();
    if (!article || !held.isConnected || view.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    destination = itemFor(article);
    destination.dataset.widgetArriving = 'true';
    destination.dataset.widgetMotionComplete = 'true';
    destination.classList.remove('is-widget-dragging');
    destination.removeAttribute('data-widget-drag-placeholder');
    // Suppress the independent surface entrance before reading final geometry.
    const target = destination.getBoundingClientRect();
    const from = held.getBoundingClientRect();
    const seen = new Set<HTMLElement>();
    for (const node of document.querySelectorAll<HTMLElement>('[data-pomegranate-widget]')) {
      const item = itemFor(node);
      const before = options.before.get(node.dataset.pomegranateWidget!);
      if (!before || item === destination || seen.has(item) || item.closest('.widget-drag-preview, [data-catalog-placement-proxy]')) continue;
      seen.add(item);
      const after = item.getBoundingClientRect();
      const x = before.x - after.x, y = before.y - after.y;
      const bottom = Math.max(0, after.height - before.height), right = Math.max(0, after.width - before.width);
      if (Math.abs(x) + Math.abs(y) + bottom + right < 1) continue;
      const animation = item.animate([
        { transform: `translate(${x}px, ${y}px)`, clipPath: `inset(0 ${right}px ${bottom}px 0)` },
        { transform: 'translate(0, 0)', clipPath: 'inset(0 0 0 0)' }
      ], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
      animation.id = 'pom-widget-reflow';
      animations.push(animation);
    }
    const settle = held.animate([
      { offset: 0, transform: `translate3d(${from.x}px, ${from.y}px, 0)`, width: `${from.width}px`, height: `${from.height}px`, opacity: .96 },
      { offset: .8, transform: `translate3d(${target.x}px, ${target.y}px, 0)`, width: `${target.width}px`, height: `${target.height}px`, opacity: .96 },
      { offset: 1, transform: `translate3d(${target.x}px, ${target.y}px, 0)`, width: `${target.width}px`, height: `${target.height}px`, opacity: 0 }
    ], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    settle.id = 'pom-widget-settle';
    animations.push(settle);
    const arrival = destination.animate([{ opacity: 0 }, { opacity: 1 }], { delay: 160, duration: 40, fill: 'forwards' });
    arrival.id = 'pom-widget-arrival';
    animations.push(arrival);
    const visual = held.querySelector<HTMLElement>('[data-drag-visual]');
    if (visual) {
      const width = parseFloat(visual.style.width), height = parseFloat(visual.style.height);
      animations.push(visual.animate([
        { transform: view.getComputedStyle(visual).transform },
        { transform: `scale(${Math.min(target.width / width, target.height / height)})` }
      ], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }));
    }
    void settle.finished.then(finish, finish);
  });
  return finish;
}

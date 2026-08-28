export interface FocusOnMountAction {
  update(enabled: boolean): void;
  destroy(): void;
}

export function focusOnMount(node: HTMLElement, enabled: boolean): FocusOnMountAction {
  let alive = true;
  let scheduled = 0;
  const schedule = (shouldFocus: boolean) => {
    const token = ++scheduled;
    if (!shouldFocus) return;
    queueMicrotask(() => {
      if (alive && token === scheduled) node.focus();
    });
  };
  schedule(enabled);
  return Object.freeze({
    update(next: boolean): void {
      if (alive) schedule(next);
    },
    destroy(): void {
      alive = false;
      scheduled += 1;
    }
  });
}

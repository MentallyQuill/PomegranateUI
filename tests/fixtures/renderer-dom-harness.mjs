function button(document, name, attributes = {}) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = name;
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

export function createRendererDomHarness(document) {
  const root = document.createElement('main');
  document.body.append(root);
  let state;

  function resetState() {
    state = {
      tabs: ['Scene', 'Library'],
      active: 'Scene',
      docks: {
        left: ['Story Summary'],
        main: ['System Status'],
        right: ['Missing Widget']
      },
      floating: [],
      failed: [],
      revision: 0
    };
  }

  function slug(value) {
    return value.toLowerCase().replaceAll(' ', '-');
  }

  function render() {
    root.replaceChildren();
    root.dataset.hostStoryId = 'story-7';
    root.dataset.revision = String(state.revision);

    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Panels');
    for (const [index, name] of state.tabs.entries()) {
      const suffix = slug(name);
      const tab = button(document, name, {
        role: 'tab',
        id: `pomegranate-panel-tab-${suffix}`,
        'aria-controls': `pomegranate-panel-${suffix}`,
        'aria-selected': name === state.active
      });
      tab.dataset.moveLeftDisabled = String(index === 0);
      tab.dataset.moveRightDisabled = String(index === state.tabs.length - 1);
      tablist.append(tab);
    }
    root.append(tablist);

    const panelSuffix = slug(state.active);
    const panel = document.createElement('section');
    panel.id = `pomegranate-panel-${panelSuffix}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `pomegranate-panel-tab-${panelSuffix}`);
    root.append(panel);

    for (const edge of ['left', 'main', 'right']) {
      const dock = document.createElement('section');
      dock.dataset.pomegranateDock = edge;
      for (const title of state.docks[edge]) {
        const marker = document.createElement('span');
        marker.dataset.widgetTitle = title;
        dock.append(marker);
      }
      root.append(dock);
    }

    const floating = document.createElement('div');
    floating.dataset.pomegranateFloatingLayer = '';
    for (const title of state.floating) {
      const marker = document.createElement('span');
      marker.dataset.widgetTitle = title;
      floating.append(marker);
    }
    root.append(floating);

    const placements = new Map();
    for (const edge of ['left', 'main', 'right']) {
      for (const title of state.docks[edge]) placements.set(title, 'docked');
    }
    for (const title of state.floating) placements.set(title, 'floating');
    for (const [title, placement] of placements) {
      if (state.failed.includes(title)) continue;
      const widget = document.createElement('article');
      widget.dataset.pomegranateWidget = slug(title);
      widget.dataset.widgetTitle = title;
      widget.dataset.pomegranatePlacement = placement;
      widget.append(
        button(document, 'Dock left'),
        button(document, 'Dock main'),
        button(document, 'Dock right'),
        button(document, 'Float'),
        button(document, 'Remove')
      );
      root.append(widget);
    }

    if (placements.has('Missing Widget')) {
      const status = document.createElement('p');
      status.setAttribute('role', 'status');
      status.textContent = 'Renderer unavailable for Missing Widget.';
      root.append(status);
    }
    for (const title of state.failed) {
      const alert = document.createElement('p');
      alert.setAttribute('role', 'alert');
      alert.textContent = `${title} failed to render.`;
      root.append(alert);
    }
  }

  root.addEventListener('pomegranate-operation', (event) => {
    const operation = event.detail;
    if (operation.type === 'focus.next') {
      root.querySelector('[role="tab"][aria-controls="pomegranate-panel-library"]')?.focus();
      return;
    }
    if (operation.type === 'panel.activate') {
      state.active = operation.name;
      state.revision += 1;
    }
    if (operation.type === 'panel.reorder') {
      const from = state.tabs.indexOf(operation.name);
      const offset = operation.direction === 'left' ? -1 : 1;
      const to = Math.max(0, Math.min(state.tabs.length - 1, from + offset));
      state.tabs.splice(to, 0, state.tabs.splice(from, 1)[0]);
      state.revision += 1;
    }
    if (operation.type === 'widget.place') {
      for (const edge of ['left', 'main', 'right']) {
        state.docks[edge] = state.docks[edge].filter((title) => title !== operation.title);
      }
      state.floating = state.floating.filter((title) => title !== operation.title);
      if (operation.destination === 'floating') state.floating.push(operation.title);
      else state.docks[operation.destination].push(operation.title);
      state.revision += 1;
    }
    if (operation.type === 'renderer.fail') state.failed.push(operation.title);
    render();
  });

  function textList(selector) {
    return [...root.querySelectorAll(selector)]
      .map((element) => element.textContent?.trim() ?? '')
      .filter(Boolean);
  }

  return {
    async reset() {
      resetState();
      render();
    },
    async snapshot() {
      const tabs = [...root.querySelectorAll('[role="tab"]')];
      const panel = root.querySelector('[role="tabpanel"]');
      const dockTitles = (edge) => [...root.querySelectorAll(`[data-pomegranate-dock="${edge}"] [data-widget-title]`)]
        .map((element) => element.dataset.widgetTitle);
      return {
        tabListName: root.querySelector('[role="tablist"]')?.getAttribute('aria-label') ?? null,
        tabs: tabs.map((tab) => ({
          name: tab.textContent,
          id: tab.id,
          controls: tab.getAttribute('aria-controls'),
          selected: tab.getAttribute('aria-selected') === 'true',
          moveLeftDisabled: tab.dataset.moveLeftDisabled === 'true',
          moveRightDisabled: tab.dataset.moveRightDisabled === 'true'
        })),
        panel: panel ? { id: panel.id, labelledBy: panel.getAttribute('aria-labelledby') } : null,
        docks: {
          left: dockTitles('left'),
          main: dockTitles('main'),
          right: dockTitles('right')
        },
        floating: [...root.querySelectorAll('[data-pomegranate-floating-layer] [data-widget-title]')]
          .map((element) => element.dataset.widgetTitle),
        widgets: [...root.querySelectorAll('[data-pomegranate-widget]')].map((widget) => ({
          title: widget.dataset.widgetTitle,
          instanceId: widget.dataset.pomegranateWidget,
          placement: widget.dataset.pomegranatePlacement,
          actionNames: [...widget.querySelectorAll('button')].map((action) => action.textContent)
        })),
        statuses: textList('[role="status"]'),
        alerts: textList('[role="alert"]'),
        activeElementName: document.activeElement?.textContent?.trim() || null,
        hostStoryId: root.dataset.hostStoryId,
        revision: Number(root.dataset.revision)
      };
    },
    async perform(operation) {
      root.dispatchEvent(new document.defaultView.CustomEvent('pomegranate-operation', {
        bubbles: true,
        detail: operation
      }));
    }
  };
}

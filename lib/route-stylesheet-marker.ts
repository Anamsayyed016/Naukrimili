/** Matches `html { --nm-route-stylesheet: <id>; }` injected in route-scoped TW/scope CSS. */
export const ROUTE_STYLESHEET_MARKER_RE = /--nm-route-stylesheet:\s*([\w-]+)/;

export function getRouteStylesheetId(link: HTMLLinkElement): string | null {
  try {
    const rules = link.sheet?.cssRules;
    if (!rules) return null;
    for (let i = 0; i < rules.length; i++) {
      const match = rules[i].cssText.match(ROUTE_STYLESHEET_MARKER_RE);
      if (match) return match[1];
    }
  } catch {
    // Sheet not loaded yet or inaccessible
  }
  return null;
}

export function findRouteStylesheetLinks(layoutId?: string): HTMLLinkElement[] {
  return [...document.querySelectorAll('head link[rel="stylesheet"]')].filter((node) => {
    const link = node as HTMLLinkElement;
    const id = getRouteStylesheetId(link);
    if (!id) return false;
    return layoutId ? id === layoutId : true;
  });
}

export function removeRouteStylesheetLinks(layoutId?: string): void {
  findRouteStylesheetLinks(layoutId).forEach((link) => link.remove());

  const selector = layoutId
    ? `head link[data-nm-route-layout="${layoutId}"]`
    : 'head link[data-nm-route-layout]';
  document.querySelectorAll(selector).forEach((link) => link.remove());
}

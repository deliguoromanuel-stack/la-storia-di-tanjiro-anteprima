const base = import.meta.env.BASE_URL;

export function assetUrl(path: string) {
  return `${base}assets/${path}`;
}

export function pageUrl(path: string) {
  return `${base}${path.replace(/^\//, '')}`;
}

export function routePath() {
  const pathname = location.pathname;
  const path = pathname === base.slice(0, -1)
    ? '/'
    : pathname.startsWith(base) ? `/${pathname.slice(base.length)}` : pathname;
  return path.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
}

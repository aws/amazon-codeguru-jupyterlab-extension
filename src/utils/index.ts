export function isLightThemeActive(): boolean {
  return document.body.getAttribute('data-jp-theme-light') === 'true';
}

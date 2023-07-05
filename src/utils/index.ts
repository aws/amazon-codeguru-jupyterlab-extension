import { PLATFORM_ACRONYM } from '../constants';

export function isLightThemeActive(): boolean {
  return document.body.getAttribute('data-jp-theme-light') === 'true';
}

export function getPlatformAcronym(): string {
  const hostname = window.location.hostname;
  if (hostname.includes('sagemaker')) {
    return PLATFORM_ACRONYM.SAGEMAKER;
  }
  return PLATFORM_ACRONYM.LOCALHOST;
}

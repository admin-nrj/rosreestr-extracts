/* eslint-disable max-len */
/**
 * CSS Selectors for Rosreestr portal elements
 */
export const ROSREESTR_SELECTORS = {
  /** Sign in button/link on Rosreestr personal cabinet header */
  LK_SIGN_IN: '#personal-cabinet-root > div > div.rros-ui-lib-loading-container > header > div:nth-child(1) > div > div.top-info__user-wrap > div > div',
} as const;

/**
 * URLs for Rosreestr portal pages
 */
export const ROSREESTR_URLS = {
  /** Property search page in personal cabinet */
  PROPERTY_SEARCH: 'https://lk.rosreestr.ru/request-access-egrn/property-search',
} as const;

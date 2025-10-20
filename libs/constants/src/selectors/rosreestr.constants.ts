/* eslint-disable max-len */
/**
 * CSS Selectors for Rosreestr portal elements
 */
export const ROSREESTR_SELECTORS = {
  /** Sign in button/link on Rosreestr personal cabinet header */
  LK_SIGN_IN: '#headerTopInfo > div > div.top-info__user-wrap > div',
  CAD_NUM_INPUT: '#react-select-4-input',
  SEARCH: {
    CAD_KWARTAL_TAB: '#main-page-wrapper > div.main__content.main__indent.main__content_with-aside > div.rros-ui-lib-tabs > div.rros-ui-lib-tab__head.rros-ui-lib-tab__head--underline > div:nth-child(2) > div > div',
    OBJECT_SEARCH_TAB: '#main-page-wrapper > div.main__content.main__indent.main__content_with-aside > div.rros-ui-lib-tabs > div.rros-ui-lib-tab__head.rros-ui-lib-tab__head--underline > div:nth-child(1) > div > div',
    CLEAR_SEARCH_INPUT_BUTTON: '#_sipono-selector-property-search > label > div > div.rros-ui-lib-dropdown-container.css-2b097c-container > div > div.rros-ui-lib-dropdown__indicators.css-1wy0on6 > div.rros-ui-lib-dropdown__indicator.rros-ui-lib-dropdown__clear-indicator.css-tlfecz-indicatorContainer',
    CAD_NUM_INPUT: '#react-select-5-input',
    RESULT_FOUND: '#main-page-wrapper > div.main__content.main__indent.main__content_with-aside > div.rros-ui-lib-tabs > div.rros-ui-lib-tab > div > div > div.row.realestateobjects-wrapper__results > span',
    LIMIT: '#personal-cabinet-root > div > div.notifications > div > div > ul > li',
    RESULT_TABLE_ROW: '#main-page-wrapper > div.main__content.main__indent.main__content_with-aside > div.rros-ui-lib-tabs > div.rros-ui-lib-tab > div > div > div.row.realestateobjects-wrapper__results > div > div.rros-ui-lib-loading-container > div > div.rros-ui-lib-table__rows > div'
  },


} as const;

/**
 * URLs for Rosreestr portal pages
 */
export const ROSREESTR_URLS = {
  /** Property search page in personal cabinet */
  PROPERTY_SEARCH: 'https://lk.rosreestr.ru/request-access-egrn/property-search',
} as const;

/* eslint-disable max-len */
/**
 * CSS Selectors for Gosuslugi (ESIA) portal elements
 */
export const GU_SELECTORS = {
  /** Sign in button on Gosuslugi login page */
  SIGN_IN_BUTTON: 'body > esia-root > div > esia-login > div > div.form-container.esia-form-container.disable-outline > form > div.mt-40 > button',
  SIGN_IN_BUTTON2: 'body > esia-root > div > esia-login > div > div.form-container.outline-none > form > div:nth-child(5) > button',
  LOGIN_INPUT: '#login',
  PASSWORD_INPUT: '#password',

  /** Captcha fields */
  CAPTCHA_IMAGE_LABEL: 'body > esia-root > esia-reaction > div > div > div > div > div > h3',
  CAPTCHA_IMAGE: 'body > esia-root > esia-reaction > div > div > div > div > div > img',
  CAPTCHA_INPUT: 'body > esia-root > esia-reaction > div > div > div > div > div > div.esia-captcha__code-entry > label > input',
  CAPTCHA_CONTINUE_BUTTON: 'body > esia-root > esia-reaction > div > div > div > div > div > div.esia-captcha__code-entry > button',

  ANOMALY_ACTIVITY: 'body > esia-root > esia-reaction > div > div > div > div > h3',
  ANOMALY_ACTIVITY_QUESTION: 'body > esia-root > esia-reaction > div > div > div > div > p',
  ANOMALY_ACTIVITY_INPUT: 'body > esia-root > esia-reaction > div > div > div > div > div.abstract-request-information__input > div:nth-child(1) > label > input',
  ANOMALY_ACTIVITY_NEXT_BUTTON: 'body > esia-root > esia-reaction > div > div > div > div > div.abstract-request-information__input > div:nth-child(2) > button',

  MESSENGER_MAX_WELCOME_TEXT: 'body > esia-root > div > esia-login > div > div.form-container.esia-form-container.disable-outline > esia-max-quiz > div > h1',
  MESSENGER_MAX_SKIP_BUTTON: 'body > esia-root > div > esia-login > div > div.form-container.esia-form-container.disable-outline > esia-max-quiz > div > div.mt-40 > div > button',

  SMS_CODE_TEXT: 'body > esia-root > div > esia-login > div > div > esia-enter-mfa > esia-otp > div > form > div > esia-code-input > div > div',
  SMS_CODE_INPUT: 'body > esia-root > div > esia-login > div > div.form-container.esia-form-container.disable-outline > esia-enter-mfa > esia-otp > div:nth-child(1) > form > div > esia-code-input > div > div > code-input > span:nth-child(1) > input[type=tel]',

} as const;


export const GU_URLS = {
  LOGIN_PAGE: 'https://esia.gosuslugi.ru/login/'
} as const;

import { Injectable, Logger } from '@nestjs/common';
import { Cookie, Page } from 'puppeteer';
import { OrderStatus, ROSREESTR_SELECTORS, ROSREESTR_URLS } from '@rosreestr-extracts/constants';
import { PUPPETEER_TIMEOUTS } from '../common/puppeteer-options.constants';
import { elementExists, waitForTimeOut } from '../common/puppeteer.utils';
import { getErrorMessage } from '@rosreestr-extracts/utils';

@Injectable()
export class RosreestrOrderParsingService {
  private readonly logger = new Logger(RosreestrOrderParsingService.name);

  async placeOrder(page: Page, cadNum: string) {
    this.logger.log('Placing order...');
    await page.goto(ROSREESTR_URLS.PROPERTY_SEARCH, {
      waitUntil: 'networkidle2',
      timeout: PUPPETEER_TIMEOUTS.NAVIGATION,
    });
    await page.waitForSelector(ROSREESTR_SELECTORS.CAD_NUM_INPUT)

    let searchResult: { isError?: boolean; isLimit?: boolean; foundNumber?: number } =
      await this.searchObjectByCadNumber(page, cadNum)
        .catch((error) => {
          this.logger.error(getErrorMessage(error))
          return { isError: true }
        });

    while (searchResult.isError || searchResult.isLimit) {
      await waitForTimeOut(10000);
      searchResult = await this.searchObjectByCadNumber(page, cadNum)
        .catch((error) => {
          this.logger.error(getErrorMessage(error))
          return { isError: true }
        });
    }

    if (searchResult.foundNumber === 0 || searchResult.foundNumber === undefined) {
      return { status: OrderStatus.CAD_NUM_NOT_FOUND_ON_PORTAL }
    }

    this.logger.log('[placeOrder] Cad num found')
    await page.click(ROSREESTR_SELECTORS.SEARCH.RESULT_TABLE_ROW)
    await page.waitForNetworkIdle()

    // TODO: Implement cadastral number search and order processing
    // This is where the actual Rosreestr order flow would be implemented
    // For now, simulate processing with a delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simulate successful processing
    return `RR-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  private async searchObjectByCadNumber(page: Page, cadNum: string) {
    await page.click(ROSREESTR_SELECTORS.SEARCH.CAD_KWARTAL_TAB);
    await waitForTimeOut(500);
    await page.click(ROSREESTR_SELECTORS.SEARCH.OBJECT_SEARCH_TAB);
    await waitForTimeOut(500);

    await page.click(ROSREESTR_SELECTORS.SEARCH.CLEAR_SEARCH_INPUT_BUTTON)
    await waitForTimeOut(200)
    await page.focus(ROSREESTR_SELECTORS.SEARCH.CAD_NUM_INPUT)
    await page.keyboard.type(cadNum, { delay: 100 } )
    await waitForTimeOut(1000)
    await page.waitForSelector(ROSREESTR_SELECTORS.SEARCH.RESULT_FOUND)
    const isLimit = await elementExists(page, ROSREESTR_SELECTORS.SEARCH.LIMIT)
    if (isLimit) {
      const limitElement = await page.$(ROSREESTR_SELECTORS.SEARCH.LIMIT);
      const value = await page.evaluate(el => el?.textContent, limitElement)
      this.logger.warn('[placeCadNumOrder] limitElement value ' + value)

      return { isLimit }
    }

    const searchResultSpan = await page.$(ROSREESTR_SELECTORS.SEARCH.RESULT_FOUND);
    const searchResultText = await page.evaluate((el) => el?.textContent, searchResultSpan)
    const foundNumber = Number(searchResultText.split(':')[1])

    return { foundNumber: Number.isNaN(foundNumber) ? 0 : foundNumber }
  }
}

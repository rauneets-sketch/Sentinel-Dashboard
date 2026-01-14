const { BasePage } = require('./BasePage');
const logger = require('../utils/Logger');

class SearchBasedPurchasePage extends BasePage {
  constructor(page) {
    super(page);
  }

  async searchAndNavigateToProduct() {
    await this.page.getByRole('textbox', { name: 'search_bar' }).fill('cake');
    await this.page.getByRole('textbox', { name: 'search_bar' }).press('Enter');
    const productPagePromise = this.page.waitForEvent('popup');
    await this.page.getByRole('link', { name: 'Truffle Treat Bento Cake 1 2' }).click({ timeout: 10000 });
    const productPage = await productPagePromise;
    logger.info('🔍 Searched for cake and navigated to Truffle Treat Bento Cake product');
    return productPage;
  }

  async setDeliveryDateAndTime(productPage) {
    await productPage.getByText('Later').click({ timeout: 10000 });
    await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 10000 });
    await productPage.getByTestId('popover').getByText('15').click({ timeout: 10000 });
    await productPage.getByText(':00 - 09:00 Hrs').click({ timeout: 10000 });
    logger.info('📅 Delivery date and time slot set successfully');
  }

  async addToCart(productPage) {
    await productPage.getByRole('button', { name: 'Add To Cart' }).click({ timeout: 10000 });
    
    // Use enhanced continue button handling with Skip & Continue as primary
    try {
      // Primary: Skip & Continue (for addon handling)
      await productPage.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
      logger.info('✅ Skip & Continue button clicked');
    } catch (error) {
      // Fallback: Regular Continue
      try {
        await productPage.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 10000 });
        logger.info('✅ Continue button clicked');
      } catch (fallbackError) {
        logger.info('📝 No continue/skip buttons found, proceeding...');
      }
    }
    
    try {
      await productPage.getByTestId('drawer').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
    } catch (error) {
      logger.info('📝 Drawer button not found, proceeding...');
    }
    logger.info('🛒 Product added to cart successfully');
  }

  async proceedToPayment(productPage) {
    await productPage.locator('#proceed-to-pay-btn').click({ timeout: 10000 });
    logger.info('💳 Proceeded to payment page');
  }

  async testPayment(productPage) {
    const { PaymentPage } = require('./PaymentPage');
    const paymentPage = new PaymentPage(productPage);
    await paymentPage.testQRPayment(productPage);
    logger.info('✅ Payment flow tested successfully');
  }

  async completeSearchBasedJourney() {
    logger.info('🔍 Starting Journey 13: Search Based Purchase');
    const productPage = await this.searchAndNavigateToProduct();
    await this.setDeliveryDateAndTime(productPage);
    await this.addToCart(productPage);
    await this.proceedToPayment(productPage);
    await this.testPayment(productPage);
    await productPage.close();
    await this.navigateTo('https://www.fnp.com/', { waitUntil: 'domcontentloaded' });
    logger.info('✅ Journey 13: Search Based Purchase completed successfully');
  }
}

module.exports = SearchBasedPurchasePage;

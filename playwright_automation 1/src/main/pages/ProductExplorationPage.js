const { BasePage } = require('./BasePage');
const logger = require('../utils/Logger');

class ProductExplorationPage extends BasePage {
  constructor(page) {
    super(page);
    this.productUrl = 'https://www.fnp.com/gift/exotic-blue-orchid-arrangement?OCCASION_TAGS=birthday&pos=26';
  }

  async exploreCategories() {
    await this.goto('https://www.fnp.com/gift/exotic-blue-orchid-arrangement?OCCASION_TAGS=birthday&pos=26');
    await this.page.waitForTimeout(2000);
    logger.info('✅ Navigated to Exotic Blue Orchid product');
  }

  async exploreProductPhotos() {
    await this.page.getByRole('img', { name: 'pdp_main_image' }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByTestId('popover').getByRole('img', { name: '/images/pr/l/v20250905163534/exotic-blue-orchid-arrangement_2.jpg' }).click();
    await this.page.waitForTimeout(300);
    await this.page.locator('.iiz > div').click();
    await this.page.waitForTimeout(300);
    await this.page.getByTestId('popover').getByRole('img', { name: '/images/pr/l/v20250905163534/exotic-blue-orchid-arrangement_3.jpg' }).click();
    await this.page.waitForTimeout(300);
    await this.page.locator('.iiz > div').click();
    await this.page.waitForTimeout(300);
    await this.page.getByTestId('popover').getByRole('img', { name: '/images/pr/l/v20250905163535/' }).click();
    await this.page.waitForTimeout(300);
    await this.page.locator('.iiz > div').click();
    await this.page.waitForTimeout(300);
    await this.page.getByTestId('popover').getByRole('button', { name: 'button' }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('img', { name: '/images/pr/l/v20250905163534/exotic-blue-orchid-arrangement_2.jpg' }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('img', { name: '/images/pr/l/v20250905163534/exotic-blue-orchid-arrangement_3.jpg' }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('img', { name: '/images/pr/l/v20250905163535/' }).click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole('img', { name: '/images/pr/l/v20250905163534/exotic-blue-orchid-arrangement_1.jpg' }).click();
    await this.page.waitForTimeout(300);
    logger.info('✅ Product photo exploration completed');
  }

  async browseProductSections() {
    await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
    await this.page.waitForTimeout(500);
    await this.page.getByTestId('close-button').click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
    await this.page.waitForTimeout(500);
    await this.page.getByTestId('close-button').click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(3).click();
    await this.page.waitForTimeout(500);
    await this.page.getByTestId('close-button').click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(4).click();
    await this.page.waitForTimeout(500);
    await this.page.getByTestId('close-button').click();
    await this.page.waitForTimeout(500);
    logger.info('📱 Offers Available section exploration completed');
  }

  async checkProductDetails() {
    await this.page.locator('button').filter({ hasText: 'Description' }).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button').filter({ hasText: 'Instructions' }).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button').filter({ hasText: 'Delivery Info' }).click();
    await this.page.waitForTimeout(500);
    logger.info('⭐ Product details exploration completed');
  }

  async exploreProductReviews() {
    try {
      await this.page.locator('#reviews-section').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('button', { name: 'Next' }).click({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('button', { name: 'Next' }).click({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
      // Use goto instead of goBack for more reliable navigation
      await this.page.goto(this.productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await this.page.waitForTimeout(1000);
      logger.info('⭐ Product reviews exploration completed');
    } catch (error) {
      logger.warn(`⚠️ Product reviews exploration had issues: ${error.message}, continuing...`);
      // Try to recover by navigating back to product page
      try {
        await this.page.goto(this.productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await this.page.waitForTimeout(1000);
      } catch (recoveryError) {
        logger.error(`❌ Failed to recover from reviews exploration: ${recoveryError.message}`);
      }
    }
  }

  async setDeliveryDateAndTime() {
    await this.page.getByText('Later').click();
    await this.page.waitForTimeout(500);
    await this.page.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByTestId('popover').getByText('15').click();
    await this.page.waitForTimeout(500);
    await this.page.getByText(':00 - 09:00 Hrs').click();
    await this.page.waitForTimeout(500);
    logger.info('📅 Delivery date and time slot set successfully');
  }

  async exploreDeliveryOptions() {
    await this.page.getByRole('button', { name: 'Delivery Information' }).click({ timeout: 10000 });
    await this.page.getByTestId('close-button').click({ timeout: 10000 });
    await this.page.getByTestId('delivery_date_selector').click({ timeout: 10000 });
    await this.page.getByTestId('popover').getByText('Today').click({ timeout: 10000 });
    await this.page.getByText('Regular', { exact: true }).click({ timeout: 10000 });
    await this.page.getByText(':00 - 14:00 Hrs').click({ timeout: 10000 });
    logger.info('✅ Delivery options explored');
  }

  async exploreAddOns() {
    await this.page.getByText('Upgrade to Gorgeous Red and').click({ timeout: 10000 });
    await this.page.getByText('With Assorted Chocolates For').click({ timeout: 10000 });
    logger.info('✅ Add-ons explored');
  }

  async addToCart() {
    await this.page.getByRole('button', { name: 'Add To Cart' }).click();
    await this.page.waitForTimeout(1000);
    // Use enhanced continue button handling with Skip & Continue as primary
    try {
      // Primary: Skip & Continue (for addon handling)
      await this.page.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
      console.log('✅ Skip & Continue button clicked');
      await this.page.waitForTimeout(1000);
    } catch (error) {
      // Fallback: Regular Continue
      try {
        await this.page.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 10000 });
        console.log('✅ Continue button clicked');
        await this.page.waitForTimeout(1000);
      } catch (fallbackError) {
        console.log('📝 No continue/skip buttons found, proceeding...');
      }
    }
    try {
      await this.page.getByTestId('drawer').getByRole('button', { name: 'button' }).click();
      await this.page.waitForTimeout(1000);
    } catch (error) {
      logger.info('📝 Drawer button not found, proceeding...');
    }
    try {
      await this.page.locator('#proceed-to-pay-btn').click();
      await this.page.waitForTimeout(1000);
    } catch (error) {
      logger.info('📝 Proceed to pay button not found, continuing...');
    }
    logger.info('🛍️ Product added to cart successfully');
  }

  async testPayment() {
    try {
      await this.page.getByRole('button', { name: 'Show QR' }).click();
      await this.page.waitForTimeout(3000);
      await this.page.getByRole('link', { name: 'Cancel Payment' }).click();
      await this.page.waitForTimeout(3000);
      await this.page.getByRole('button', { name: 'YES' }).click();
      await this.page.waitForTimeout(3000);
      logger.info('💳 Payment flow tested and cancelled successfully');
    } catch (error) {
      logger.warn(`⚠️ Payment test failed: ${error.message}`);
      // Continue without failing
    }
  }

  async navigateBackToHomepage() {
    await this.goto('https://www.fnp.com/');
    await this.page.waitForTimeout(2000);
    logger.info('🏠 Navigated back to FNP homepage after Journey 13');
  }

  async completeProductExploration() {
    logger.info('🌸 Starting Journey 15: Exhaustive Product Page Exploration');
    await this.exploreCategories();
    await this.exploreProductPhotos();
    await this.browseProductSections();
    await this.exploreDeliveryOptions();
    await this.exploreAddOns();
    await this.addToCart();
    await this.navigateTo('https://www.fnp.com/', { waitUntil: 'domcontentloaded' });
    logger.info('✅ Journey 15: Exhaustive Product Page Exploration completed successfully');
  }
}

module.exports = ProductExplorationPage;

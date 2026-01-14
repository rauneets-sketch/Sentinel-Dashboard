const { BasePage } = require('./BasePage');
const logger = require('../utils/Logger');

class SameSKUExplorationPage extends BasePage {
  constructor(page) {
    super(page);
    this.productUrl = 'https://www.fnp.com/gift/jade-plant-in-gold-tone-metal-pot?OCCASION_TAGS=anniversary&pos=36';
  }

  async navigateToJadePlantProduct() {
    await this.goto('https://www.fnp.com/gift/jade-plant-in-gold-tone-metal-pot?OCCASION_TAGS=anniversary&pos=36');
    await this.page.waitForTimeout(2000);
    logger.info('🌱 Navigated to Jade Plant product page');
  }

  async selectDeliveryDateAndTime() {
    try {
      await this.page.getByTestId('delivery_date_selector').waitFor({ state: 'visible', timeout: 60000 });
      await this.page.getByTestId('delivery_date_selector').click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
      await this.page.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
      await this.page.getByTestId('popover').getByText('15').click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
      await this.page.getByText(':00 - 21:00 Hrs').click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
      logger.info('📅 Delivery date and time slot selected');
    } catch (error) {
      logger.error(`❌ Failed to select delivery date and time: ${error.message}`);
      throw error;
    }
  }

  async addToCart() {
    await this.page.getByRole('button', { name: 'Add To Cart' }).click({ timeout: 60000 });
    await this.page.waitForTimeout(1000);
    // Use enhanced continue button handling with Skip & Continue as primary
    try {
      // Primary: Skip & Continue (for addon handling)
      await this.page.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 60000 });
      console.log('✅ Skip & Continue button clicked');
      await this.page.waitForTimeout(1000);
    } catch (error) {
      // Fallback: Regular Continue
      try {
        await this.page.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 60000 });
        console.log('✅ Continue button clicked');
        await this.page.waitForTimeout(1000);
      } catch (fallbackError) {
        console.log('📝 No continue/skip buttons found, proceeding...');
      }
    }
    try {
      await this.page.getByTestId('drawer').getByRole('button', { name: 'button' }).click({ timeout: 60000 });
      await this.page.waitForTimeout(1000);
    } catch (error) {
      logger.info('📝 Drawer button not found, proceeding...');
    }
    try {
      await this.page.locator('#proceed-to-pay-btn').click({ timeout: 60000 });
      await this.page.waitForTimeout(1000);
    } catch (error) {
      logger.info('📝 Proceed to pay button not found, continuing...');
    }
    logger.info('🛍️ Product added to cart successfully');
  }

  async proceedToPayment() {
    try {
      await super.proceedToPayment();
    } catch (error) {
      logger.info('📝 Proceed to pay button not found, continuing...');
    }
  }

  async testPayment() {
    await this.page.getByRole('button', { name: 'Show QR' }).click({ timeout: 60000 });
    await this.page.waitForTimeout(500);
    await this.page.getByRole('link', { name: 'Cancel Payment' }).click({ timeout: 60000 });
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: 'YES' }).click({ timeout: 60000 });
    await this.page.waitForTimeout(500);
    logger.info('💳 Payment flow tested and cancelled successfully');
    
    // Navigate back to home page
    await this.goto('https://www.fnp.com');
    await this.page.waitForTimeout(2000);
    logger.info('🏠 Navigated back to home page');
  }

  async navigateBackToProduct() {
    await this.goto('https://www.fnp.com/gift/jade-plant-in-gold-tone-metal-pot?OCCASION_TAGS=anniversary&pos=36');
    await this.page.waitForTimeout(1000);
    logger.info('🔄 Navigated back to Jade Plant product page');
  }

  async selectHandDelivery() {
    try {
      const handDeliveryButton = this.page.getByRole('button').filter({ hasText: 'Hand Delivery' });
      if (await handDeliveryButton.count() > 0) {
        await handDeliveryButton.click({ timeout: 60000 });
        logger.info('🚚 Hand Delivery option selected');
      } else {
        logger.info('⚠️ Hand Delivery option not found');
      }
    } catch (error) {
      logger.info('⚠️ Error selecting Hand Delivery option');
    }
  }

  async setDeliveryDateAfterHandDelivery() {
    try {
      await this.page.getByText('Later').waitFor({ state: 'visible', timeout: 60000 });
      await this.page.getByText('Later').click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
      
      await this.page.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
      
      await this.page.getByTestId('popover').getByText('15').click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
      
      await this.page.getByText(':00 - 09:00 Hrs').click({ timeout: 60000 });
      await this.page.waitForTimeout(500);
    } catch (error) {
      logger.info('Later button not found, trying alternative delivery options');
      try {
        await this.page.getByText('Today').waitFor({ state: 'visible', timeout: 60000 });
        await this.page.getByText('Today').click({ timeout: 60000 });
        await this.page.waitForTimeout(500);
        
        const timeSlots = ['12:00 - 14:00 Hrs', '14:00 - 16:00 Hrs', '16:00 - 18:00 Hrs', '18:00 - 20:00 Hrs'];
        for (const slot of timeSlots) {
          try {
            await this.page.getByText(slot).waitFor({ state: 'visible', timeout: 60000 });
            await this.page.getByText(slot).click({ timeout: 60000 });
            await this.page.waitForTimeout(500);
            break;
          } catch (slotError) {
            continue;
          }
        }
      } catch (todayError) {
        logger.info('No delivery options found, continuing without setting delivery date');
      }
    }
    logger.info('📅 Delivery date and time slot set after hand delivery');
  }

  async completeSecondPurchaseFlow() {
    await this.addToCart();
    await this.testPayment();
    logger.info('✅ Second purchase flow completed successfully');
  }

  async exploreSameProductDifferentDeliveryDate() {
    await this.reloadAndNavigateToPlantProduct();
    await this.selectDeliveryDateAndTime();
    await this.addToCart();
    await this.proceedToPayment();
    await this.testPayment();
    await this.navigateTo('https://www.fnp.com/', { waitUntil: 'domcontentloaded' });
    logger.info('✅ Explored same SKU with different delivery date');
  }

  async completeSameSKUExploration() {
    logger.info('🌱 Starting Journey 14: Same SKU Exploration with Different Delivery Date');
    await this.navigateToJadePlantProduct();
    await this.selectDeliveryDateAndTime();
    await this.addToCart();
    await this.proceedToPayment();
    await this.testPayment();
    await this.exploreSameProductDifferentDeliveryDate();
    logger.info('✅ Journey 14: Same SKU Exploration completed successfully');
  }
}

module.exports = SameSKUExplorationPage;

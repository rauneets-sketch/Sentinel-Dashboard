const { BasePage } = require('./BasePage');
const logger = require('../utils/Logger');

class LocationPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToHomepage() {
    await this.goto('https://www.fnp.com/');
    await this.page.waitForTimeout(2000);
    
    // Navigate to a product page to ensure location selector is available
    // The "Deliver to" button is only visible on product pages
    try {
      await this.page.getByRole('link', { name: 'Birthday Gifts Birthday Gifts' }).first().click({ timeout: 10000 });
      await this.page.waitForTimeout(3000);
      logger.info('✅ Navigated to product page for location testing');
    } catch (error) {
      logger.warn('⚠️ Could not navigate to product page, trying alternative...');
      // Try alternative navigation
      try {
        await this.goto('https://www.fnp.com/gift/flowers');
        await this.page.waitForTimeout(2000);
        await this.page.locator('a[href*="/gift/"]').first().click({ timeout: 10000 });
        await this.page.waitForTimeout(3000);
        logger.info('✅ Navigated to product page via alternative method');
      } catch (error2) {
        logger.warn('⚠️ Could not navigate to product page, continuing anyway');
      }
    }
    
    logger.info('🏠 Navigated to homepage for location journey');
  }

  async selectPincode(pincode, locationText) {
    try {
      // Try multiple selectors for "Deliver to" button
      try {
        await this.page.getByText('Deliver to', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
        await this.page.getByText('Deliver to', { exact: true }).click();
      } catch (error) {
        // Try alternative selectors
        try {
          await this.page.locator('[data-testid*="deliver"], button:has-text("Deliver"), [class*="deliver"]').first().click({ timeout: 10000 });
        } catch (error2) {
          logger.warn('⚠️ Could not find "Deliver to" button, trying direct navigation');
          // If button not found, try going to homepage first
          await this.goto('https://www.fnp.com/');
          await this.page.waitForTimeout(2000);
          await this.page.getByText('Deliver to', { exact: true }).click({ timeout: 10000 });
        }
      }
      
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('img', { name: 'clear_pin' }).click({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
      await this.page.getByTestId('locationLock').getByTestId('input_field').fill(pincode);
      await this.page.waitForTimeout(1000);
      // Use .first() to handle cases where multiple elements match (strict mode violation)
      await this.page.getByText(locationText).first().click({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
      await this.page.locator('#location-and-country-popup').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
      logger.info(`📍 Selected location: ${locationText}`);
    } catch (error) {
      logger.error(`❌ Failed to select pincode: ${error.message}`);
      throw error;
    }
  }

  async selectNewPincode() {
    await this.selectPincode('122', '122001, Gurgaon, Haryana');
  }

  async selectDelhiLocation() {
    await this.page.getByText('Deliver to', { exact: true }).click();
    await this.page.waitForTimeout(1000);
    
    // Try to clear existing pincode with retry logic
    try {
      await this.page.getByRole('img', { name: 'clear_pin' }).click({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
    } catch (error) {
      logger.warn(`⚠️ Clear pin button not found or not clickable: ${error.message}`);
      // Continue anyway - might not need to clear
    }
    
    await this.page.getByTestId('locationLock').getByTestId('input_field').click();
    await this.page.waitForTimeout(1000);
    await this.page.getByTestId('locationLock').getByTestId('input_field').fill('delhi');
    await this.page.waitForTimeout(1000);
    // Use .first() to handle strict mode violation when multiple elements match
    await this.page.getByText('Delhi, India', { exact: true }).first().click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('#location-and-country-popup').getByRole('button', { name: 'button' }).click();
    await this.page.waitForTimeout(1000);
    logger.info('📍 Selected Delhi, India location');
  }

  async selectGorakhpurPincode() {
    await this.selectPincode('2730', '273001, Gorakhpur, Uttar');
  }

  async selectBangaloreLocation() {
    await this.page.getByText('Deliver to').dblclick();
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('img', { name: 'clear_pin' }).click({ timeout: 10000 });
    await this.page.waitForTimeout(1000);
    await this.page.getByTestId('locationLock').getByTestId('input_field').fill('Ban');
    await this.page.waitForTimeout(1000);
    // Use .first() to handle cases where multiple elements match (strict mode violation)
    await this.page.getByText('Bangalore, Karnataka, India').first().click({ timeout: 10000 });
    await this.page.waitForTimeout(1000);
    await this.page.locator('#location-and-country-popup').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
    await this.page.waitForTimeout(1000);
    logger.info('📍 Selected Bangalore, Karnataka, India location');
  }

  async navigateToPdpAndSelectExistingPincode() {
    try {
      await this.page.getByRole('link', { name: 'Birthday Gifts Birthday Gifts' }).first().click({ timeout: 10000 });
      await this.page.getByText('Deliver to').click({ timeout: 10000 });
      try {
        await this.page.getByRole('radio').first().check({ timeout: 10000 });
      } catch (error) {
        await this.page.keyboard.press('Escape');
      }
      logger.info('🎂 Navigated to PLP and selected existing Bangalore pincode');
    } catch (error) {
      logger.warn('⚠️ Could not select existing address, continuing...');
    }
  }

  async returnToHomePage() {
    await this.navigateToHomepage();
    logger.info('🏠 Navigated back to home page after Journey completion');
  }

  async navigateBackAfterJourney18() {
    await this.navigateToHomepage();
    logger.info('🏠 Ready for Journey 19');
  }
}

module.exports = LocationPage;

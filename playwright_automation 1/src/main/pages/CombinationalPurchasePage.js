const { BasePage } = require('./BasePage');

class CombinationalPurchasePage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToProduct() {
    await this.goto('https://www.fnp.com/gift/celebration-red-velvet-swirl-candle-bento-cake?OCCASION_TAGS=anniversary&pos=2');
    await this.page.waitForTimeout(2000);
    return this.page;
  }

  async setDomesticDeliveryDate(productPage) {
    await productPage.getByText('Later').click();
    await productPage.waitForTimeout(1000);
    await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click();
    await productPage.waitForTimeout(1000);
    await productPage.getByTestId('popover').getByText('15').click();
    await productPage.waitForTimeout(1000);
    await productPage.getByText(':00 - 13:00 Hrs').click();
    await productPage.waitForTimeout(1000);
  }

  async addDomesticToCart(productPage) {
    await productPage.getByRole('button', { name: 'Add To Cart' }).click();
    
    // Use enhanced continue button handling with Skip & Continue as primary
    try {
      // Primary: Skip & Continue (for addon handling)
      await productPage.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
      console.log('✅ Skip & Continue button clicked');
    } catch (error) {
      // Fallback: Regular Continue
      try {
        await productPage.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 10000 });
        console.log('✅ Continue button clicked');
      } catch (fallbackError) {
        console.log('📝 No continue/skip buttons found, proceeding to drawer');
      }
    }
    
    await productPage.waitForTimeout(2000);
  }

  async navigateToInternational(productPage) {
    const winston = require('winston');
    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });

    // Try to close cart drawer/modal if it exists
    try {
      logger.info('🔍 Looking for close button...');
      const closeButton = productPage.getByTestId('close-button');
      await closeButton.waitFor({ state: 'visible', timeout: 10000 });
      await closeButton.click({ timeout: 10000 });
      logger.info('✅ Close button clicked');
    } catch (error) {
      logger.info('📝 Close button not found or not needed, continuing...');
      // Try alternative methods to close any open drawers
      try {
        await productPage.keyboard.press('Escape');
        logger.info('✅ Pressed Escape to close drawer');
      } catch (e) {
        logger.info('📝 No drawer to close');
      }
    }

    // Navigate to homepage
    try {
      await productPage.getByRole('link', { name: 'Ferns N Petals' }).click({ timeout: 10000 });
      logger.info('✅ Clicked Ferns N Petals logo');
    } catch (error) {
      logger.info('⚠️ Logo click failed, navigating directly to homepage');
      await productPage.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    // Navigate to USA gifts page with timeout and delay tracking
    const startTime = Date.now();
    logger.info('🌍 Navigating to USA gifts page...');
    try {
      await productPage.goto('https://www.fnp.com/usa/gifts-lp', { waitUntil: 'domcontentloaded', timeout: 60000 });
      const loadTime = Date.now() - startTime;

      if (loadTime > 30000) {
        logger.warn(`⏱️ Page Load Delay: USA gifts page took ${(loadTime / 1000).toFixed(2)}s to load (threshold: 30s)`);
        global.pageLoadDelays = global.pageLoadDelays || [];
        global.pageLoadDelays.push({
          page: 'USA Gifts Page (Combinational Journey)',
          loadTime: loadTime,
          timestamp: new Date().toISOString()
        });
      }

      logger.info(`✅ Successfully navigated to USA gifts page in ${(loadTime / 1000).toFixed(2)}s`);
    } catch (error) {
      const loadTime = Date.now() - startTime;
      logger.error(`❌ Navigation to USA gifts page failed after ${(loadTime / 1000).toFixed(2)}s: ${error.message}`);
      global.pageLoadDelays = global.pageLoadDelays || [];
      global.pageLoadDelays.push({
        page: 'USA Gifts Page (Combinational Journey)',
        loadTime: loadTime,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async setUSALocation(productPage) {
    await productPage.getByText('Where to deliver?').click({ timeout: 10000 });
    await productPage.getByTestId('locationLock').getByTestId('input_field').click({ timeout: 10000 });
    const inputField = productPage.getByTestId('locationLock').getByTestId('input_field');
    await inputField.type('A');
    await inputField.type('a');
    await inputField.type('r');
    await productPage.getByText('Aaronsburg,PA').waitFor({ state: 'visible', timeout: 10000 });
    await productPage.getByText('Aaronsburg,PA').click({ timeout: 10000 });
    await productPage.locator('#location-and-country-popup').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
  }

  async navigateToInternationalAnniversary(productPage) {
    try {
      await productPage.locator('#microSiteContent').getByRole('link', { name: 'Anniversary', exact: true }).click();
      await productPage.waitForTimeout(2000);
    } catch (error) {
      console.log('International Anniversary navigation failed:', error.message);
      // Try alternative approach or continue
      await productPage.waitForTimeout(1000);
    }
  }

  async selectInternationalProduct(productPage) {
    try {
      // First, remove target="_blank" to ensure it opens in same tab
      await productPage.evaluate(() => {
        const links = document.querySelectorAll('a[target="_blank"]');
        links.forEach(link => {
          if (link.textContent.includes('Beautifully Tied 12 Red Roses')) {
            link.removeAttribute('target');
          }
        });
      });
      await productPage.waitForTimeout(500);
      
      // Try popup first (in case it still opens in new tab)
      const pagePromise = productPage.waitForEvent('popup', { timeout: 10000 }).catch(() => null);
      await productPage.getByRole('link', { name: 'Beautifully Tied 12 Red Roses' }).click();
      const newPage = await pagePromise;
      
      if (newPage) {
        await newPage.waitForTimeout(2000);
        return newPage;
      } else {
        // Opened in same tab, wait for navigation
        await productPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
        await productPage.waitForTimeout(2000);
        return productPage;
      }
    } catch (error) {
      // Fallback: if popup fails, assume it opened in same tab
      await productPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await productPage.waitForTimeout(2000);
      return productPage;
    }
  }

  async setInternationalDeliveryDate(internationalProductPage) {
    await internationalProductPage.getByTestId('delivery_date_selector').click();
    await internationalProductPage.waitForTimeout(1000);
    await internationalProductPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click();
    await internationalProductPage.waitForTimeout(1000);
    await internationalProductPage.getByText('15', { exact: true }).click();
    await internationalProductPage.waitForTimeout(1000);
    await internationalProductPage.getByText(':00 - 21:00 Hrs').click();
    await internationalProductPage.waitForTimeout(1000);
  }

  async addInternationalToCartAndCheckout(internationalProductPage) {
    await internationalProductPage.getByRole('button', { name: 'Add To Cart' }).click();
    await internationalProductPage.waitForTimeout(2000);
    await internationalProductPage.getByTestId('drawer').getByRole('button', { name: 'button' }).click();
    await internationalProductPage.waitForTimeout(2000);
    await internationalProductPage.locator('#proceed-to-pay-btn').click();
    await internationalProductPage.waitForTimeout(2000);
  }

  async testCombinationalPayment(internationalProductPage) {
    await internationalProductPage.getByRole('button', { name: 'Show QR' }).click();
    await internationalProductPage.waitForTimeout(2000);
    await internationalProductPage.getByRole('link', { name: 'Cancel Payment' }).click();
    await internationalProductPage.waitForTimeout(1000);
    await internationalProductPage.getByRole('button', { name: 'YES' }).click();
    await internationalProductPage.waitForTimeout(2000);
  }

  async returnToHomepage(internationalProductPage) {
    try {
      // Close popup window if it exists and return to main window
      const context = internationalProductPage.context();
      const pages = context.pages();

      if (pages.length > 1) {
        console.log('Multiple windows detected, closing popup windows');
        // Close all popup windows except the main one
        for (let i = pages.length - 1; i > 0; i--) {
          try {
            await pages[i].close();
            console.log(`Closed popup window ${i}`);
          } catch (closeError) {
            console.log(`Failed to close window ${i}:`, closeError.message);
          }
        }

        // Switch to main window
        const mainPage = pages[0];
        await mainPage.bringToFront();
        console.log('Switched back to main window');

        // Navigate to homepage from main window
        await mainPage.goto('https://www.fnp.com/', {
          waitUntil: 'domcontentloaded',
          timeout: 45000
        });
      } else {
        // Single window, navigate directly
        await internationalProductPage.goto('https://www.fnp.com/', {
          waitUntil: 'domcontentloaded',
          timeout: 45000
        });
      }

      console.log('Successfully returned to homepage after Journey 7');
    } catch (error) {
      console.log('Failed to return to homepage, continuing:', error.message);
    }
  }
}

module.exports = { CombinationalPurchasePage };

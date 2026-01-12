const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class CakeVariantPage extends BasePage {
  constructor(page) {
    super(page);
    this.cakeUrl = 'https://www.fnp.com/gift/fudge-brownie-cake-half-kg-eggless?OCCASION_TAGS=birthday&pos=35';
  }

  async navigateToHomepage() {
    try {
      await this.goto('https://www.fnp.com/');
      await this.page.waitForTimeout(2000);
      console.log('Navigated to homepage');
    } catch (error) {
      console.log('Failed to navigate to homepage:', error.message);
      throw error;
    }
  }

  async navigateToCakeProduct() {
    try {
      await this.goto(this.cakeUrl);
      await this.page.waitForTimeout(3000);
      try {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
          console.log('⚠️ Network not idle, continuing');
        });
      } catch (error) {
        console.log('Network idle timeout, continuing with current state');
      }
      console.log('Navigated to Fudge Brownie Cake product');
      return this.page;
    } catch (error) {
      console.log('Failed to navigate to cake product:', error.message);
      throw error;
    }
  }

  async setDeliveryDateAndAddToCart(productPage) {
    try {
      await productPage.getByText('Later').click();
      await productPage.waitForTimeout(500);
      await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click();
      await productPage.waitForTimeout(500);
      await productPage.getByTestId('popover').getByText('15').click();
      await productPage.waitForTimeout(500);
      await productPage.getByText('Fixed Time Delivery').click();
      await productPage.waitForTimeout(500);
      await productPage.getByText(':00 - 12:00 Hrs').click();
      await productPage.waitForTimeout(500);
      await productPage.getByRole('button', { name: 'Add To Cart' }).click();
      await productPage.waitForTimeout(1000);
      
      // Use enhanced continue button handling with Skip & Continue as primary
      try {
        // Primary: Skip & Continue (for addon handling)
        await productPage.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
        console.log('✅ Skip & Continue button clicked');
      } catch (error) {
        // Fallback: Regular Continue
        try {
          const continueButton = productPage.locator('button').filter({ hasText: 'Continue' });
          if (await continueButton.isVisible({ timeout: 2000 })) {
            await continueButton.click();
            console.log('✅ Continue button clicked');
          }
        } catch (fallbackError) {
          console.log('📝 No continue/skip buttons found, proceeding...');
        }
      }
      await productPage.waitForTimeout(1000);
      
      // Make close-button optional - it may not always appear
      try {
        const closeButton = productPage.getByTestId('close-button');
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click();
          await productPage.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('Close button not found or not visible, proceeding');
      }
      
      console.log('Delivery date set and product added to cart');
    } catch (error) {
      console.log('Failed to set delivery date and add to cart:', error.message);
      throw error;
    }
  }

  async changeCakeVariant(productPage) {
    try {
      // Wait for page to stabilize
      await productPage.waitForTimeout(2000);
      
      // Remove all intercepting elements using JavaScript before attempting click
      await productPage.evaluate(() => {
        // Remove or hide all intercepting overlays/backdrops
        const selectors = [
          'div.fixed.inset-0.z-10',
          'p.w-full.overflow-hidden.truncate.pt-8',
          'div[data-testid=""].text-14.font-600',
          '[data-testid="backdrop"]',
          '.fixed.inset-0'
        ];
        
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el) {
                // Remove from DOM or disable pointer events
                el.style.pointerEvents = 'none';
                el.style.display = 'none';
                el.style.visibility = 'hidden';
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });
      });
      
      await productPage.waitForTimeout(1000);
      
      // Press Escape multiple times to close any modals
      for (let i = 0; i < 5; i++) {
        await productPage.keyboard.press('Escape');
        await productPage.waitForTimeout(200);
      }
      
      await productPage.waitForTimeout(1000);
      
      // Get the WITH EGG button
      const withEggButton = productPage.getByRole('button', { name: 'WITH EGG' });
      
      // Wait for button to be visible
      await withEggButton.waitFor({ state: 'visible', timeout: 10000 });
      await productPage.waitForTimeout(500);
      
      // Use JavaScript click to bypass interception
      try {
        await withEggButton.evaluate((btn) => {
          btn.click();
        });
      } catch (error) {
        // If JavaScript click fails, try force click
        console.log('JavaScript click failed, trying force click...');
        await withEggButton.click({ force: true, timeout: 5000 });
      }
      
      await productPage.waitForTimeout(2000);
      
      // Click image variant
      await productPage.getByRole('img', { name: 'image', exact: true }).nth(1).click();
      await productPage.waitForTimeout(3000);
      console.log('Cake variant changed successfully');
    } catch (error) {
      console.log('Failed to change cake variant:', error.message);
      throw error;
    }
  }
}

module.exports = { CakeVariantPage };

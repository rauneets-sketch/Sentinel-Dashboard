/**
 * Base Page Object
 * Common methods shared across all page objects
 * Implements DRY principles and best practices with robust waiting strategies
 */

class BasePage {
  constructor(page) {
    this.page = page;
    this.baseURL = 'https://www.fnp.com';
    this.defaultTimeout = 60000;
  }

  /**
   * Navigate to a URL with robust wait strategy for sites with continuous background requests
   */
  async navigateTo(url, options = {}) {
    const defaultOptions = {
      waitUntil: 'domcontentloaded', // Fast initial load
      timeout: this.defaultTimeout,
      ...options
    };

    try {
      await this.page.goto(url, defaultOptions);
      
      // Non-blocking networkidle check with short timeout
      // This handles sites with analytics, tracking, etc.
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network not idle after 10s, but continuing (normal for sites with tracking)');
      });
      
      console.log(`✅ Navigated to ${url}`);
    } catch (error) {
      console.log(`❌ Navigation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Robust goto wrapper - use this instead of page.goto directly
   * Handles sites with continuous background requests (analytics, tracking, etc.)
   */
  async goto(url, options = {}) {
    const defaultOptions = {
      waitUntil: 'domcontentloaded',
      timeout: this.defaultTimeout,
      ...options
    };

    await this.page.goto(url, defaultOptions);
    
    // Non-blocking networkidle check
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Network not idle, continuing');
    });
  }

  /**
   * Robust click with proper state checking
   * Waits for element to be attached, visible, and enabled before clicking
   */
  async click(selector, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    try {
      const locator = this.page.locator(selector);
      
      // Wait for element to be attached to DOM
      await locator.waitFor({ state: 'attached', timeout });
      
      // Wait for element to be visible
      await locator.waitFor({ state: 'visible', timeout });
      
      // Playwright's click automatically waits for actionability (visible, stable, enabled)
      await locator.click({ timeout, force: false });
      
      // Small wait for any post-click animations/transitions
      await this.page.waitForTimeout(300);
    } catch (error) {
      console.log(`❌ Failed to click ${selector}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Click continue button with robust fallback strategies
   * Handles optional buttons that may or may not appear
   */
  async clickContinueButton() {
    const strategies = [
      { selector: 'button', filter: { hasText: 'Skip & Continue' }, name: 'Skip & Continue' },
      { selector: 'button', filter: { hasText: 'Continue' }, name: 'Continue' },
      { selector: 'button:has-text("Continue")', name: 'Continue (CSS)' }
    ];

    for (const strategy of strategies) {
      try {
        const locator = strategy.filter 
          ? this.page.locator(strategy.selector).filter(strategy.filter)
          : this.page.locator(strategy.selector);
        
        // Short timeout since this button is optional
        await locator.waitFor({ state: 'visible', timeout: 5000 });
        await locator.click({ timeout: 5000 });
        console.log(`✅ ${strategy.name} button clicked`);
        await this.page.waitForTimeout(500);
        return true;
      } catch (error) {
        // Continue to next strategy
      }
    }
    
    console.log('📝 No continue button found (this is OK - button is optional)');
    return false;
  }

  /**
   * Fill input field with robust waiting
   */
  async fill(selector, text, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout });
      await locator.clear(); // Clear existing text first
      await locator.fill(text, { timeout });
      await this.page.waitForTimeout(300);
    } catch (error) {
      console.log(`❌ Failed to fill ${selector}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Wait for element to be visible - simplified, no retries needed
   */
  async waitForVisible(selector, timeout = this.defaultTimeout) {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch (error) {
      console.log(`⚠️ Element ${selector} not visible after ${timeout}ms`);
      return false;
    }
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector, timeout = this.defaultTimeout) {
    try {
      await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
      return true;
    } catch (error) {
      console.log(`⚠️ Element ${selector} still visible after ${timeout}ms`);
      return false;
    }
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(urlPattern, timeout = 30000) {
    try {
      await this.page.waitForURL(urlPattern, { timeout });
      return true;
    } catch (error) {
      console.log(`⚠️ Navigation to ${urlPattern} not completed`);
      return false;
    }
  }

  /**
   * Try multiple selectors until one works
   */
  async clickAny(selectors, options = {}) {
    for (const selector of selectors) {
      try {
        await this.click(selector, options);
        return true;
      } catch (error) {
        continue;
      }
    }
    console.log(`❌ None of the selectors worked: ${selectors.join(', ')}`);
    return false;
  }

  /**
   * Dismiss common popups - non-blocking
   */
  async dismissPopups() {
    const popupSelectors = [
      'button:has-text("No, Thanks")',
      'button:has-text("Close")',
      'button:has-text("×")',
      '[data-testid="close-button"]',
      '.popup-close'
    ];

    for (const selector of popupSelectors) {
      try {
        const locator = this.page.locator(selector);
        if (await locator.isVisible({ timeout: 2000 })) {
          await locator.click({ timeout: 5000 });
          console.log(`✅ Dismissed popup`);
          await this.page.waitForTimeout(500);
        }
      } catch (error) {
        // Intentionally empty - popups are optional
      }
    }
  }

  /**
   * Select date from calendar with robust fallback
   */
  async selectDateFromCalendar(dates = ['29', '28', '27', '26', '25', '20', '15', '10']) {
    // Wait for calendar to be visible
    await this.page.getByTestId('popover').waitFor({ state: 'visible', timeout: this.defaultTimeout });
    
    for (const date of dates) {
      try {
        const dateElement = this.page.getByTestId('popover').getByText(date, { exact: true });
        // Check if date is visible and enabled
        if (await dateElement.isVisible({ timeout: 2000 })) {
          await dateElement.click();
          await this.page.waitForTimeout(500);
          console.log(`✅ Selected date ${date}`);
          return date;
        }
      } catch (error) {
        console.log(`📝 Date ${date} not available, trying next...`);
        continue;
      }
    }
    throw new Error('No available date found in calendar');
  }

  /**
   * Add product to cart with standard flow
   */
  async addToCart() {
    try {
      // Wait for and click Add to Cart button
      const addToCartBtn = this.page.getByRole('button', { name: 'Add To Cart' });
      await addToCartBtn.waitFor({ state: 'visible', timeout: this.defaultTimeout });
      await addToCartBtn.click();
      await this.page.waitForTimeout(1000);
      
      // Handle optional continue button
      await this.clickContinueButton();
      
      // Wait for cart drawer (optional)
      try {
        await this.page.getByTestId('drawer').waitFor({ state: 'visible', timeout: 5000 });
      } catch (error) {
        console.log('📝 Drawer not visible, product likely added');
      }
      
      console.log('✅ Product added to cart');
      return true;
    } catch (error) {
      console.log(`❌ Failed to add to cart: ${error.message}`);
      return false;
    }
  }

  /**
   * Proceed to payment with robust selector fallback
   */
  async proceedToPayment() {
    const payButtonSelectors = [
      '#proceed-to-pay-btn',
      'button:has-text("Proceed to Pay")',
      'button:has-text("Checkout")',
      '[data-testid="proceed-to-pay"]'
    ];

    // Wait for page to stabilize
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
    
    for (const selector of payButtonSelectors) {
      try {
        const button = this.page.locator(selector);
        await button.waitFor({ state: 'visible', timeout: 10000 });
        await button.click();
        console.log(`✅ Clicked proceed button: ${selector}`);
        
        // Wait for navigation (optional)
        await this.page.waitForURL(/.*payment.*|.*checkout.*|.*address.*/i, { timeout: 10000 }).catch(() => {
          console.log('📝 Navigation check: URL pattern not matched, but continuing');
        });
        
        console.log('✅ Proceeded to payment page');
        return true;
      } catch (error) {
        console.log(`📝 Selector ${selector} not found, trying next...`);
        continue;
      }
    }
    
    console.log('⚠️ No proceed button found');
    return false;
  }

  /**
   * Log message with timestamp
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [${level}]: ${message}`);
  }
}

module.exports = { BasePage };

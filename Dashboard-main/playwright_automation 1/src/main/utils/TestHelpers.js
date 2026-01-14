/**
 * Test Helper Utilities
 * Common helper functions for test automation
 */

class TestHelpers {
  /**
   * Safely click an element with retry logic
   * @param {Page} page - Playwright page object
   * @param {string} selector - Element selector
   * @param {number} timeout - Timeout in milliseconds
   */
  static async safeClick(page, selector, timeout = 5000) {
    try {
      await page.locator(selector).waitFor({ state: 'visible', timeout });
      await page.locator(selector).click({ timeout });
    } catch (error) {
      console.log(`Failed to click ${selector}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Select a date from calendar with fallback options
   * @param {Page} page - Playwright page object
   * @param {Array<string>} dates - Array of dates to try
   */
  static async selectAvailableDate(page, dates = ['29', '28', '27', '26', '25', '20', '15']) {
    for (const date of dates) {
      try {
        const dateElement = page.getByTestId('popover').getByText(date, { exact: true });
        await dateElement.click({ timeout: 2000 });
        console.log(`✅ Selected date ${date}`);
        return date;
      } catch (error) {
        console.log(`📝 Date ${date} not available, trying next...`);
        continue;
      }
    }
    throw new Error('No available date found in calendar');
  }

  /**
   * Navigate with retry and proper wait
   * @param {Page} page - Playwright page object
   * @param {string} url - URL to navigate to
   * @param {object} options - Navigation options
   */
  static async navigateTo(page, url, options = {}) {
    const defaultOptions = {
      waitUntil: 'load',
      timeout: 60000,
      ...options
    };

    try {
      await page.goto(url, defaultOptions);
      console.log(`✅ Navigated to ${url}`);
    } catch (error) {
      console.log(`⚠️ Navigation to ${url} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Try multiple selectors until one works
   * @param {Page} page - Playwright page object
   * @param {Array<string>} selectors - Array of selectors to try
   * @param {string} action - Action to perform ('click', 'fill', etc.)
   * @param {any} value - Value for the action (optional)
   */
  static async trySelectors(page, selectors, action = 'click', value = null) {
    for (const selector of selectors) {
      try {
        const element = page.locator(selector);
        await element.waitFor({ state: 'visible', timeout: 3000 });

        if (action === 'click') {
          await element.click();
        } else if (action === 'fill' && value) {
          await element.fill(value);
        }

        console.log(`✅ ${action} successful on selector: ${selector}`);
        return true;
      } catch (error) {
        console.log(`📝 Selector ${selector} not found, trying next...`);
        continue;
      }
    }
    return false;
  }

  /**
   * Wait for element to be visible or hidden
   * @param {Page} page - Playwright page object
   * @param {string} selector - Element selector
   * @param {string} state - State to wait for ('visible' or 'hidden')
   * @param {number} timeout - Timeout in milliseconds
   */
  static async waitForElement(page, selector, state = 'visible', timeout = 30000) {
    try {
      await page.locator(selector).waitFor({ state, timeout });
      return true;
    } catch (error) {
      console.log(`Element ${selector} not ${state} within ${timeout}ms`);
      return false;
    }
  }

  /**
   * Handle common popup dismissals
   * @param {Page} page - Playwright page object
   */
  static async dismissPopups(page) {
    const popupSelectors = [
      'button:has-text("No, Thanks")',
      'button:has-text("Close")',
      'button:has-text("×")',
      '[data-testid="close-button"]'
    ];

    for (const selector of popupSelectors) {
      try {
        await page.locator(selector).click({ timeout: 2000 });
        console.log(`✅ Dismissed popup: ${selector}`);
      } catch (error) {
      // Intentionally empty
    }
    }
  }

  /**
   * Format logger output with timestamp
   * @param {string} level - Log level (INFO, ERROR, WARN)
   * @param {string} message - Log message
   */
  static log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [${level}]: ${message}`);
  }
}

module.exports = { TestHelpers };


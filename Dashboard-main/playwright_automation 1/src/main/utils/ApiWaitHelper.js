/**
 * API Wait Helper - Provides waitForResponse utilities with Promise.all pattern
 * Ensures UI actions and API calls are tracked together
 */
const { apiTracker } = require('./ApiTracker');
const logger = require('./Logger');

class ApiWaitHelper {
  /**
   * Execute UI action and wait for API response simultaneously
   * @param {Page} page - Playwright page object
   * @param {Function} uiAction - UI action to execute (e.g., page.click, page.fill)
   * @param {Object} options - Wait options
   * @param {string|RegExp|Function} options.urlPattern - URL pattern to match
   * @param {string} options.method - HTTP method (optional)
   * @param {number} options.statusCode - Expected status code (optional)
   * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
   * @param {string} options.actionName - Name of the action for tracking
   * @param {string} options.selector - Selector used for the action
   * @returns {Promise<{response: Response, actionResult: any}>}
   */
  static async waitForResponseWithAction(page, uiAction, options = {}) {
    const {
      urlPattern,
      method = null,
      statusCode = null,
      timeout = 30000,
      actionName = 'UI Action',
      selector = null
    } = options;

    // Record UI action
    apiTracker.recordUIAction(actionName, selector, { method, expectedUrl: urlPattern });

    // Create predicate for response matching
    const predicate = (response) => {
      const url = response.url();
      const resMethod = response.request().method();

      let urlMatch = false;
      if (typeof urlPattern === 'string') {
        urlMatch = url.includes(urlPattern);
      } else if (urlPattern instanceof RegExp) {
        urlMatch = urlPattern.test(url);
      } else if (typeof urlPattern === 'function') {
        urlMatch = urlPattern(response);
      }

      const methodMatch = method ? resMethod === method.toUpperCase() : true;
      const statusMatch = statusCode ? response.status() === statusCode : true;

      return urlMatch && methodMatch && statusMatch;
    };

    // Start tracking for this action
    apiTracker.startTrackingStep(actionName, `Wait for API response after ${actionName}`);

    try {
      // Execute UI action and wait for response using Promise.all
      const [response, actionResult] = await Promise.all([
        page.waitForResponse(predicate, { timeout }),
        uiAction()
      ]);

      // Record the API call
      apiTracker.recordApiCall(response, response.request());

      logger.info(`✅ API Response received: ${response.request().method()} ${response.url()} - ${response.status()}`);

      return { response, actionResult };
    } catch (error) {
      logger.error(`❌ API wait failed for ${actionName}: ${error.message}`);
      apiTracker.completeStep('failed', error);
      throw error;
    }
  }

  /**
   * Wait for multiple API responses
   */
  static async waitForMultipleResponses(page, uiAction, urlPatterns, timeout = 30000) {
    const promises = urlPatterns.map(pattern =>
      page.waitForResponse(res => {
        const url = res.url();
        return typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url);
      }, { timeout })
    );

    const [responses, actionResult] = await Promise.all([
      Promise.all(promises),
      uiAction()
    ]);

    responses.forEach(response => {
      apiTracker.recordApiCall(response, response.request());
    });

    return { responses, actionResult };
  }
}

module.exports = { ApiWaitHelper };


/**
 * ApiResponseTracker - Captures API responses during test execution
 * Provides API context for failed steps without impacting performance
 */
const logger = require('./Logger');

class ApiResponseTracker {
  constructor() {
    this.currentStepApiCalls = [];
    this.allApiCalls = [];
    this.isTracking = false;
  }

  /**
   * Start tracking API calls for a step
   */
  startStepTracking(stepName) {
    this.currentStepApiCalls = [];
    this.isTracking = true;
  }

  /**
   * Record an API response
   */
  recordApiResponse(response, request) {
    if (!this.isTracking) return;

    try {
      const apiCall = {
        url: response.url(),
        method: request?.method() || 'GET',
        status: response.status(),
        statusText: response.statusText(),
        timestamp: Date.now(),
        headers: this.sanitizeHeaders(response.headers())
      };

      // Try to capture response body (async, non-blocking)
      this.captureResponseBody(response, apiCall);

      this.currentStepApiCalls.push(apiCall);
    } catch (error) {
      logger.debug(`Failed to record API response: ${error.message}`);
    }
  }

  /**
   * Capture response body asynchronously
   */
  async captureResponseBody(response, apiCall) {
    try {
      const contentType = response.headers()['content-type'] || '';
      
      // Only capture JSON responses to keep data manageable
      if (contentType.includes('application/json')) {
        const body = await response.json();
        apiCall.responseBody = this.sanitizeResponseBody(body);
      } else if (contentType.includes('text/')) {
        const text = await response.text();
        apiCall.responseBody = text.substring(0, 500); // Limit text responses
      }
    } catch (error) {
      apiCall.responseBody = 'Unable to parse response body';
    }
  }

  /**
   * Complete step tracking and store API calls
   */
  completeStepTracking(stepName, status) {
    if (this.currentStepApiCalls.length > 0) {
      this.allApiCalls.push({
        step: stepName,
        status: status,
        apiCalls: [...this.currentStepApiCalls],
        timestamp: Date.now()
      });
    }
    this.currentStepApiCalls = [];
  }

  /**
   * Get API calls for the last failed step
   */
  getFailedStepApiCalls() {
    const failedSteps = this.allApiCalls.filter(step => step.status === 'FAILED');
    return failedSteps.length > 0 ? failedSteps[failedSteps.length - 1] : null;
  }

  /**
   * Get API calls for current step
   */
  getCurrentStepApiCalls() {
    return [...this.currentStepApiCalls];
  }

  /**
   * Format API calls for Slack reporting
   */
  formatApiCallsForSlack(apiCalls, maxCalls = 3) {
    if (!apiCalls || apiCalls.length === 0) {
      return null;
    }

    let message = '';
    const callsToShow = apiCalls.slice(0, maxCalls);

    callsToShow.forEach((call, index) => {
      message += `\n  *API Call ${index + 1}:*\n`;
      message += `  • Method: ${call.method} ${call.status}\n`;
      message += `  • URL: ${this.truncateUrl(call.url)}\n`;
      
      if (call.status >= 400) {
        message += `  • Status: ⚠️ ${call.status} ${call.statusText}\n`;
      } else {
        message += `  • Status: ✅ ${call.status} ${call.statusText}\n`;
      }

      // Show response body for failed API calls
      if (call.status >= 400 && call.responseBody) {
        const formattedBody = this.formatResponseBody(call.responseBody);
        if (formattedBody) {
          message += `  • Response:\n\`\`\`\n${formattedBody}\n\`\`\`\n`;
        }
      }
    });

    if (apiCalls.length > maxCalls) {
      message += `\n  _... and ${apiCalls.length - maxCalls} more API call(s)_\n`;
    }

    return message;
  }

  /**
   * Truncate URL for display
   */
  truncateUrl(url) {
    if (!url) return 'Unknown URL';
    
    // Remove query parameters for cleaner display
    const urlWithoutQuery = url.split('?')[0];
    
    if (urlWithoutQuery.length > 80) {
      return urlWithoutQuery.substring(0, 77) + '...';
    }
    return urlWithoutQuery;
  }

  /**
   * Format response body for display
   */
  formatResponseBody(body) {
    if (!body) return null;

    try {
      if (typeof body === 'string') {
        // Try to parse if it's a JSON string
        try {
          const parsed = JSON.parse(body);
          return JSON.stringify(parsed, null, 2).substring(0, 500);
        } catch {
          return body.substring(0, 300);
        }
      } else if (typeof body === 'object') {
        // Format object nicely
        const formatted = JSON.stringify(body, null, 2);
        return formatted.substring(0, 500);
      }
    } catch (error) {
      return 'Unable to format response';
    }

    return null;
  }

  /**
   * Sanitize headers (remove sensitive data)
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'token', 'set-cookie'];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize response body (remove sensitive fields)
   */
  sanitizeResponseBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization', 'creditCard', 'cvv'];
    
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          result[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          result[key] = sanitizeObject(obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
      
      return result;
    };

    return sanitizeObject(body);
  }

  /**
   * Clear all tracking data
   */
  clear() {
    this.currentStepApiCalls = [];
    this.allApiCalls = [];
    this.isTracking = false;
  }

  /**
   * Stop tracking
   */
  stopTracking() {
    this.isTracking = false;
  }
}

// Singleton instance
const apiResponseTracker = new ApiResponseTracker();

module.exports = { ApiResponseTracker, apiResponseTracker };

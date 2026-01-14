const Imap = require('imap');
const { simpleParser } = require('mailparser');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gmail-otp.log' })
  ]
});

class GmailOtpClient {
  constructor(emailAddress, appPassword) {
    this.emailAddress = emailAddress;
    this.appPassword = appPassword;
    this.defaultEmail = 'fnptest460@gmail.com';
    this.defaultAppPassword = 'bynftcjodppnfdxe';
  }

  /**
   * Fetch OTP from Gmail using IMAP
   * @returns {Promise<string|null>} OTP code or null if not found
   */
  async getOTPFromGmail() {
    return new Promise((resolve, reject) => {
      logger.info('[GMAIL_LOGIN_STEP_9] IMAP - Attempting connection to Gmail for: {}', this.emailAddress);

      const imap = new Imap({
        user: this.emailAddress,
        password: this.appPassword,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      // Store all OTP messages with timestamps
      const otpMessages = [];

      imap.once('ready', () => {
        logger.info('[GMAIL_LOGIN_STEP_9] IMAP - Connection successful');

        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            logger.error('[GMAIL_LOGIN_STEP_9] IMAP - Failed to open inbox: {}', err.message);
            imap.end();
            return reject(err);
          }

          logger.info('[GMAIL_LOGIN_STEP_9] IMAP - Inbox opened successfully');

          // Search for unread messages from the last 5 minutes
          const fiveMinutesAgo = new Date();
          fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

          // Search for recent unread messages
          imap.search(['UNSEEN', ['SINCE', fiveMinutesAgo]], (err, results) => {
            if (err) {
              logger.info('[GMAIL_LOGIN_STEP_9] IMAP - Recent search failed, trying all unread messages');
              // Fallback to all unread messages
              imap.search(['UNSEEN'], (err2, results2) => {
                if (err2) {
                  logger.error('[GMAIL_LOGIN_STEP_9] IMAP - Search failed: {}', err2.message);
                  imap.end();
                  return reject(err2);
                }
                processResults(results2);
              });
            } else {
              processResults(results);
            }
          });

          function processResults(results) {
            logger.info(`[GMAIL_LOGIN_STEP_9] IMAP - Found ${results.length} unread messages`);

            if (results.length === 0) {
              logger.warn('[GMAIL_LOGIN_STEP_9] IMAP - No unread messages found');
              imap.end();
              return resolve(null);
            }

            // Fetch the most recent unread messages (last 10)
            const recentMessages = results.slice(-10);
            const fetch = imap.fetch(recentMessages, { bodies: '' });
            let processedCount = 0;

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream, info) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    logger.error('[GMAIL_LOGIN_STEP_9] IMAP - Failed to parse message: {}', err.message);
                    return;
                  }

                  const subject = parsed.subject || '';
                  const body = parsed.text || '';
                  const date = parsed.date || new Date(0);

                  logger.info(`[GMAIL_LOGIN_STEP_9] IMAP - Checking email with subject: ${subject}`);

                  if (subject.includes('OTP') || body.includes('OTP')) {
                    // Try to extract OTP from subject
                    const subjectPattern = /OTP\s+(\d{4,6})/i;
                    const subjectMatch = subject.match(subjectPattern);

                    let extractedOtp = null;

                    if (subjectMatch) {
                      extractedOtp = subjectMatch[1];
                      logger.info(`[GMAIL_LOGIN_STEP_9] IMAP - OTP extracted from subject: ${extractedOtp}`);
                    }

                    // Try to extract OTP from body if not found in subject
                    if (!extractedOtp) {
                      const bodyPatterns = [
                        /Your OTP\s*-\s*<strong>(\d{4,6})<\/strong>/i,
                        /Your OTP\s*-\s*(\d{4,6})/i,
                        /OTP\s*:?\s*(\d{4,6})/i,
                        /code\s*:?\s*(\d{4,6})/i,
                        /verification\s*code\s*:?\s*(\d{4,6})/i
                      ];

                      for (const pattern of bodyPatterns) {
                        const bodyMatch = body.match(pattern);
                        if (bodyMatch) {
                          extractedOtp = bodyMatch[1];
                          logger.info(`[GMAIL_LOGIN_STEP_9] IMAP - OTP extracted from body: ${extractedOtp}`);
                          break;
                        }
                      }
                    }

                    // Store OTP with timestamp
                    if (extractedOtp) {
                      otpMessages.push({
                        otp: extractedOtp,
                        date: date,
                        subject: subject
                      });
                      logger.info(`[GMAIL_LOGIN_STEP_9] IMAP - Stored OTP: ${extractedOtp} with date: ${date.toISOString()}`);
                    }
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              logger.error('[GMAIL_LOGIN_STEP_9] IMAP - Fetch error: {}', err.message);
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              logger.info('[GMAIL_LOGIN_STEP_9] IMAP - Finished fetching messages');
              imap.end();

              setTimeout(() => {
                if (otpMessages.length > 0) {
                  // Sort by date (most recent first)
                  otpMessages.sort((a, b) => b.date - a.date);
                  const mostRecentOtp = otpMessages[0].otp;
                  logger.info(`[GMAIL_LOGIN_STEP_9] IMAP - Found ${otpMessages.length} OTP messages`);
                  logger.info(`[GMAIL_LOGIN_STEP_9] IMAP - Most recent OTP: ${mostRecentOtp} from ${otpMessages[0].date.toISOString()}`);
                  resolve(mostRecentOtp);
                } else {
                  logger.warn('[GMAIL_LOGIN_STEP_9] IMAP - No OTP found in inbox');
                  resolve(null);
                }
              }, 1500);
            });
          }
        });
      });

      imap.once('error', (err) => {
        logger.error('[GMAIL_LOGIN_STEP_9] IMAP - Connection error: {}', err.message);
        reject(err);
      });

      imap.once('end', () => {
        logger.info('[GMAIL_LOGIN_STEP_9] IMAP - Connection closed successfully');
      });

      imap.connect();
    });
  }

  /**
   * Perform complete Gmail OTP login flow
   * @param {Object} page - Playwright page object
   * @returns {Promise<boolean>} Success status
   */
  async performEmailOtpLogin(page) {
    const startTime = Date.now();
    let stepStartTime;

    try {
      // STEP 1: Handle Initial Popups
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_1] Handle Initial Popups - STARTED');
      await this.handlePopups(page);
      logger.info(`[GMAIL_LOGIN_STEP_1] Handle Initial Popups - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // Check if already on login drawer
      const alreadyOnLoginDrawer = await this.checkLoginDrawerVisible(page);

      // STEP 2: Click User/Account Button
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_2] Click User Account Button - STARTED');
      if (!alreadyOnLoginDrawer) {
        try {
          await page.locator('#account button').click();
          logger.info('[GMAIL_LOGIN_STEP_2] Click User Account Button - User button clicked successfully');
        } catch (error) {
          logger.warn('[GMAIL_LOGIN_STEP_2] Click User Account Button - Trying alternative');
          await page.getByRole('button', { name: 'Hi Guest' }).click();
        }
      } else {
        logger.info('[GMAIL_LOGIN_STEP_2] Click User Account Button - SKIPPED (already on drawer)');
      }
      logger.info(`[GMAIL_LOGIN_STEP_2] Click User Account Button - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 3: Click Login Button in Popover
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_3] Click Login Popover Button - STARTED');
      if (!alreadyOnLoginDrawer) {
        try {
          await page.locator('#popOver span').filter({ hasText: /Login|Register/i }).first().click();
          logger.info('[GMAIL_LOGIN_STEP_3] Click Login Popover Button - Login button clicked successfully');
        } catch (error) {
          logger.info('[GMAIL_LOGIN_STEP_3] Click Login Popover Button - SKIPPED (button not found)');
        }
      }
      logger.info(`[GMAIL_LOGIN_STEP_3] Click Login Popover Button - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 4: Remove Overlay Elements
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_4] Remove Overlay Elements - STARTED');
      await this.removeOverlays(page);
      logger.info(`[GMAIL_LOGIN_STEP_4] Remove Overlay Elements - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 5: Enter Email Address
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_5] Enter Email Address - STARTED');
      try {
        await page.locator('#userEmail').clear();
        await page.locator('#userEmail').fill(this.emailAddress);
        logger.info(`[GMAIL_LOGIN_STEP_5] Enter Email Address - Email entered: ${this.emailAddress}`);
      } catch (error) {
        logger.error(`[GMAIL_LOGIN_STEP_5] Enter Email Address - FAILED: ${error.message}`);
        return false;
      }
      logger.info(`[GMAIL_LOGIN_STEP_5] Enter Email Address - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 6: Click Continue to Request OTP
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_6] Click Continue to Request OTP - STARTED');
      try {
        await page.locator('#right_drawer button').filter({ hasText: 'Continue' }).click();
        logger.info('[GMAIL_LOGIN_STEP_6] Click Continue to Request OTP - Continue button clicked');
      } catch (error) {
        logger.error(`[GMAIL_LOGIN_STEP_6] Click Continue to Request OTP - FAILED: ${error.message}`);
        return false;
      }
      logger.info(`[GMAIL_LOGIN_STEP_6] Click Continue to Request OTP - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 7: Click Next Button (optional)
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_7] Click Next Button - STARTED');
      try {
        await page.locator('#right_drawer button').filter({ hasText: 'Next' }).click({ timeout: 3000 });
        logger.info('[GMAIL_LOGIN_STEP_7] Click Next Button - Next button clicked');
      } catch (error) {
        logger.info('[GMAIL_LOGIN_STEP_7] Click Next Button - SKIPPED (button not found)');
      }
      logger.info(`[GMAIL_LOGIN_STEP_7] Click Next Button - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 8: Wait for OTP Email Delivery
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_8] Wait for OTP Email Delivery - STARTED (15 seconds)');
      logger.info(`[GMAIL_LOGIN_STEP_8] Wait for OTP Email Delivery - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 9: Fetch OTP from Gmail via IMAP
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_9] Fetch OTP from Gmail via IMAP - STARTED');
      const otp = await this.getOTPFromGmail();

      if (!otp) {
        logger.error('[GMAIL_LOGIN_STEP_9] Fetch OTP from Gmail via IMAP - FAILED: No OTP found');
        return false;
      }
      logger.info(`[GMAIL_LOGIN_STEP_9] Fetch OTP from Gmail via IMAP - COMPLETED in ${Date.now() - stepStartTime}ms, OTP: ${otp}`);

      // STEP 10: Wait for OTP Input Page
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_10] Wait for OTP Input Page - STARTED');
      logger.info(`[GMAIL_LOGIN_STEP_10] Wait for OTP Input Page - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 11: Enter OTP Digits
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_11] Enter OTP Digits - STARTED');
      await this.enterOTP(page, otp);
      logger.info(`[GMAIL_LOGIN_STEP_11] Enter OTP Digits - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 12: Click Submit Button
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_12] Click Submit Button - STARTED');
      try {
        await page.locator('#right_drawer button').filter({ hasText: /Confirm|Submit/i }).click();
        logger.info('[GMAIL_LOGIN_STEP_12] Click Submit Button - Submit button clicked');
      } catch (error) {
        logger.warn(`[GMAIL_LOGIN_STEP_12] Click Submit Button - FAILED: ${error.message}`);
        return false;
      }
      logger.info(`[GMAIL_LOGIN_STEP_12] Click Submit Button - COMPLETED in ${Date.now() - stepStartTime}ms`);

      // STEP 13: Handle Post-Login Popups
      stepStartTime = Date.now();
      logger.info('[GMAIL_LOGIN_STEP_13] Handle Post-Login Popups - STARTED');
      await this.handlePopups(page);
      logger.info(`[GMAIL_LOGIN_STEP_13] Handle Post-Login Popups - COMPLETED in ${Date.now() - stepStartTime}ms`);

      const totalTime = Date.now() - startTime;
      logger.info(`[GMAIL_LOGIN_COMPLETE] Total Gmail OTP login time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);

      return true;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`[GMAIL_LOGIN_ERROR] Gmail OTP login flow failed: ${error.message}`);
      logger.info(`[GMAIL_LOGIN_ERROR] Total time before failure: ${totalTime}ms`);
      return false;
    }
  }

  async handlePopups(page) {
    try {
      // Try to close iframe popup
      const iframe = page.locator('#wiz-iframe');
      if (await iframe.isVisible({ timeout: 2000 })) {
        const frame = await iframe.contentFrame();
        if (frame) {
          await frame.getByRole('link', { name: '×' }).click({ timeout: 2000 });
          logger.info('✅ Iframe popup closed');
        }
      }
    } catch (error) {
      logger.info('📝 No iframe popup found');
    }

    try {
      await page.getByRole('button', { name: 'No, Thanks' }).click({ timeout: 2000 });
      logger.info('✅ No Thanks button clicked');
    } catch (error) {
      logger.info('📝 No Thanks button not found');
    }

    // Remove overlays programmatically
    try {
      await page.evaluate(() => {
        const overlays = document.querySelectorAll('.wzrk-overlay, [class*="overlay"], [class*="popup"]');
        overlays.forEach(overlay => {
          if (overlay.style.position === 'fixed' || overlay.style.position === 'absolute') {
            overlay.style.display = 'none';
          }
        });
      });
    } catch (error) {
      logger.info('📝 No overlays to remove');
    }
  }

  async checkLoginDrawerVisible(page) {
    try {
      const emailField = page.locator('#userEmail');
      return await emailField.isVisible({ timeout: 2000 });
    } catch (error) {
      return false;
    }
  }

  async removeOverlays(page) {
    try {
      await page.evaluate(() => {
        const overlays = document.querySelectorAll('.wzrk-overlay');
        overlays.forEach(overlay => {
          overlay.style.display = 'none';
        });
      });
      logger.info('[GMAIL_LOGIN_STEP_4] Remove Overlay Elements - Overlay removed successfully');
    } catch (error) {
      logger.info('[GMAIL_LOGIN_STEP_4] Remove Overlay Elements - No overlay found');
    }
  }

  async enterOTP(page, otp) {
    const digits = otp.split('');

    try {
      // Use the correct locators matching FNP's OTP input fields
      logger.info(`[GMAIL_LOGIN_STEP_11] Enter OTP Digits - Entering digit 1: ${digits[0]}`);
      await page.getByRole('textbox', { name: 'Please enter verification' }).fill(digits[0]);

      logger.info(`[GMAIL_LOGIN_STEP_11] Enter OTP Digits - Entering digit 2: ${digits[1]}`);
      await page.getByRole('textbox', { name: 'Digit 2' }).fill(digits[1]);

      logger.info(`[GMAIL_LOGIN_STEP_11] Enter OTP Digits - Entering digit 3: ${digits[2]}`);
      await page.getByRole('textbox', { name: 'Digit 3' }).fill(digits[2]);

      logger.info(`[GMAIL_LOGIN_STEP_11] Enter OTP Digits - Entering digit 4: ${digits[3]}`);
      await page.getByRole('textbox', { name: 'Digit 4' }).fill(digits[3]);

      logger.info(`[GMAIL_LOGIN_STEP_11] Enter OTP Digits - Successfully entered all digits: ${otp}`);
      return true;
    } catch (error) {
      logger.error(`[GMAIL_LOGIN_STEP_11] Enter OTP Digits - FAILED: ${error.message}`);
      throw new Error(`Failed to enter OTP digits: ${error.message}`);
    }
  }
}

module.exports = { GmailOtpClient };


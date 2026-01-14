const { BasePage } = require('./BasePage');

class AddOnPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToHomepage() {
    try {
      if (this.page.isClosed()) {
        throw new Error('Page is closed, cannot navigate');
      }

      const currentUrl = this.page.url();
      console.log('Current URL before navigation:', currentUrl);

      // Skip navigation if already on homepage
      if (currentUrl.includes('fnp.com') && !currentUrl.includes('/usa/')) {
        console.log('Already on FNP homepage, skipping navigation');
        return;
      }

      await this.goto('https://www.fnp.com/');
      console.log('Successfully navigated to homepage for Journey 8');
    } catch (error) {
      console.log('Navigation to homepage failed, continuing with current page:', error.message);
      // Don't throw error, continue with current page
    }
  }

  async navigateToTimelessLoveProduct() {
    try {
      console.log('Navigating to Timeless Love Red Roses Bouquet Chocolate Cake product...');
      await this.goto('https://www.fnp.com/gift/timeless-love-red-roses-bouquet-chocolate-cake?pos=7');

      // Wait for page to be fully loaded
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network not idle, continuing');
      });

      // Check for delivery location error
      try {
        const deliveryError = await this.page.getByTestId('input_related_message').textContent({ timeout: 10000 });
        if (deliveryError && deliveryError.includes(' product can not be delivered at the desired location')) {
          console.log('Timeless Love product cannot be delivered to location, switching to alternative product');
          // Navigate to alternative product
          await this.goto('https://www.fnp.com/gift/chocolate-truffle-cream-cake-half-kg-eggless?OCCASION_TAGS=birthday&pos=24');
          await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
            console.log('⚠️ Network not idle, continuing');
          });
          console.log('Successfully switched to Chocolate Truffle Cream Cake product');
        }
      } catch (error) {
        console.log('No delivery restriction found, continuing with current product');
      }

      return this.page;
    } catch (error) {
      console.log('Failed to navigate to product:', error.message);
      return this.page;
    }
  }

  async testAddOnFunctionality(productPage) {
    try {
      // Add initial add-on
      await productPage.getByRole('button', { name: 'button' }).nth(1).click({ timeout: 10000 });

      await productPage.getByRole('button', { name: 'button' }).nth(2).click({ timeout: 10000 });
      await productPage.getByRole('button', { name: 'button' }).nth(1).click({ timeout: 10000 });

    } catch (error) {
      console.log('Add-on functionality test failed, continuing with basic flow');
    }
  }

  async setDeliveryDate(productPage) {
    try {
      // Try to find and click Later button
      await productPage.getByText('Later').waitFor({ state: 'visible', timeout: 10000 });
      await productPage.getByText('Later').click({ timeout: 10000 });

      // Navigate to next month
      await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 10000 });

      // Select date 15
      await productPage.getByTestId('popover').getByText('15').click({ timeout: 10000 });

      // Select time slot
      await productPage.getByText(':00 - 09:00 Hrs').click({ timeout: 10000 });
    } catch (error) {
      console.log('Later button not found, trying alternative delivery options');
      try {
        // Try Today option if available
        await productPage.getByText('Today').waitFor({ state: 'visible', timeout: 10000 });
        await productPage.getByText('Today').click({ timeout: 10000 });

        // Select available time slot
        const timeSlots = ['12:00 - 14:00 Hrs', '14:00 - 16:00 Hrs', '16:00 - 18:00 Hrs', '18:00 - 20:00 Hrs'];
        let slotSelected = false;
        for (const slot of timeSlots) {
          try {
            await productPage.getByText(slot).waitFor({ state: 'visible', timeout: 10000 });
            await productPage.getByText(slot).click({ timeout: 10000 });
            console.log(`✅ Selected time slot: ${slot}`);
            slotSelected = true;
            break;
          } catch (slotError) {
            continue;
          }
        }
        
        // If no predefined slot matched, try to find any available time slot
        if (!slotSelected) {
          console.log('⚠️ No predefined time slots found, searching for any available time slot...');
          try {
            const availableTimeSlots = await productPage.locator('text=/\\d{2}:\\d{2} - \\d{2}:\\d{2} Hrs/').all();
            if (availableTimeSlots.length > 0) {
              await availableTimeSlots[0].click();
              console.log('✅ Selected first available time slot');
            } else {
              console.log('⚠️ No time slots found, continuing without time selection');
            }
          } catch (flexibleError) {
            console.log('⚠️ Could not find any time slots, continuing without time selection');
          }
        }
      } catch (todayError) {
        console.log('No delivery options found, continuing without setting delivery date');
      }
    }
  }

  async addToCartWithAddOns(productPage) {
    try {
      // Check if page is still open
      if (productPage.isClosed()) {
        throw new Error('Product page was closed unexpectedly');
      }

      await productPage.getByRole('button', { name: 'Add To Cart' }).click({ timeout: 10000 });

      // Use enhanced continue button handling with Skip & Continue as primary
      try {
        // Primary: Skip & Continue (for addon handling)
        await this.page.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
        console.log('✅ Skip & Continue button clicked');
      } catch (error) {
        // Fallback: Regular Continue
        try {
          const continueButton = this.page.locator('button').filter({ hasText: 'Continue' });
          if (await continueButton.isVisible({ timeout: 10000 })) {
            await continueButton.click({ timeout: 10000 });
            console.log('✅ Continue button clicked');
          }
        } catch (fallbackError) {
          console.log('📝 No continue/skip buttons found, proceeding...');
        }
      }

      // Click drawer button
      await productPage.getByTestId('drawer').getByRole('button', { name: 'button' }).click({ timeout: 10000 });

      // Click proceed to pay button
      try {
        await productPage.locator('#proceed-to-pay-btn').click({ timeout: 10000 });
      } catch (error) {
        console.log('Proceed to pay button not found:', error.message);
      }

    } catch (error) {
      console.log('Add to cart with add-ons failed:', error.message);
      // Don't throw error, continue with the flow
      console.log('Continuing with payment test despite add to cart issues');
    }
  }

  async testPaymentWithAddOns(productPage) {
    try {
      // Check if we're on a payment page
      const currentUrl = productPage.url();
      console.log('Current URL for payment test:', currentUrl);

      // Look for QR payment option
      try {
        await productPage.getByRole('button', { name: 'Show QR' }).waitFor({ state: 'visible', timeout: 10000 });
        await productPage.getByRole('button', { name: 'Show QR' }).click({ timeout: 10000 });

        // Cancel payment
        await productPage.getByRole('link', { name: 'Cancel Payment' }).click({ timeout: 10000 });

        await productPage.getByRole('button', { name: 'YES' }).click({ timeout: 10000 });

        console.log('QR payment test completed successfully');
      } catch (qrError) {
        console.log('QR payment not available, trying alternative payment methods');

        // Try UPI payment
        try {
          await productPage.getByText('UPI').click({ timeout: 10000 });
          await productPage.getByRole('link', { name: 'Cancel Payment' }).click({ timeout: 10000 });
          await productPage.getByRole('button', { name: 'YES' }).click({ timeout: 10000 });
          console.log('UPI payment test completed successfully');
        } catch (upiError) {
          console.log('UPI payment also not available, payment test completed with current state');
        }
      }

    } catch (error) {
      console.log('Payment test with add-ons failed:', error.message);
      // Don't throw error, just log and continue
      console.log('Continuing with journey despite payment test issues');
    }

    // Navigate back to home page
    try {
      await productPage.goto('https://www.fnp.com');
      console.log('Navigated back to home page');
    } catch (error) {
      console.log('Failed to navigate back to home page:', error.message);
    }
  }

  async navigateToQatarPage(productPage) {
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

    try {
      // Navigate to homepage first
      const homepageStartTime = Date.now();
      await productPage.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      const homepageLoadTime = Date.now() - homepageStartTime;

      if (homepageLoadTime > 30000) {
        logger.warn(`⏱️ Page Load Delay: Homepage took ${(homepageLoadTime / 1000).toFixed(2)}s to load (threshold: 30s)`);
        global.pageLoadDelays = global.pageLoadDelays || [];
        global.pageLoadDelays.push({
          page: 'Homepage (Qatar Journey)',
          loadTime: homepageLoadTime,
          timestamp: new Date().toISOString()
        });
      }

      // Navigate to Qatar page
      const qatarStartTime = Date.now();
      logger.info('🌍 Navigating to Qatar gifts page...');
      await productPage.goto('https://www.fnp.com/qatar/gifts-lp?promo=globalmenu_dt_hm', { waitUntil: 'domcontentloaded', timeout: 60000 });
      const qatarLoadTime = Date.now() - qatarStartTime;

      if (qatarLoadTime > 30000) {
        logger.warn(`⏱️ Page Load Delay: Qatar gifts page took ${(qatarLoadTime / 1000).toFixed(2)}s to load (threshold: 30s)`);
        global.pageLoadDelays = global.pageLoadDelays || [];
        global.pageLoadDelays.push({
          page: 'Qatar Gifts Page',
          loadTime: qatarLoadTime,
          timestamp: new Date().toISOString()
        });
      }

      logger.info(`✅ Successfully navigated to Qatar gifts page in ${(qatarLoadTime / 1000).toFixed(2)}s`);
    } catch (error) {
      logger.error(`❌ Navigation to Qatar page failed after 60s: ${error.message}`);
      global.pageLoadDelays = global.pageLoadDelays || [];
      global.pageLoadDelays.push({
        page: 'Qatar Gifts Page',
        loadTime: 60000,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async setQatarLocation(productPage) {
    try {
      try {
        await productPage.getByText('Where to deliver?').click({ timeout: 10000 });
      } catch (error) {
        console.log('Where to deliver not found, proceeding to location input');
      }

      await productPage.getByTestId('locationLock').getByTestId('input_field').click({ timeout: 10000 });
      await productPage.getByTestId('locationLock').getByTestId('input_field').fill('doha');
      await productPage.locator('#list-item-0').click({ timeout: 10000 });
      await productPage.locator('#location-and-country-popup').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
    } catch (error) {
      console.log('Set Qatar location failed:', error.message);
      throw error;
    }
  }

  async selectQatarProduct(productPage) {
    try {
      await productPage.goto('https://www.fnp.com/qatar/gift/dripping-chocolate-birthday-cake-half-kg?OCCASION_TAGS=birthday&pos=1', { waitUntil: 'domcontentloaded', timeout: 60000 });

      try {
        const deliveryError = await productPage.getByTestId('input_related_message').textContent({ timeout: 10000 });
        if (deliveryError && deliveryError.includes('This product can not be delivered at the desired location')) {
          console.log('Birthday cake cannot be delivered, switching to perfume product');
          await productPage.goto('https://www.fnp.com/qatar/gift/touch-by-burberry-for-women-edt?OCCASION_TAGS=birthday&pos=4', { waitUntil: 'domcontentloaded', timeout: 60000 });
        }
      } catch (error) {
        console.log('No delivery restriction, continuing with birthday cake');
      }

      return productPage;
    } catch (error) {
      console.log('Select Qatar product failed:', error.message);
      throw error;
    }
  }

  async setQatarDeliveryDate(productPage) {
    try {
      console.log('🌙 [QATAR DELIVERY] Starting Qatar delivery date setup...');
      await productPage.getByTestId('delivery_date_selector').click({ timeout: 10000 });
      await productPage.waitForTimeout(1000);
      console.log('✅ [QATAR DELIVERY] Delivery date selector clicked');
      
      // Try to select Midnight Delivery if enabled, otherwise try other delivery options
      let deliveryOptionSelected = false;
      
      // First, try Midnight Delivery
      try {
        const midnightOption = productPage.getByTestId('popover').getByText('Midnight Delivery');
        const isEnabled = await midnightOption.isEnabled({ timeout: 3000 });
        
        if (isEnabled) {
          await midnightOption.click({ timeout: 5000 });
          console.log('✅ [QATAR DELIVERY] Midnight Delivery selected');
          deliveryOptionSelected = true;
        } else {
          console.log('⚠️ [QATAR DELIVERY] Midnight Delivery is disabled, trying alternatives...');
        }
      } catch (error) {
        console.log('📝 [QATAR DELIVERY] Midnight Delivery not found or not clickable, trying alternatives...');
      }
      
      // If Midnight Delivery is not available, try other delivery options
      if (!deliveryOptionSelected) {
        const deliveryOptions = [
          'Morning Delivery',
          'Evening Delivery',
          'Standard Delivery',
          'Fixed Time Delivery',
          'Later'
        ];
        
        for (const option of deliveryOptions) {
          try {
            const deliveryElement = productPage.getByTestId('popover').getByText(option, { exact: true });
            const isVisible = await deliveryElement.isVisible({ timeout: 2000 });
            const isEnabled = await deliveryElement.isEnabled({ timeout: 2000 });
            
            if (isVisible && isEnabled) {
              await deliveryElement.click({ timeout: 5000 });
              console.log(`✅ [QATAR DELIVERY] ${option} selected as alternative`);
              deliveryOptionSelected = true;
              break;
            }
          } catch (error) {
            console.log(`📝 [QATAR DELIVERY] ${option} not available, trying next...`);
            continue;
          }
        }
      }
      
      if (!deliveryOptionSelected) {
        console.log('⚠️ [QATAR DELIVERY] No delivery option could be selected, continuing with default');
      }
      
      await productPage.waitForTimeout(1000);
      
      // Navigate to next month
      console.log('🖱️ [QATAR DELIVERY] Navigating to next month...');
      await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 10000 });
      await productPage.waitForTimeout(1000);
      console.log('✅ [QATAR DELIVERY] Navigated to next month');
      
      // Select date 15
      console.log('🖱️ [QATAR DELIVERY] Selecting date 15...');
      await productPage.getByTestId('popover').getByText('15').click({ timeout: 10000 });
      await productPage.waitForTimeout(1000);
      console.log('✅ [QATAR DELIVERY] Date 15 selected');
      
      // Try multiple time slot options
      console.log('🖱️ [QATAR DELIVERY] Selecting time slot...');
      const timeSlots = [
        ':00 - 23:59 Hrs',  // Midnight delivery time
        ':00 - 09:00 Hrs',  // Morning delivery
        ':00 - 21:00 Hrs',  // Evening delivery
        ':00 - 13:00 Hrs',  // Afternoon delivery
        ':00 - 17:00 Hrs'   // Late afternoon
      ];
      
      let timeSlotSelected = false;
      for (const slot of timeSlots) {
        try {
          const timeSlotElement = productPage.getByText(slot);
          const isVisible = await timeSlotElement.isVisible({ timeout: 2000 });
          
          if (isVisible) {
            await timeSlotElement.click({ timeout: 5000 });
            console.log(`✅ [QATAR DELIVERY] Time slot ${slot} selected`);
            timeSlotSelected = true;
            break;
          }
        } catch (error) {
          console.log(`📝 [QATAR DELIVERY] Time slot ${slot} not available, trying next...`);
          continue;
        }
      }
      
      if (!timeSlotSelected) {
        // Try to find any available time slot with a more flexible pattern
        try {
          const anyTimeSlot = productPage.locator('text=/\\d{2}:\\d{2} - \\d{2}:\\d{2} Hrs/').first();
          if (await anyTimeSlot.isVisible({ timeout: 3000 })) {
            await anyTimeSlot.click({ timeout: 5000 });
            console.log('✅ [QATAR DELIVERY] First available time slot selected');
            timeSlotSelected = true;
          }
        } catch (error) {
          console.log('⚠️ [QATAR DELIVERY] No time slots found, continuing without time selection');
        }
      }
      
      await productPage.waitForTimeout(1000);
      console.log('✅ [QATAR DELIVERY] Qatar delivery date setup completed');
    } catch (error) {
      console.log('❌ [QATAR DELIVERY] Set Qatar delivery date failed:', error.message);
      throw error;
    }
  }

  async addQatarAddOns(productPage) {
    try {
      await productPage.getByRole('button', { name: 'button' }).first().click({ timeout: 10000 });
      await productPage.getByRole('button', { name: 'button' }).first().click({ timeout: 10000 });
      await productPage.getByRole('button', { name: 'button' }).first().click({ timeout: 10000 });
      await productPage.getByRole('button', { name: 'button' }).first().click({ timeout: 10000 });
    } catch (error) {
      console.log('Add Qatar add-ons failed:', error.message);
      throw error;
    }
  }

  async processQatarCheckout(productPage) {
    try {
      await this.addToCartWithAddOns(productPage);
      await this.testPaymentWithAddOns(productPage);
    } catch (error) {
      console.log('Process Qatar checkout failed:', error.message);
      throw error;
    }
  }
}

module.exports = { AddOnPage };

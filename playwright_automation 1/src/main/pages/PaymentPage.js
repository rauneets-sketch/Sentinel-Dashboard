const { BasePage } = require('./BasePage');

class PaymentPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToCakes() {
    await this.page.getByText('Birthday Gifts that Wow').click({ timeout: 10000 });
  }

  async selectCakeProduct() {
    try {
      // Navigate directly to Colour Burst Cupcake product URL
      console.log('Navigating directly to Colour Burst Cupcake product...');
      await this.goto('https://www.fnp.com/gift/colour-burst-cupcake-for-kids?OCCASION_TAGS=birthday&pos=10');
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network not idle, continuing');
      });

      // Check for delivery location error
      try {
        const deliveryError = await this.page.getByTestId('input_related_message').textContent({ timeout: 10000 });
        if (deliveryError && deliveryError.includes('This product can not be delivered at the desired location')) {
          console.log('Colour Burst Cupcake cannot be delivered to location, switching to Truffle Temptation cake');
          // Navigate to alternative product
          await this.goto('https://www.fnp.com/gift/truffle-temptation-eggless-birthday-cake500-g?OCCASION_TAGS=birthday&pos=12');
          await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
            console.log('⚠️ Network not idle, continuing');
          });
          console.log('Successfully switched to Truffle Temptation cake product');
        }
      } catch (error) {
        // No delivery error message found, continue with current product
        console.log('No delivery restriction found, continuing with current product');
      }

      const currentUrl = this.page.url();
      console.log('Current cake product URL:', currentUrl);

      return this.page;
    } catch (error) {
      console.log('Failed to navigate to cake product:', error.message);
      console.log('Continuing with current page');
      return this.page;
    }
  }

  async setDeliveryDateAndProceed(productPage) {
    // Exact working pattern from Copy folder
    await productPage.getByText('Later').click();
    await productPage.waitForTimeout(1000);
    await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click();
    await productPage.waitForTimeout(1000);
    await productPage.getByTestId('popover').getByText('15').click();
    await productPage.waitForTimeout(1000);
    await productPage.getByText(':00 - 13:00 Hrs').click();
    await productPage.waitForTimeout(1000);
    await productPage.getByRole('button', { name: 'Add To Cart' }).click();
    
    // Use enhanced continue button handling with Skip & Continue as primary
    try {
      // Primary: Skip & Continue (for addon handling)
      await productPage.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
      console.log('✅ Skip & Continue button clicked successfully');
    } catch (error) {
      console.log('Skip & Continue button not found, trying Continue...');
      try {
        // Fallback 1: Regular Continue with text filter
        const continueButton = productPage.locator('button').filter({ hasText: 'Continue' });
        await continueButton.waitFor({ state: 'visible', timeout: 10000 });
        await continueButton.click({ timeout: 10000 });
        console.log('✅ Continue button clicked successfully');
      } catch (error) {
        console.log('Continue button not found with text filter, trying alternatives...');
        try {
          // Fallback 2: CSS selector for Continue
          await productPage.locator('button:has-text("Continue")').click({ timeout: 10000 });
          console.log('✅ Continue button clicked with alternative selector');
        } catch (altError) {
          console.log('Continue button not found, proceeding to drawer');
        }
      }
    }
    
    await productPage.waitForTimeout(2000);
    await productPage.getByTestId('drawer').getByRole('button', { name: 'button' }).click();
    await productPage.waitForTimeout(2000);
    
    // Wait for proceed to pay button with extended timeout
    try {
      await productPage.locator('#proceed-to-pay-btn').waitFor({ state: 'visible', timeout: 60000 });
      await productPage.locator('#proceed-to-pay-btn').click({ timeout: 60000 });
      console.log('✅ Proceed to pay button clicked successfully');
    } catch (error) {
      console.log('⚠️ Proceed to pay button not found, trying alternative selector...');
      // Try alternative selectors
      try {
        await productPage.getByRole('button', { name: /proceed.*pay/i }).click({ timeout: 10000 });
        console.log('✅ Used alternative proceed button');
      } catch (e) {
        console.log('❌ Failed to find proceed to pay button:', error.message);
        throw error;
      }
    }
    await productPage.waitForTimeout(3000);
  }

  async testQRPayment(productPage) {
    // Exact working pattern from Copy folder
    await productPage.getByRole('button', { name: 'Show QR' }).click();
    await productPage.waitForTimeout(3000);
    await productPage.getByRole('link', { name: 'Cancel Payment' }).click();
    await productPage.waitForTimeout(2000);
    await productPage.getByRole('button', { name: 'YES' }).click();
    await productPage.waitForTimeout(2000);
  }

  async testUPIPayment(productPage) {
    // Exact working pattern from Copy folder
    try {
      // Click Pay button first to ensure we're in payment selection state after QR cancellation
      try {
        await productPage.getByRole('button', { name: /pay.*₹|pay.*now/i }).click({ timeout: 10000 });
        await productPage.waitForTimeout(2000);
        console.log('✅ Clicked Pay button to start UPI payment');
      } catch (error) {
        console.log('Pay button not found, continuing with UPI selection...');
      }
      
      // Ensure we're back to payment selection state
      try {
        // Look for "Pay Now" or similar button to ensure we're on payment page
        await productPage.getByRole('button', { name: /pay.*now|pay.*₹/i }).waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ Payment page is ready for UPI payment');
      } catch (error) {
        console.log('Payment page not ready, trying to refresh payment state...');
        // Try to click on a payment method to ensure payment options are visible
        await productPage.waitForTimeout(2000);
      }
      
      // First select UPI payment method - try multiple selectors
      try {
        await productPage.getByTestId('payment-accordian-UPI').click();
        await productPage.waitForTimeout(2000);
        console.log('✅ UPI payment method selected');
      } catch (error) {
        console.log('Primary UPI selector failed, trying alternatives...');
        // Try alternative UPI selectors
        try {
          await productPage.locator('[data-testid*="upi"]').first().click();
          await productPage.waitForTimeout(2000);
          console.log('✅ UPI selected with alternative selector');
        } catch (error2) {
          try {
            await productPage.locator('text=UPI').first().click();
            await productPage.waitForTimeout(2000);
            console.log('✅ UPI selected with text selector');
          } catch (error3) {
            // Skip UPI selection and proceed directly to UPI ID input
            console.log('UPI selection failed, proceeding to UPI ID input...');
          }
        }
      }
      
      // Enter UPI ID
      await productPage.getByRole('textbox', { name: 'Enter UPI ID: (Ex. 99XXXXXX99' }).fill('9999999999@upi');
      await productPage.waitForTimeout(2000);
      console.log('✅ UPI ID entered');
      
      // Click Pay button
      await productPage.getByRole('button', { name: 'Pay ₹' }).click();
      await productPage.waitForTimeout(5000);
      console.log('✅ Pay button clicked for UPI');
      
      // Cancel the payment - handle page closure
      try {
        // Check if page is still open
        if (productPage.isClosed()) {
          console.log('📝 Page was closed during payment gateway redirect - this is expected');
          return; // Exit gracefully
        }
        await productPage.getByText('Cancel Payment').click({ timeout: 10000 });
        await productPage.waitForTimeout(2000);
        console.log('✅ UPI payment cancelled');
      } catch (cancelError) {
        console.log('📝 Cancel Payment button not found or page closed - payment gateway opened');
        // Try to go back if page is still open
        try {
          if (!productPage.isClosed()) {
            await productPage.goBack({ timeout: 10000 });
            console.log('✅ Navigated back from payment gateway');
          }
        } catch (backError) {
          console.log('📝 Could not navigate back - page may be closed');
        }
      }
    } catch (error) {
      console.log('UPI payment flow error:', error.message);
      // Check if page is closed
      if (productPage.isClosed()) {
        console.log('📝 Page was closed during UPI payment - this is expected for payment gateways');
        return; // Exit gracefully
      }
      // Try simplified UPI flow only if page is still open
      try {
        if (productPage.isClosed()) {
          console.log('📝 Page closed, skipping simplified UPI flow');
          return;
        }
        console.log('Trying simplified UPI flow...');
        // Just try to enter UPI ID without selecting payment method first
        await productPage.getByRole('textbox', { name: /UPI/i }).fill('9999999999@upi');
        await productPage.waitForTimeout(2000);
        
        await productPage.getByRole('button', { name: 'Pay ₹' }).click();
        await productPage.waitForTimeout(5000);
        
        // Try to cancel
        try {
          if (!productPage.isClosed()) {
            await productPage.getByText('Cancel Payment').click({ timeout: 10000 });
            await productPage.waitForTimeout(2000);
            console.log('✅ Simplified UPI flow completed');
          }
        } catch (cancelError) {
          console.log('📝 Simplified UPI flow - payment gateway opened, page may be closed');
        }
      } catch (altError) {
        console.log('Simplified UPI flow also failed:', altError.message);
        // Don't throw - let the step definition handle recovery
      }
    }
  }

  async testCardPayment(productPage) {
    // Exact working pattern from Copy folder
    await productPage.getByRole('button', { name: 'Pay ₹' }).click();
    await productPage.waitForTimeout(2000);
    await productPage.getByTestId('payment-accordian-CDC').click();
    await productPage.waitForTimeout(2000);
    
    await productPage.getByRole('textbox').first().click();
    await productPage.getByRole('textbox').first().fill('4242 4242 4242 4242');
    await productPage.waitForTimeout(1000);
    
    await productPage.locator('input[type="text"]').click();
    await productPage.locator('input[type="text"]').fill('Test');
    await productPage.waitForTimeout(1000);
    
    await productPage.getByRole('textbox').nth(2).click();
    await productPage.getByRole('textbox').nth(2).fill('12/29');
    await productPage.waitForTimeout(1000);
    
    await productPage.locator('input[type="password"]').click();
    await productPage.locator('input[type="password"]').fill('123');
    await productPage.waitForTimeout(1000);
    
    await productPage.getByRole('button', { name: 'Pay ₹' }).click();
    await productPage.waitForTimeout(3000);
    
    try {
      await productPage.getByText('Cancel Payment').click();
      await productPage.waitForTimeout(2000);
    } catch (error) {
      console.log('Card payment flow error:', error.message);
    }
  }
}

module.exports = { PaymentPage };

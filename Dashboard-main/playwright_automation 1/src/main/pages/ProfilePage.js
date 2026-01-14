const { BasePage } = require('./BasePage');

class ProfilePage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToProfile() {
    await this.goto('https://www.fnp.com/account/my-account');
    await this.page.getByRole('heading', { name: 'My Profile' }).click({ timeout: 10000 });
  }

  async changeInternationalPhoneNumber() {
    await this.page.getByRole('button', { name: '+' }).click({ timeout: 10000 });
    await this.page.getByRole('option', { name: '+' }).nth(1).click({ timeout: 10000 });
    await this.page.locator('#standard-id').click({ timeout: 10000 });
    await this.page.locator('#standard-id').fill('12356567878');
    await this.page.getByRole('button', { name: 'SAVE', exact: true }).click({ timeout: 10000 });
  }

  async navigateToHomepage() {
    await this.page.getByRole('link', { name: 'FNP-Logo' }).click({ timeout: 10000 });
  }

  async selectWeddingProduct() {
    await this.goto('https://www.fnp.com/gift/garden-of-eden?pos=1');
    return this.page;
  }

  async setDeliveryDateAndAddToCart(productPage) {
    try {
      // Check if page is closed
      if (productPage.isClosed()) {
        throw new Error('Product page was closed, cannot proceed');
      }

      // Check for delivery location error
      try {
        const deliveryError = await productPage.getByTestId('input_related_message').textContent({ timeout: 10000 });
        if (deliveryError && deliveryError.includes('This product can not be delivered at the desired location')) {
          console.log('Product cannot be delivered to location, switching to alternative product');
          // Navigate to alternative product
          await productPage.goto('https://www.fnp.com/gift/romantic-pink-rose-arrangement?pos=1', { waitUntil: 'domcontentloaded', timeout: 10000 });
        }
      } catch (error) {
        // No delivery error message found, continue with current product
        console.log('No delivery restriction found, continuing with current product');
      }

      // Set delivery date
      await productPage.getByText('Later').click({ timeout: 10000 });
      await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 10000 });
      await productPage.getByTestId('popover').getByText('15').click({ timeout: 10000 });
      await productPage.getByText(':00 - 09:00 Hrs').click({ timeout: 10000 });

      // Add to cart
      await productPage.getByRole('button', { name: 'Add To Cart' }).click({ timeout: 10000 });

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

      // Click drawer button
      try {
        await productPage.getByTestId('drawer').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
      } catch (error) {
        console.log('Drawer button not found, continuing');
      }

    } catch (error) {
      console.log('Wedding delivery date and add to cart failed:', error.message);
      throw error;
    }
  }

  async editSenderPhoneNumber(productPage) {
    await productPage.getByTestId('editBtn').click();
    await productPage.waitForTimeout(1000);
    await productPage.getByTestId('senderNumber').click();
    await productPage.waitForTimeout(1000);
    await productPage.getByRole('button', { name: '+1 USA' }).click();
    await productPage.waitForTimeout(500);
    await productPage.getByText('+1 CAN').click();
    await productPage.waitForTimeout(500);
    await productPage.getByRole('textbox', { name: 'Enter Mobile Number' }).click();
    await productPage.waitForTimeout(500);
    await productPage.getByRole('textbox', { name: 'Enter Mobile Number' }).fill('213456789056');
    await productPage.waitForTimeout(500);
    await productPage.getByRole('button', { name: 'Proceed' }).click();
    await productPage.waitForTimeout(1000);
    await productPage.getByTestId('saveBtn').click();
    await productPage.waitForTimeout(2000);
  }

  async proceedToPaymentAndCancel(productPage) {
    await productPage.locator('#proceed-to-pay-btn').click();
    await productPage.waitForTimeout(2000);
    await productPage.getByRole('button', { name: 'Show QR' }).click();
    await productPage.waitForTimeout(2000);
    await productPage.getByRole('link', { name: 'Cancel Payment' }).click();
    await productPage.waitForTimeout(1000);
    await productPage.getByRole('button', { name: 'YES' }).click();
    await productPage.waitForTimeout(2000);
    
    // Navigate back to homepage at the end of Journey 3
    await productPage.goto('https://www.fnp.com/');
    await productPage.waitForTimeout(2000);
  }
}

module.exports = { ProfilePage };

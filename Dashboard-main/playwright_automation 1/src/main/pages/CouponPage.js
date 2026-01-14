const { BasePage } = require('./BasePage');
const { expect } = require('@playwright/test');

class CouponPage extends BasePage {
  constructor(page) {
    super(page);
    this.productUrl = 'https://www.fnp.com/gift/chocolate-truffle-cream-cake-half-kg-eggless';
  }

  async setDeliveryDateForCoupon(productPage) {
    try {
      await productPage.getByText('Later').click({ timeout: 10000 });
      await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 10000 });
      await productPage.getByTestId('popover').getByText('15').click({ timeout: 10000 });
      await productPage.getByText(':00 - 09:00 Hrs').click({ timeout: 10000 });
    } catch (error) {
      console.log('Delivery date setting failed:', error.message);
    }
  }

  async navigateToProduct() {
    try {
      console.log('Journey 10: Navigating to product for coupon testing...');
      await this.navigateTo(this.productUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network not idle, continuing');
      });
      return this.page;
    } catch (error) {
      console.log('Failed to navigate to product:', error.message);
      return this.page;
    }
  }

  async addProductToCart() {
    try {
      await this.page.getByRole('button', { name: 'Add To Cart' }).click({ timeout: 10000 });
      try {
        await expect(this.page.getByTestId('toast')).toContainText('Please Select Delivery Date', { timeout: 10000 });
        console.log('⚠️ Delivery date required, setting date and time...');
        await this.setDeliveryDateForCoupon(this.page);
        await this.page.getByRole('button', { name: 'Add To Cart' }).click({ timeout: 10000 });
      } catch (error) {
        console.log('No delivery date message, proceeding');
      }
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
      await this.page.getByTestId('drawer').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
    } catch (error) {
      console.log('Add to cart failed:', error.message);
    }
  }

  async applyCoupon(couponCode) {
    await this.page.getByRole('button', { name: 'Have a Discount Coupon?' }).click({ timeout: 10000 });
    await this.page.getByRole('textbox', { name: 'Enter coupon code' }).fill(couponCode);
    await this.page.getByRole('button', { name: 'Apply' }).click({ timeout: 10000 });
  }

  async testInvalidCoupon() {
    try {
      await this.applyCoupon('INVALID10');
      await expect(this.page.getByTestId('external-coupon')).toContainText('The coupon code is not valid. Please try another code');
      console.log('✅ Invalid coupon validation successful: Error message displayed correctly');
      await super.proceedToPayment();
      const { PaymentPage } = require('./PaymentPage');
      const paymentPage = new PaymentPage(this.page);
      await paymentPage.testQRPayment(this.page);
    } catch (error) {
      console.log('Invalid coupon test failed:', error.message);
    }
  }

  async navigateAndAddToCart() {
    await this.navigateToProduct();
    await this.addProductToCart();
  }

  async testValidCoupon() {
    try {
      await this.applyCoupon('GIFT10');
      await expect(this.page.getByTestId('external-coupon')).toContainText('Coupon code applied');
      console.log('✅ Valid coupon test completed successfully');
    } catch (error) {
      console.log('Valid coupon test failed:', error.message);
    }
  }

  async testPaymentFlow() {
    try {
      const { PaymentPage } = require('./PaymentPage');
      const paymentPage = new PaymentPage(this.page);
      await paymentPage.testQRPayment(this.page);
      console.log('✅ Payment flow with coupon tested successfully');
    } catch (error) {
      console.log('Payment flow test failed:', error.message);
    }
  }

  async navigateBackToHome() {
    await this.navigateTo('https://www.fnp.com/', { waitUntil: 'domcontentloaded' });
    console.log('✅ Navigated back to home page after Journey 10');
  }
}

module.exports = CouponPage;

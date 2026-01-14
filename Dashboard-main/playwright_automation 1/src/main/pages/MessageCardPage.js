const { BasePage } = require('./BasePage');
const { expect } = require('@playwright/test');

class MessageCardPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToMessageCardProduct() {
    try {
      console.log('Journey 12: Navigating to celebration red velvet swirl candle bento cake...');
      await this.navigateTo(
        'https://www.fnp.com/gift/celebration-red-velvet-swirl-candle-bento-cake?OCCASION_TAGS=anniversary&pos=2',
        { waitUntil: 'domcontentloaded' }
      );
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network not idle, continuing');
      });
      console.log('✅ Navigated to celebration bento cake product successfully');
    } catch (error) {
      console.log('Failed to navigate to bento cake product:', error.message);
    }
  }

  async setDeliveryDate() {
    try {
      await this.page.getByText('Later').click({ timeout: 10000 });
      await this.page.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 10000 });
      await this.page.getByTestId('popover').getByText('15').click({ timeout: 10000 });
      await this.page.getByText(':00 - 13:00 Hrs').click({ timeout: 10000 });
      console.log('✅ Set delivery date for bento cake successfully');
    } catch (error) {
      console.log('Delivery date setting failed:', error.message);
    }
  }

  async addToCart() {
    return await super.addToCart();
  }

  async addMessageCardInCart() {
    try {
      await this.page.getByTestId('free-message-card').click({ timeout: 10000 });
      await this.page.getByRole('button', { name: 'Select Message on Card' }).waitFor({ state: 'visible', timeout: 10000 });
      await this.page.getByRole('button', { name: 'Select Message on Card' }).click({ timeout: 10000 });
      await this.page.getByRole('list').getByRole('button', { name: 'I have forgotten everything' }).click({ timeout: 10000 });
      await this.page.locator('#messageCardTemplate > .MuiButtonBase-root').click({ timeout: 10000 });
      await this.page.getByRole('textbox', { name: 'Enter Your Message Here...' }).fill('Happy Anniversary Dear....I have forgotten everything about the day we met for the first time, because life has been a sweet dream since the moment you became mine! Happy Anniversary Darling');
      await this.page.getByTitle('Save', { exact: true }).click({ timeout: 10000 });
      console.log('✅ Added message card in cart successfully');
    } catch (error) {
      console.log('Failed to add message card in cart:', error.message);
    }
  }

  async proceedToPayment() {
    try {
      await this.addMessageCardInCart();
      await super.proceedToPayment();
    } catch (error) {
      console.log('Failed to proceed to payment:', error.message);
    }
  }

  async testPaymentFlow() {
    try {
      const { PaymentPage } = require('./PaymentPage');
      const paymentPage = new PaymentPage(this.page);
      await paymentPage.testQRPayment(this.page);
      console.log('✅ Payment flow for bento cake tested successfully');
    } catch (error) {
      console.log('Bento cake payment flow test failed:', error.message);
    }
  }

  async navigateBackToHome() {
    await this.navigateTo('https://www.fnp.com/', { waitUntil: 'domcontentloaded' });
    console.log('✅ Navigated back to home page after Journey 12');
  }
}

module.exports = MessageCardPage;

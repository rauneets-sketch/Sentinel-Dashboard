const { BasePage } = require('./BasePage');

class HomePage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToHomePage() {
    await this.goto('https://www.fnp.com/');
    await this.page.waitForTimeout(2000);
  }

  async dismissNotificationPopup() {
    try {
      await this.page.locator('#wiz-iframe').contentFrame().getByRole('link', { name: '×' }).click({ timeout: 1500 });
      console.log('Iframe popup closed');
      return;
    } catch (error) {
      console.log('Iframe popup not found');
    }

    try {
      await this.page.getByRole('button', { name: 'No, Thanks' }).click({ timeout: 1500 });
      console.log('No Thanks button clicked');
      return;
    } catch (error) {
      console.log('No Thanks button not found');
    }

    console.log('No popups found, continuing');
  }

  async completeLogin(email = 'testcases0111@gmail.com') {
    await this.page.getByRole('button', { name: 'Hi Guest' }).click({ timeout: 10000 });
    await this.page.getByText('Login/Register').click({ timeout: 10000 });
    await this.page.getByTestId('drawer').getByTestId('input_field').click({ timeout: 10000 });
    await this.page.getByTestId('drawer').getByTestId('input_field').fill(email);
    await this.page.locator('button').filter({ hasText: 'Continue' }).waitFor({ state: 'visible', timeout: 60000 });
    await this.page.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 10000 });
    await this.page.getByRole('textbox', { name: 'Please enter verification' }).fill('1');
    await this.page.getByRole('textbox', { name: 'Digit 2' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Digit 3' }).fill('3');
    await this.page.getByRole('textbox', { name: 'Digit 4' }).fill('4');
    await this.page.locator('button').filter({ hasText: 'Confirm OTP' }).click({ timeout: 10000 });
  }

  async clearCart() {
    try {
      await this.page.getByRole('button', { name: 'Cart' }).click({ timeout: 10000 });

      // Remove all products from cart
      while (true) {
        try {
          await this.page.getByRole('img', { name: 'trash-icon' }).first().click({ timeout: 10000 });
          await this.page.getByTestId('yes-remove').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
        } catch (error) {
          // No more items to remove
          break;
        }
      }

      await this.page.getByTestId('close-button').click({ timeout: 10000 });
    } catch (error) {
      console.log('Cart clearing failed or cart was empty:', error.message);
    }
  }

  async setDeliveryLocation() {
    try {
      // Wait for page to be ready after cart operations

      // Check if delivery location element exists
      const deliveryElement = await this.page.getByText('Where to deliver?').first();
      await deliveryElement.waitFor({ state: 'visible', timeout: 10000 });
      await deliveryElement.click({ timeout: 10000 });

      // Try to select saved address
      try {
        await this.page.getByText('Tower B, Apartment 301, Green Valley, Cyber City, Delhi, bangalore,').click({ timeout: 10000 });
        console.log('Delivery location set successfully');
      } catch (error) {
        console.log('Saved address not found, continuing without setting location');
      }

    } catch (error) {
      console.log('Delivery location setup failed:', error.message);
    }
  }
  async exploreOffersAndQuickSearch() {
    await this.page.getByText('Gift Finder').click({ timeout: 10000 });
    await this.page.getByRole('img', { name: 'Occasion' }).click({ timeout: 10000 });
    await this.page.locator('#birthday').click({ timeout: 10000 });
    await this.page.locator('#all-gifts').click({ timeout: 10000 });
    await this.page.locator('button').filter({ hasText: 'View Gifts' }).click({ timeout: 10000 });

    // Click Love For Pastel Carnations after View Gifts
    await this.clickLoveForPastelCarnations();

    try {
      await this.page.locator('#wiz-iframe').contentFrame().getByRole('link', { name: '×' }).click({ timeout: 10000 });
    } catch (error) {
      console.log('No popup to close');
    }

    await this.page.getByRole('link', { name: 'Ferns N Petals' }).click({ timeout: 10000 });
  }

  async clickLoveForPastelCarnations() {
    try {
      const page1Promise = this.page.waitForEvent('popup');
      await this.page.getByRole('link', { name: 'Love For Pastel Carnations' }).click({ timeout: 10000 });
      const page1 = await page1Promise;
      await page1.getByText('Later').click({ timeout: 10000 });
      await page1.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click({ timeout: 10000 });
      await page1.getByTestId('popover').getByText('15').click({ timeout: 10000 });
      await page1.getByText(':00 - 09:00 Hrs').click({ timeout: 10000 });
      await page1.getByRole('button', { name: 'Add To Cart' }).click({ timeout: 10000 });
      
      // Use enhanced continue button handling with Skip & Continue as primary
      try {
        // Primary: Skip & Continue (for addon handling)
        await page1.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
        console.log('✅ Skip & Continue button clicked');
      } catch (error) {
        // Fallback: Regular Continue
        try {
          await page1.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 10000 });
          console.log('✅ Continue button clicked');
        } catch (fallbackError) {
          console.log('📝 No continue/skip buttons found, proceeding to drawer');
        }
      }
      await page1.getByTestId('drawer').getByRole('button', { name: 'button' }).click({ timeout: 10000 });
      await page1.locator('#proceed-to-pay-btn').click({ timeout: 10000 });
      await page1.getByRole('button', { name: 'Show QR' }).click({ timeout: 10000 });
      await page1.getByRole('link', { name: 'Cancel Payment' }).click({ timeout: 10000 });
      await page1.getByRole('button', { name: 'YES' }).click({ timeout: 10000 });
      await page1.close();
    } catch (error) {
      console.log('Love For Pastel Carnations flow failed:', error.message);
    }
  }
}

module.exports = { HomePage };

const { BasePage } = require('./BasePage');

class InternationalPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToInternational() {
    await this.goto('https://www.fnp.com/');
    await this.goto('https://www.fnp.com/uae/gifts-lp');
  }

  async selectBirthdayCategory() {
    await this.page.locator('#microSiteContent').getByRole('link', { name: 'Birthday', exact: true }).click();
  }

  async setDeliveryLocation() {
    await this.page.getByText('Where to deliver?').click();
    await this.page.getByTestId('locationLock').getByTestId('input_field').click();
    await this.page.getByTestId('locationLock').getByTestId('input_field').fill('ab');
    await this.page.getByTestId('list-dropdown').getByText('Abu Dhabi').click();
    await this.page.locator('#location-and-country-popup').getByRole('button', { name: 'button' }).click();
  }

  async selectProduct() {
    // Override target attribute to prevent new tab
    await this.page.evaluate(() => {
      const links = document.querySelectorAll('a[target="_blank"]');
      links.forEach(link => link.removeAttribute('target'));
    });

    await this.page.getByRole('link', { name: 'Majestic Roses 1 2 3 4 5' }).click();
    return this.page;
  }

  async setDeliveryDateAndExplore(productPage) {
    // Wait for delivery selector to be ready (may be disabled initially)
    await productPage.getByTestId('delivery_date_selector').waitFor({ state: 'attached' });
    await productPage.getByTestId('delivery_date_selector').click();
    await productPage.getByText('Standard DeliveryEarliest').click();
    await productPage.getByRole('img', { name: 'arrow-right' }).click();
    await productPage.getByTestId('popover').getByText('15').click();
    await productPage.getByText(':00 - 21:00 Hrs').click();

    // Explore product details
    await productPage.locator('button').filter({ hasText: 'Description' }).click();
    await productPage.locator('button').filter({ hasText: 'Instructions' }).click();
    await productPage.locator('button').filter({ hasText: 'Delivery Info' }).click();
  }

  async addToCartAndProceed(productPage) {
    await productPage.getByRole('button', { name: 'Add To Cart' }).click();
    await productPage.waitForTimeout(1000);
    
    // Use enhanced continue button handling
    try {
      await productPage.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });
      console.log('✅ Skip & Continue button clicked');
    } catch (error) {
      try {
        await productPage.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 5000 });
        console.log('✅ Continue button clicked');
      } catch (fallbackError) {
        console.log('📝 No continue/skip buttons found, proceeding to drawer');
      }
    }
    await productPage.getByTestId('drawer').getByRole('button', { name: 'button' }).click();
  }

  async testPayment(productPage) {
    await productPage.locator('#proceed-to-pay-btn').click();
    await productPage.getByRole('button', { name: 'Show QR' }).click();
    await productPage.getByRole('link', { name: 'Cancel Payment' }).click();
    await productPage.getByRole('button', { name: 'YES' }).click();

    // Navigate back to home page using BasePage method
    await this.goto('https://www.fnp.com');
  }

  async returnToHomepage(productPage) {
    try {
      await this.goto('https://www.fnp.com/');
    } catch (error) {
      console.log('Failed to return to homepage:', error.message);
    }
  }
}

module.exports = { InternationalPage };

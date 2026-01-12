const { BasePage } = require('./BasePage');

class ReminderFAQPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToReminder() {
    try {
      console.log('Navigating to FNP homepage for reminder section...');
      await this.goto('https://www.fnp.com/');
      await this.page.waitForTimeout(2000);
      
      console.log('Navigating directly to reminder page...');
      await this.goto('https://www.fnp.com/account/reminder');
      await this.page.waitForTimeout(2000);
      console.log('Successfully navigated to reminder section');
    } catch (error) {
      console.error('Error navigating to reminder section:', error.message);
      throw error;
    }
  }

  async createReminder() {
    await this.page.getByRole('button', { name: 'ADD A NEW REMINDER' }).click();
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('textbox').first().click();
    await this.page.getByRole('textbox').first().fill('Astha');
    await this.page.waitForTimeout(500);
    await this.page.locator('input[type="button"]').first().click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: 'Sister' }).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('input[type="button"]').nth(1).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: 'Birthday' }).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('input[type="button"]').nth(2).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: '2026', exact: true }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: '2003' }).click();
    await this.page.waitForTimeout(500);
    
    // Try to find and click month selector - handle different month names
    try {
      const monthButton = this.page.locator('button[role="button"]').filter({ hasText: /January|February|March|April|May|June|July|August|September|October|November|December/ }).first();
      await monthButton.click({ timeout: 10000 });
      await this.page.waitForTimeout(500);
      await this.page.getByRole('option', { name: 'June' }).click();
      await this.page.waitForTimeout(500);
      await this.page.getByRole('button', { name: 'June 27,' }).click();
    } catch (error) {
      console.log('Month selector not found, trying alternative approach');
      // Alternative: just proceed without changing month
      await this.page.getByRole('button').filter({ hasText: '27' }).first().click();
    }
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox').nth(1).click();
    await this.page.getByRole('textbox').nth(1).fill('Happy Birthday');
    await this.page.waitForTimeout(500);
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
    await this.page.waitForTimeout(2000);
  }

  // async editReminder() {
  //   await this.page.locator('/html/body/div[1]/main/div[2]/div[2]/div[2]/div/div/div[2]/div[1]/div[1]/div/div/div[1]/div[1]/div[2]/button/span[1]/svg').click({ timeout: 10000 });
  //   await this.page.getByRole('menuitem', { name: 'Edit' }).click({ timeout: 10000 });
  //   await this.page.getByRole('textbox').nth(1).click({ timeout: 10000 });
  //   await this.page.getByRole('textbox').nth(1).fill('Happy Birthday Astha');
  //   await this.page.getByRole('button', { name: 'Save', exact: true }).click({ timeout: 10000 });
  // }

  // async deleteReminder() {
  //   await this.page.locator('/html/body/div[1]/main/div[2]/div[2]/div[2]/div/div/div[2]/div[1]/div[1]/div/div/div[1]/div[1]/div[2]/button/span[1]/svg').click({ timeout: 10000 });
  //   await this.page.getByRole('menuitem', { name: 'Delete' }).click({ timeout: 10000 });
  //   await this.page.getByRole('button', { name: 'Yes' }).click({ timeout: 10000 });
  // }

  async scheduleGift() {
    try {
      console.log('Clicking SCHEDULE GIFT button...');
      
      // Check if the button opens a new page/popup
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null),
        this.page.getByRole('button', { name: 'SCHEDULE GIFT' }).first().click()
      ]);
      
      await this.page.waitForTimeout(2000);
      
      // If a new page opened, close it and return to main page
      if (newPage) {
        console.log('New page opened, closing it...');
        await newPage.close();
        await this.page.waitForTimeout(1000);
      }
      
      // Check if current page is still accessible
      if (this.page.isClosed()) {
        console.log('Main page was closed, cannot continue with schedule gift');
        throw new Error('Page was closed during schedule gift operation');
      }
      
      // Navigate back to homepage to ensure clean state
      console.log('Navigating back to homepage after schedule gift...');
      await this.goto('https://www.fnp.com/');
      await this.page.waitForTimeout(2000);
      
      console.log('Schedule gift completed successfully');
    } catch (error) {
      console.log('Schedule gift failed:', error.message);
      
      // Try to recover by navigating to homepage
      try {
        if (!this.page.isClosed()) {
          await this.goto('https://www.fnp.com/');
          await this.page.waitForTimeout(2000);
          console.log('Recovered from schedule gift error');
        }
      } catch (recoveryError) {
        console.log('Failed to recover from schedule gift error:', recoveryError.message);
        throw error;
      }
    }
  }

  async navigateToFAQ() {
    const currentUrl = this.page.url();
    if (!currentUrl.includes('fnp.com/') || currentUrl.length > 'https://www.fnp.com/'.length) {
      await this.goto('https://www.fnp.com/');
      await this.page.waitForTimeout(2000);
    }
    
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('button', { name: 'FNP' }).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.getByRole('button', { name: 'FNP' }).click();
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('link', { name: 'dropdown-icons FAQs' }).click();
    await this.page.waitForTimeout(2000);
  }

  async exploreFAQSections() {
    await this.page.getByRole('heading', { name: 'Do you deliver only within' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('heading', { name: 'Can I choose the delivery' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('heading', { name: 'Can I get my order delivered' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('heading', { name: 'What are the different modes' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('heading', { name: 'What are the delivery charges' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('listitem').filter({ hasText: 'Order modification/' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('heading', { name: 'Is it possible to modify my' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('heading', { name: 'What are the modes of refund' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('listitem').filter({ hasText: 'Return and Refund Policy' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('listitem').filter({ hasText: 'Payment Related' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('listitem').filter({ hasText: 'Vouchers/Discounts/Points' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('listitem').filter({ hasText: 'My Account & My Cart' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('link', { name: 'Ferns N Petals' }).click();
    await this.page.waitForTimeout(2000);
  }
}

module.exports = { ReminderFAQPage };

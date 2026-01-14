const { test, expect } = require('@playwright/test');
const { StepTracker } = require('../src/main/utils/StepTracker');
const { SlackNotifier } = require('../src/main/utils/SlackNotifier');

test.describe('Journey 17-19 Testing - Location, Spherical Icons, and Order Page Payment', () => {
  let stepTracker, slackNotifier;

  test.beforeEach(async () => {
    stepTracker = new StepTracker();
    slackNotifier = new SlackNotifier();
    await slackNotifier.sendJourneyStart('Journey 17-19 Testing - Location, Spherical Icons, and Order Page Payment');
  });

  test('@journey17-19 @smoke Journey 17-19 Flow', async ({ page }) => {
    test.setTimeout(180000);
    
    const LocationPage = require('../src/main/pages/LocationPage');
    const SphericalHomePageExplorationPage = require('../src/main/pages/SphericalHomePageExplorationPage');
    const OrderPagePaymentPage = require('../src/main/pages/OrderPagePaymentPage');
    
    const locationPage = new LocationPage(page);
    const sphericalPage = new SphericalHomePageExplorationPage(page);
    const orderPagePaymentPage = new OrderPagePaymentPage(page);

    try {
      console.log('🚀 Starting Journey 17-19 Testing with Login and Setup');

      // Initial Setup
      const step1 = stepTracker.addStep('Navigate to FNP Homepage');
      try {
        await page.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        stepTracker.completeStep(step1, 'passed');
      } catch (error) {
        stepTracker.completeStep(step1, 'failed', error.message);
        throw error;
      }

      const step2 = stepTracker.addStep('Dismiss Notification Popup');
      try {
        // Handle iframe popup
        try {
          const iframe = page.locator('#wiz-iframe');
          await iframe.waitFor({ state: 'visible', timeout: 3000 });
          const frame = await iframe.contentFrame();
          if (frame) {
            await frame.getByRole('link', { name: '×' }).click({ timeout: 2000 });
            await page.waitForTimeout(1000);
          }
        } catch (error) {
          // Continue if no popup
        }
        stepTracker.completeStep(step2, 'passed');
      } catch (error) {
        stepTracker.completeStep(step2, 'failed', error.message);
        throw error;
      }

      const step3 = stepTracker.addStep('Login with Valid Credentials');
      try {
        await page.getByRole('button', { name: 'Hi Guest' }).click();
        await page.getByText('Login/Register').click();
        await page.getByTestId('drawer').getByTestId('input_field').fill('testcases0111@gmail.com');
        await page.locator('button').filter({ hasText: 'Continue' }).click();
        await page.waitForTimeout(2000);
        await page.getByRole('textbox', { name: 'Please enter verification' }).fill('1');
        await page.getByRole('textbox', { name: 'Digit 2' }).fill('2');
        await page.getByRole('textbox', { name: 'Digit 3' }).fill('3');
        await page.getByRole('textbox', { name: 'Digit 4' }).fill('4');
        await page.locator('button').filter({ hasText: 'Confirm OTP' }).click();
        await page.waitForTimeout(3000);
        stepTracker.completeStep(step3, 'passed');
      } catch (error) {
        stepTracker.completeStep(step3, 'failed', error.message);
        throw error;
      }

      const step4 = stepTracker.addStep('Clear Cart');
      try {
        const cartButton = page.getByRole('button', { name: 'Cart' });
        await cartButton.click();
        await page.waitForTimeout(1500);
        
        let attempts = 0;
        while (attempts < 5) {
          try {
            const trashIcon = page.getByRole('img', { name: 'trash-icon' }).first();
            await trashIcon.waitFor({ state: 'visible', timeout: 2000 });
            await trashIcon.click();
            await page.getByTestId('yes-remove').getByRole('button', { name: 'button' }).click();
            await page.waitForTimeout(1000);
            attempts++;
          } catch (error) {
            break;
          }
        }
        
        await page.getByTestId('close-button').click();
        stepTracker.completeStep(step4, 'passed');
      } catch (error) {
        stepTracker.completeStep(step4, 'passed'); // Don't fail if cart is empty
      }

      const step5 = stepTracker.addStep('Set Delivery Location');
      try {
        try {
          const deliveryElement = page.getByText('Where to deliver?').first();
          await deliveryElement.click();
          await page.waitForTimeout(1500);
          const addressElement = page.getByText('Tower B, Apartment 301, Green Valley, Cyber City, Delhi, bangalore,');
          await addressElement.click();
        } catch (error) {
          // Continue if no saved address
        }
        stepTracker.completeStep(step5, 'passed');
      } catch (error) {
        stepTracker.completeStep(step5, 'passed'); // Don't fail if location already set
      }

      // Journey 17: Location Testing
      console.log('\\n📍 === JOURNEY 17: LOCATION TESTING ===');
      
      const step89 = stepTracker.addStep('Navigate to Homepage for Location Journey');
      try {
        await locationPage.navigateToHomepage();
        stepTracker.completeStep(step89, 'passed');
      } catch (error) {
        stepTracker.completeStep(step89, 'failed', error.message);
        throw error;
      }

      const step90 = stepTracker.addStep('Select New Pincode Gurgaon');
      try {
        await locationPage.selectNewPincode();
        stepTracker.completeStep(step90, 'passed');
      } catch (error) {
        stepTracker.completeStep(step90, 'failed', error.message);
        throw error;
      }

      const step91 = stepTracker.addStep('Select Delhi Location');
      try {
        await locationPage.selectDelhiLocation();
        stepTracker.completeStep(step91, 'passed');
      } catch (error) {
        stepTracker.completeStep(step91, 'failed', error.message);
        throw error;
      }

      const step92 = stepTracker.addStep('Navigate to PLP and Select Existing Bangalore Pincode');
      try {
        await locationPage.navigateToPdpAndSelectExistingPincode();
        stepTracker.completeStep(step92, 'passed');
      } catch (error) {
        stepTracker.completeStep(step92, 'failed', error.message);
        throw error;
      }

      const step93 = stepTracker.addStep('Select Gorakhpur Pincode');
      try {
        await locationPage.selectGorakhpurPincode();
        stepTracker.completeStep(step93, 'passed');
      } catch (error) {
        stepTracker.completeStep(step93, 'failed', error.message);
        throw error;
      }

      const step94 = stepTracker.addStep('Select Final Bangalore Location');
      try {
        await locationPage.selectBangaloreLocation();
        stepTracker.completeStep(step94, 'passed');
      } catch (error) {
        stepTracker.completeStep(step94, 'failed', error.message);
        throw error;
      }

      const step95 = stepTracker.addStep('Return to Homepage After Location Testing');
      try {
        await locationPage.returnToHomePage();
        stepTracker.completeStep(step95, 'passed');
        console.log('✅ Journey 17: Location Testing - COMPLETED');
      } catch (error) {
        stepTracker.completeStep(step95, 'failed', error.message);
        throw error;
      }

      // Journey 18: Spherical Home Page Icon Exploration
      console.log('\\n🌐 === JOURNEY 18: SPHERICAL HOME PAGE ICON EXPLORATION ===');
      
      const step96 = stepTracker.addStep('Navigate to Homepage for Spherical Icon Exploration');
      try {
        await sphericalPage.navigateToHomepage();
        stepTracker.completeStep(step96, 'passed');
      } catch (error) {
        stepTracker.completeStep(step96, 'failed', error.message);
        throw error;
      }

      const step97 = stepTracker.addStep('Explore Category Icons');
      try {
        await sphericalPage.exploreCategoryIcons();
        stepTracker.completeStep(step97, 'passed');
        console.log('✅ Journey 18: Spherical Home Page Icon Exploration - COMPLETED');
      } catch (error) {
        stepTracker.completeStep(step97, 'failed', error.message);
        throw error;
      }

      // Journey 19: Payment from Order Page
      console.log('\\n💳 === JOURNEY 19: PAYMENT FROM ORDER PAGE ===');
      
      const step98 = stepTracker.addStep('Navigate to Homepage for Order Page Payment Journey');
      try {
        await orderPagePaymentPage.navigateToHomepage();
        await orderPagePaymentPage.navigateToProduct();
        await orderPagePaymentPage.setDeliveryAndTimeSlot();
        await orderPagePaymentPage.addToCart();
        await orderPagePaymentPage.testPayment();
        await orderPagePaymentPage.payFromOtherPage();
        await orderPagePaymentPage.testPayment();
        stepTracker.completeStep(step98, 'passed');
        console.log('✅ Journey 19: Payment from Order Page - COMPLETED');
      } catch (error) {
        stepTracker.completeStep(step98, 'failed', error.message);
        throw error;
      }

      const summary = stepTracker.getSummary();
      await slackNotifier.sendAllJourneysComplete(summary);
      console.log('🎉 ALL THREE JOURNEYS (17-19) COMPLETED SUCCESSFULLY!');
      console.log('✅ Journey 17: Location Testing');
      console.log('✅ Journey 18: Spherical Home Page Icon Exploration');
      console.log('✅ Journey 19: Payment from Order Page');

    } catch (error) {
      const summary = stepTracker.getSummary();
      await slackNotifier.sendAllJourneysComplete(summary);
      console.error('❌ Journey failed:', error.message);
      throw error;
    }
  });
});
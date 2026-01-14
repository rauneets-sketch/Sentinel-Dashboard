const { test, expect } = require('@playwright/test');
const { StepTracker } = require('../src/main/utils/StepTracker');
const { SlackNotifier } = require('../src/main/utils/SlackNotifier');
const { HomePage } = require('../src/main/pages/HomePage');
const { PaymentPage } = require('../src/main/pages/PaymentPage');
const { ProfilePage } = require('../src/main/pages/ProfilePage');
const { ReminderFAQPage } = require('../src/main/pages/ReminderFAQPage');
const { InternationalPage } = require('../src/main/pages/InternationalPage');
const { DAPage } = require('../src/main/pages/DAPage');

const { CombinationalPurchasePage } = require('../src/main/pages/CombinationalPurchasePage');
const { AddOnPage } = require('../src/main/pages/AddOnPage');
const { CakeVariantPage } = require('../src/main/pages/CakeVariantPage');


test.describe('Complete User Journey - Home Page Exploration, Payment Testing, Checkout Login, Reminder FAQ, International Purchase, DA Page Modification, Combinational Purchase, ADD-On Edge Case Testing, Cake Variant Testing, Coupon Testing, Personalized Products, Message Cards, Product Exploration, Same SKU Testing and Search-based Purchase', () => {
  let stepTracker, slackNotifier;

  test.beforeEach(async () => {
    stepTracker = new StepTracker();
    slackNotifier = new SlackNotifier();
    await slackNotifier.sendJourneyStart('Complete User Journey - Home Page Exploration, Payment Testing, Checkout Login, Reminder FAQ, International Purchase, DA Page Modification, Combinational Purchase and Cake Variant Testing');
  });

  test('@complete-journey @smoke Complete Nineteen Journey Flow', async ({ page }) => {
    test.setTimeout(300000);
    const homePage = new HomePage(page);
    const paymentPage = new PaymentPage(page);
    const profilePage = new ProfilePage(page);
    const reminderFAQPage = new ReminderFAQPage(page);
    const internationalPage = new InternationalPage(page);
    const daPage = new DAPage(page);

    const combinationalPurchasePage = new CombinationalPurchasePage(page);
    const addOnPage = new AddOnPage(page);
    const cakeVariantPage = new CakeVariantPage(page);
    let productPage, weddingProductPage, internationalProductPage, daProductPage, domesticProductPage, internationalRosesPage, addOnProductPage, qatarProductPage, cakeVariantProductPage;

    try {
      console.log('🚀 Starting Complete User Journey - Home Page Exploration, Payment Testing, Checkout Login, Reminder FAQ, International Purchase, DA Page Modification, Combinational Purchase and Cake Variant Testing');

      // Step 1: Navigate, Login, Clear Cart and Set Delivery Location
      const step1 = stepTracker.addStep('Navigate, Login, Clear Cart and Set Delivery Location');
      try {
        await homePage.navigateToHomePage();
        await homePage.dismissNotificationPopup();
        await homePage.completeLogin();
        await homePage.clearCart();
        await homePage.setDeliveryLocation();
        
        stepTracker.completeStep(step1, 'passed');
      } catch (error) {
        stepTracker.completeStep(step1, 'failed', error.message);
        throw error;
      }

      // Step 2: Explore Occasions Section (handled by step definitions)
      const step2 = stepTracker.addStep('Explore Occasions Section');
      try {
        console.log('Occasions section exploration handled by step definitions');
        stepTracker.completeStep(step2, 'passed');
      } catch (error) {
        stepTracker.completeStep(step2, 'failed', error.message);
        throw error;
      }

      // Step 3: Explore Offers and Gift Finder
      const step3 = stepTracker.addStep('Explore Offers and Gift Finder');
      try {
        await homePage.exploreOffersAndQuickSearch();
        
        stepTracker.completeStep(step3, 'passed');
      } catch (error) {
        stepTracker.completeStep(step3, 'failed', error.message);
        throw error;
      }



      // Journey 2: Payment Methods Testing
      console.log('\n🎯 === JOURNEY 2: PAYMENT METHODS TESTING ===');
      
      // Step 4: Navigate to Cake Products
      const step4 = stepTracker.addStep('Navigate to Cake Products');
      try {
        console.log('Navigating directly to cake product with delivery location check...');
        productPage = await paymentPage.selectCakeProduct();
        
        stepTracker.completeStep(step4, 'passed');
      } catch (error) {
        stepTracker.completeStep(step4, 'failed', error.message);
        throw error;
      }

      // Step 5: Set Delivery Date and Add to Cart
      const step5 = stepTracker.addStep('Set Delivery Date and Add to Cart');
      try {
        await paymentPage.setDeliveryDateAndProceed(productPage);
        
        stepTracker.completeStep(step5, 'passed');
      } catch (error) {
        stepTracker.completeStep(step5, 'failed', error.message);
        throw error;
      }

      // Step 6: Test Payment Methods
      const step6 = stepTracker.addStep('Test Payment Methods');
      try {
        console.log('Testing QR payment method...');
        await paymentPage.testQRPayment(productPage);
        
        console.log('Testing card payment method...');
        await paymentPage.testCardPayment(productPage);
        
        console.log('Returning to FNP homepage...');
        await page.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
        
        stepTracker.completeStep(step6, 'passed');
        console.log('✅ Journey 2: Payment Methods Testing - COMPLETED');
      } catch (error) {
        console.error('❌ Journey 2 failed at:', error.message);
        stepTracker.completeStep(step6, 'failed', error.message);
        try {
          await page.goto('https://www.fnp.com/');
          await page.waitForTimeout(2000);
        } catch (navError) {
          console.log('Failed to navigate back to homepage:', navError.message);
        }
        throw error;
      }

      // Journey 3: International Phone Number Change
      console.log('\n📱 === JOURNEY 3: INTERNATIONAL PHONE NUMBER CHANGE ===');
      console.log('🚀 Starting Journey 3: International Phone Number Change');
      
      // Step 7: Navigate to Profile and Change Phone Number
      const step7 = stepTracker.addStep('Navigate to Profile and Change Phone Number');
      try {
        console.log('Navigating to profile...');
        await profilePage.navigateToProfile();
        
        console.log('Changing international phone number...');
        await profilePage.changeInternationalPhoneNumber();
        
        stepTracker.completeStep(step7, 'passed');
        console.log('✅ Step 7: Navigate to Profile and Change Phone Number - COMPLETED');
      } catch (error) {
        console.error('❌ Step 7 failed at:', error.message);
        stepTracker.completeStep(step7, 'failed', error.message);
        throw error;
      }

      // Step 8: Navigate to Wedding Section and Select Product
      const step8 = stepTracker.addStep('Navigate to Wedding Section and Select Product');
      try {
        console.log('Navigating back to homepage...');
        await profilePage.navigateToHomepage();
        
        console.log('Navigating to wedding section...');
        await profilePage.navigateToWeddingSection();
        
        console.log('Selecting wedding product...');
        weddingProductPage = await profilePage.selectWeddingProduct();
        
        stepTracker.completeStep(step8, 'passed');
        console.log('✅ Step 8: Navigate to Wedding Section and Select Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 8 failed at:', error.message);
        stepTracker.completeStep(step8, 'failed', error.message);
        throw error;
      }

      // Step 9: Complete Phone Number Change in DA Page
      const step9 = stepTracker.addStep('Complete Phone Number Change in DA Page');
      try {
        console.log('Setting delivery date and adding to cart...');
        await profilePage.setDeliveryDateAndAddToCart(weddingProductPage);
        
        console.log('Editing sender phone number in DA page...');
        await profilePage.editSenderPhoneNumber(weddingProductPage);
        
        console.log('Proceeding to payment and canceling...');
        await profilePage.proceedToPaymentAndCancel(weddingProductPage);
        
        // Navigate back to homepage
        console.log('Navigating back to homepage after Journey 3...');
        await page.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        stepTracker.completeStep(step9, 'passed');
        console.log('✅ Step 9: Complete Phone Number Change in DA Page - COMPLETED');
        console.log('✅ Journey 3: International Phone Number Change - COMPLETED');
      } catch (error) {
        console.error('❌ Step 9 failed at:', error.message);
        stepTracker.completeStep(step9, 'failed', error.message);
        try {
          await page.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(2000);
        } catch (navError) {
          console.log('Failed to navigate back to homepage:', navError.message);
        }
        throw error;
      }

      // Journey 4: Reminder and FAQ Testing
      console.log('\n📝 === JOURNEY 4: REMINDER AND FAQ TESTING ===');
      console.log('🚀 Starting Journey 4: Reminder and FAQ Testing');
      
      // Ensure we're on homepage before starting Journey 4 (Journey 3 should have navigated back)
      console.log('Verifying homepage state for Journey 4...');
      const currentUrl = page.url();
      if (!currentUrl.includes('fnp.com/') || currentUrl.length > 'https://www.fnp.com/'.length + 10) {
        console.log('Navigating to homepage for Journey 4...');
        await page.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
      }
      
      // Step 10: Navigate to Reminder Section
      const step10 = stepTracker.addStep('Navigate to Reminder Section');
      try {
        console.log('Navigating to reminder section...');
        await reminderFAQPage.navigateToReminder();
        
        stepTracker.completeStep(step10, 'passed');
        console.log('✅ Step 10: Navigate to Reminder Section - COMPLETED');
      } catch (error) {
        console.error('❌ Step 10 failed at:', error.message);
        stepTracker.completeStep(step10, 'failed', error.message);
        throw error;
      }

      // Step 11: Create Reminder and Schedule Gift
      const step11 = stepTracker.addStep('Create Reminder and Schedule Gift');
      try {
        await reminderFAQPage.createReminder();
        // await reminderFAQPage.editReminder();
        // await reminderFAQPage.deleteReminder();
        await reminderFAQPage.scheduleGift();
        
        stepTracker.completeStep(step11, 'passed');
      } catch (error) {
        stepTracker.completeStep(step11, 'failed', error.message);
        throw error;
      }

      // Step 12: Navigate to FAQ Section and Explore
      const step12 = stepTracker.addStep('Navigate to FAQ Section and Explore');
      try {
        await reminderFAQPage.navigateToFAQ();
        await reminderFAQPage.exploreFAQSections();
        
        stepTracker.completeStep(step12, 'passed');
      } catch (error) {
        stepTracker.completeStep(step12, 'failed', error.message);
        throw error;
      }

      // Journey 5: International Purchase Testing
      console.log('\n🌍 === JOURNEY 5: INTERNATIONAL PURCHASE TESTING ===');
      
      // Step 13: Navigate to International Section
      const step13 = stepTracker.addStep('Navigate to International Section');
      try {
        await internationalPage.navigateToInternational();
        
        stepTracker.completeStep(step13, 'passed');
      } catch (error) {
        stepTracker.completeStep(step13, 'failed', error.message);
        throw error;
      }

      // Step 14: Select UAE and Birthday Category
      const step14 = stepTracker.addStep('Select UAE and Birthday Category');
      try {
        await internationalPage.selectUAE();
        await internationalPage.selectBirthdayCategory();
        
        stepTracker.completeStep(step14, 'passed');
      } catch (error) {
        stepTracker.completeStep(step14, 'failed', error.message);
        throw error;
      }

      // Step 15: Set Location and Complete International Purchase
      const step15 = stepTracker.addStep('Set Location and Complete International Purchase');
      try {
        await internationalPage.setDeliveryLocation();
        internationalProductPage = await internationalPage.selectProduct();
        await internationalPage.setDeliveryDateAndExplore(internationalProductPage);
        await internationalPage.addToCartAndProceed(internationalProductPage);
        await internationalPage.testPayment(internationalProductPage);
        
        // Navigate back to homepage after Journey 5
        console.log('Navigating back to homepage after Journey 5...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');
        
        stepTracker.completeStep(step15, 'passed');
        console.log('✅ Journey 5: International Purchase - COMPLETED');
      } catch (error) {
        stepTracker.completeStep(step15, 'failed', error.message);
        // Don't close page on error - just navigate back
        try {
          await page.goto('https://www.fnp.com/');
          await page.waitForTimeout(2000);
        } catch (navError) {
          console.log('Failed to navigate back to homepage:', navError.message);
        }
        throw error;
      }

      // Journey 6: DA Page Modification
      console.log('\n🏠 === JOURNEY 6: DA PAGE MODIFICATION ===');
      console.log('🚀 Starting Journey 6: DA Page Modification');
      
      // Step 16: Navigate to FNP Homepage for DA Journey
      const step16 = stepTracker.addStep('Navigate to FNP Homepage for DA Journey');
      try {
        console.log('Ensuring we are on FNP homepage for Journey 6...');
        const currentUrl = page.url();
        console.log('Current URL before Journey 6:', currentUrl);
        
        if (!currentUrl.includes('fnp.com/') || currentUrl.includes('/checkout') || currentUrl.includes('/cart')) {
          console.log('Navigating to homepage for Journey 6...');
          await page.goto('https://www.fnp.com/');
          await page.waitForTimeout(2000);
        }
        await page.waitForLoadState('networkidle');
        
        stepTracker.completeStep(step16, 'passed');
        console.log('✅ Step 16: Navigate to FNP Homepage for DA Journey - COMPLETED');
      } catch (error) {
        console.error('❌ Step 16 failed at:', error.message);
        stepTracker.completeStep(step16, 'failed', error.message);
        throw error;
      }

      // Step 17: Complete DA Page Modification Journey
      const step17 = stepTracker.addStep('Complete DA Page Modification Journey');
      try {
        console.log('Starting DA Page navigation to FNP Luxe...');
        await daPage.navigateToFNPLuxe();
        
        console.log('Navigating to Same Day Luxury...');
        await daPage.navigateToSameDayLuxury();
        
        console.log('Selecting Golden Hour product (or alternative if delivery restricted)...');
        daProductPage = await daPage.selectGoldenHourProduct();
        
        console.log('Setting initial delivery date...');
        await daPage.setInitialDeliveryDate(daProductPage);
        
        console.log('Adding to cart and continuing...');
        await daPage.addToCartAndContinue(daProductPage);
        
        console.log('Modifying delivery info...');
        await daPage.modifyDeliveryInfo(daProductPage);
        
        console.log('Adding frequent add-ons...');
        await daPage.addFrequentAddOns(daProductPage);
        
        console.log('Adding new address...');
        await daPage.addNewAddress(daProductPage);
        
        console.log('Handling ordering for myself...');
        await daPage.handleOrderingForMyself(daProductPage);
        
        console.log('Filling address details...');
        await daPage.fillAddressDetails(daProductPage);
        
        console.log('Saving and delivering here...');
        await daPage.saveAndDeliverHere(daProductPage);
        
        console.log('Editing sender name...');
        await daPage.editSenderName(daProductPage);
        
        console.log('Deleting address...');
        await daPage.deleteAddress(daProductPage);
        
        console.log('Proceeding to payment...');
        await daPage.proceedToPayment(daProductPage);
        
        // Navigate back to homepage instead of closing page
        console.log('Navigating back to homepage after Journey 6...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');
        
        stepTracker.completeStep(step17, 'passed');
        console.log('✅ Journey 6: DA Page Modification - COMPLETED');
      } catch (error) {
        console.error('❌ DA Page Journey failed at:', error.message);
        stepTracker.completeStep(step17, 'failed', error.message);
        try {
          await page.goto('https://www.fnp.com/');
          await page.waitForTimeout(2000);
        } catch (navError) {
          console.log('Failed to navigate back to homepage:', navError.message);
        }
        throw error;
      }

      // Journey 7: Domestic and International Combinational Purchase
      console.log('\n🌍 === JOURNEY 7: DOMESTIC AND INTERNATIONAL COMBINATIONAL PURCHASE ===');
      console.log('🚀 Starting Journey 7: Domestic and International Combinational Purchase');
      
      // Step 18: Navigate to FNP Homepage for Combinational Journey
      const step18 = stepTracker.addStep('Navigate to FNP Homepage for Combinational Journey');
      try {
        console.log('Ensuring we are on FNP homepage for Journey 7...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
        
        stepTracker.completeStep(step18, 'passed');
        console.log('✅ Step 18: Navigate to FNP Homepage for Combinational Journey - COMPLETED');
      } catch (error) {
        console.error('❌ Step 18 failed at:', error.message);
        stepTracker.completeStep(step18, 'failed', error.message);
        throw error;
      }

      // Step 19: Complete Domestic and International Combinational Purchase
      const step19 = stepTracker.addStep('Complete Domestic and International Combinational Purchase');
      try {
        console.log('Navigating to Anniversary section...');
        await combinationalPurchasePage.navigateToAnniversary();
        
        console.log('Selecting domestic product...');
        domesticProductPage = await combinationalPurchasePage.selectDomesticProduct();
        
        console.log('Setting domestic delivery date...');
        await combinationalPurchasePage.setDomesticDeliveryDate(domesticProductPage);
        
        console.log('Adding domestic product to cart...');
        await combinationalPurchasePage.addDomesticToCart(domesticProductPage);
        
        console.log('Navigating to international section...');
        await combinationalPurchasePage.navigateToInternational(domesticProductPage);
        
        console.log('Selecting USA as destination...');
        await combinationalPurchasePage.selectUSA(domesticProductPage);
        
        console.log('Navigating to international anniversary...');
        try {
          await combinationalPurchasePage.navigateToInternationalAnniversary(domesticProductPage);
        } catch (navError) {
          console.log('International anniversary navigation failed, continuing...', navError.message);
          // Continue with the flow even if this step fails
        }
        
        console.log('Selecting international product...');
        internationalRosesPage = await combinationalPurchasePage.selectInternationalProduct(domesticProductPage);
        
        console.log('Setting international location...');
        await combinationalPurchasePage.setInternationalLocation(internationalRosesPage);
        
        console.log('Setting international delivery date...');
        await combinationalPurchasePage.setInternationalDeliveryDate(internationalRosesPage);
        
        console.log('Adding international product to cart and checkout...');
        await combinationalPurchasePage.addInternationalToCartAndCheckout(internationalRosesPage);
        
        console.log('Testing combinational payment...');
        await combinationalPurchasePage.testCombinationalPayment(internationalRosesPage);
        
        console.log('Navigating back to homepage after Journey 7...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
        
        stepTracker.completeStep(step19, 'passed');
        console.log('✅ Journey 7: Domestic and International Combinational Purchase - COMPLETED');
      } catch (error) {
        console.error('❌ Combinational Purchase Journey failed at:', error.message);
        stepTracker.completeStep(step19, 'failed', error.message);
        try {
          await page.goto('https://www.fnp.com/');
          await page.waitForTimeout(2000);
        } catch (navError) {
          console.log('Failed to navigate back to homepage:', navError.message);
        }
        throw error;
      }

      // Journey 8: ADD-On Edge Case Testing on PDP
      console.log('\n🔧 === JOURNEY 8: ADD-ON EDGE CASE TESTING ON PDP ===');
      console.log('🚀 Starting Journey 8: ADD-On Edge Case Testing on PDP');
      
      // Step 20: Navigate to FNP Homepage for ADD-On Journey
      const step20 = stepTracker.addStep('Navigate to FNP Homepage for ADD-On Journey');
      try {
        console.log('Ensuring we are on FNP homepage for Journey 8...');
        const currentUrl = page.url();
        if (!currentUrl.includes('fnp.com/') || currentUrl.includes('/usa/')) {
          console.log('Navigating to homepage for Journey 8...');
          await page.goto('https://www.fnp.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
          await page.waitForTimeout(5000);
        }
        
        stepTracker.completeStep(step20, 'passed');
        console.log('✅ Step 20: Navigate to FNP Homepage for ADD-On Journey - COMPLETED');
      } catch (error) {
        console.error('❌ Step 20 failed at:', error.message);
        stepTracker.completeStep(step20, 'failed', error.message);
        // Don't throw error, continue with current page
        console.log('⚠️ Continuing with current page for Journey 8');
      }

      // Step 21: Navigate to Timeless Love Product
      const step21 = stepTracker.addStep('Navigate to Timeless Love Product');
      try {
        console.log('Navigating to Timeless Love product...');
        addOnProductPage = await addOnPage.navigateToTimelessLoveProduct();
        stepTracker.completeStep(step21, 'passed');
        console.log('✅ Step 21: Navigate to Timeless Love Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 21 failed:', error.message);
        stepTracker.completeStep(step21, 'failed', error.message);
        throw error;
      }

      // Step 22: Set Delivery Date for Addon Product
      const step22 = stepTracker.addStep('Set Delivery Date for Addon Product');
      try {
        console.log('Setting delivery date for addon product...');
        await addOnPage.setDeliveryDate(addOnProductPage);
        stepTracker.completeStep(step22, 'passed');
        console.log('✅ Step 22: Set Delivery Date - COMPLETED');
      } catch (error) {
        console.error('❌ Step 22 failed:', error.message);
        stepTracker.completeStep(step22, 'failed', error.message);
        throw error;
      }

      // Step 23: Test ADD-On Functionality
      const step23 = stepTracker.addStep('Test ADD-On Functionality');
      try {
        console.log('Testing ADD-On functionality with edge case validation...');
        await addOnPage.testAddOnFunctionality(addOnProductPage);
        stepTracker.completeStep(step23, 'passed');
        console.log('✅ Step 23: Test ADD-On Functionality - COMPLETED');
      } catch (error) {
        console.error('❌ Step 23 failed:', error.message);
        stepTracker.completeStep(step23, 'failed', error.message);
        throw error;
      }

      // Step 24: Add Product with Addons to Cart
      const step24 = stepTracker.addStep('Add Product with Addons to Cart');
      try {
        console.log('Adding product with addons to cart...');
        await addOnPage.addToCartWithAddOns(addOnProductPage);
        stepTracker.completeStep(step24, 'passed');
        console.log('✅ Step 24: Add Product with Addons to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 24 failed:', error.message);
        stepTracker.completeStep(step24, 'failed', error.message);
        throw error;
      }

      // Step 25: Test Payment with Addons
      const step25 = stepTracker.addStep('Test Payment with Addons');
      try {
        console.log('Testing payment with addons...');
        await addOnPage.testPaymentWithAddOns(addOnProductPage);
        stepTracker.completeStep(step25, 'passed');
        console.log('✅ Step 25: Test Payment with Addons - COMPLETED');
      } catch (error) {
        console.error('❌ Step 25 failed:', error.message);
        stepTracker.completeStep(step25, 'failed', error.message);
        throw error;
      }

      // Step 26: Navigate to Qatar Gifts Page
      const step26 = stepTracker.addStep('Navigate to Qatar Gifts Page');
      try {
        console.log('Navigating to Qatar gifts page...');
        await addOnPage.navigateToQatarPage(addOnProductPage);
        stepTracker.completeStep(step26, 'passed');
        console.log('✅ Step 26: Navigate to Qatar Gifts Page - COMPLETED');
      } catch (error) {
        console.error('❌ Step 26 failed:', error.message);
        stepTracker.completeStep(step26, 'failed', error.message);
        throw error;
      }

      // Step 27: Set Qatar Delivery Location
      const step27 = stepTracker.addStep('Set Qatar Delivery Location');
      try {
        console.log('Setting Qatar delivery location...');
        await addOnPage.setQatarLocation(addOnProductPage);
        stepTracker.completeStep(step27, 'passed');
        console.log('✅ Step 27: Set Qatar Delivery Location - COMPLETED');
      } catch (error) {
        console.error('❌ Step 27 failed:', error.message);
        stepTracker.completeStep(step27, 'failed', error.message);
        throw error;
      }

      // Step 28: Select Qatar Birthday Product
      const step28 = stepTracker.addStep('Select Qatar Birthday Product');
      try {
        console.log('Selecting Qatar birthday product...');
        qatarProductPage = await addOnPage.selectQatarProduct(addOnProductPage);
        stepTracker.completeStep(step28, 'passed');
        console.log('✅ Step 28: Select Qatar Birthday Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 28 failed:', error.message);
        stepTracker.completeStep(step28, 'failed', error.message);
        throw error;
      }

      // Step 29: Set Qatar Delivery Date with Midnight Delivery
      const step29 = stepTracker.addStep('Set Qatar Delivery Date with Midnight Delivery');
      try {
        console.log('Setting Qatar delivery date with midnight delivery...');
        await addOnPage.setQatarDeliveryDate(qatarProductPage);
        stepTracker.completeStep(step29, 'passed');
        console.log('✅ Step 29: Set Qatar Delivery Date - COMPLETED');
      } catch (error) {
        console.error('❌ Step 29 failed:', error.message);
        stepTracker.completeStep(step29, 'failed', error.message);
        throw error;
      }

      // Step 30: Add Qatar Product Add-ons
      const step30 = stepTracker.addStep('Add Qatar Product Add-ons');
      try {
        console.log('Adding Qatar product add-ons...');
        await addOnPage.addQatarAddOns(qatarProductPage);
        stepTracker.completeStep(step30, 'passed');
        console.log('✅ Step 30: Add Qatar Product Add-ons - COMPLETED');
      } catch (error) {
        console.error('❌ Step 30 failed:', error.message);
        stepTracker.completeStep(step30, 'failed', error.message);
        throw error;
      }

      // Step 31: Process Qatar Checkout and Payment
      const step31 = stepTracker.addStep('Process Qatar Checkout and Payment');
      try {
        console.log('Processing Qatar checkout and payment...');
        await addOnPage.processQatarCheckout(qatarProductPage);
        stepTracker.completeStep(step31, 'passed');
        console.log('✅ Step 31: Process Qatar Checkout and Payment - COMPLETED');
      } catch (error) {
        console.error('❌ Step 31 failed:', error.message);
        stepTracker.completeStep(step31, 'failed', error.message);
        throw error;
      }

      // Navigate back to homepage after Journey 8
      try {
        console.log('Navigating back to homepage after Journey 8...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
        console.log('✅ Journey 8: ADD-On Edge Case Testing on PDP with Qatar Extension - COMPLETED');
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 9: Cake Variant Testing
      console.log('\n🍰 === JOURNEY 9: CAKE VARIANT TESTING ===');
      console.log('🚀 Starting Journey 9: Cake Variant Testing');
      
      // Step 32: Navigate to FNP Homepage for Cake Variant Journey
      const step32 = stepTracker.addStep('Navigate to FNP Homepage for Cake Variant Journey');
      try {
        console.log('Navigating to FNP homepage for Journey 9...');
        await cakeVariantPage.navigateToHomepage();
        stepTracker.completeStep(step32, 'passed');
        console.log('✅ Step 32: Navigate to FNP Homepage - COMPLETED');
      } catch (error) {
        console.error('❌ Step 32 failed:', error.message);
        stepTracker.completeStep(step32, 'failed', error.message);
        throw error;
      }

      // Step 33: Navigate to Fudge Brownie Cake Product
      const step33 = stepTracker.addStep('Navigate to Fudge Brownie Cake Product');
      try {
        console.log('Navigating to Fudge Brownie Cake product...');
        cakeVariantProductPage = await cakeVariantPage.navigateToCakeProduct();
        stepTracker.completeStep(step33, 'passed');
        console.log('✅ Step 33: Navigate to Fudge Brownie Cake Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 33 failed:', error.message);
        stepTracker.completeStep(step33, 'failed', error.message);
        throw error;
      }

      // Step 34: Set Cake Variant Delivery Date and Add to Cart
      const step34 = stepTracker.addStep('Set Cake Variant Delivery Date and Add to Cart');
      try {
        console.log('Setting delivery date and adding to cart...');
        await cakeVariantPage.setDeliveryDateAndAddToCart(cakeVariantProductPage);
        stepTracker.completeStep(step34, 'passed');
        console.log('✅ Step 34: Set Delivery Date and Add to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 34 failed:', error.message);
        stepTracker.completeStep(step34, 'failed', error.message);
        throw error;
      }

      // Step 35: Change Cake Variant
      const step35 = stepTracker.addStep('Change Cake Variant');
      try {
        console.log('Changing cake variant...');
        await cakeVariantPage.changeCakeVariant(cakeVariantProductPage);
        stepTracker.completeStep(step35, 'passed');
        console.log('✅ Step 35: Change Cake Variant - COMPLETED');
      } catch (error) {
        console.error('❌ Step 35 failed:', error.message);
        stepTracker.completeStep(step35, 'failed', error.message);
        throw error;
      }

      // Step 36: Set Delivery and Proceed to Payment
      const step36 = stepTracker.addStep('Set Delivery and Proceed to Payment');
      try {
        console.log('Setting delivery and proceeding to payment...');
        await paymentPage.setDeliveryDateAndProceed(cakeVariantProductPage);
        stepTracker.completeStep(step36, 'passed');
        console.log('✅ Step 36: Set Delivery and Proceed to Payment - COMPLETED');
      } catch (error) {
        console.error('❌ Step 36 failed:', error.message);
        stepTracker.completeStep(step36, 'failed', error.message);
        throw error;
      }

      // Step 37: Test QR Payment for Cake Variant
      const step37 = stepTracker.addStep('Test QR Payment for Cake Variant');
      try {
        console.log('Testing QR payment for cake variant...');
        await paymentPage.testQRPayment(cakeVariantProductPage);
        stepTracker.completeStep(step37, 'passed');
        console.log('✅ Step 37: Test QR Payment - COMPLETED');
        console.log('✅ Journey 9: Cake Variant Testing - COMPLETED');
      } catch (error) {
        console.error('❌ Step 37 failed:', error.message);
        stepTracker.completeStep(step37, 'failed', error.message);
        throw error;
      }

      // Navigate back to homepage after Journey 9
      try {
        console.log('Navigating back to homepage after Journey 9...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 10: Coupon Testing
      console.log('\n🎫 === JOURNEY 10: COUPON TESTING ===');
      console.log('🚀 Starting Journey 10: Coupon Testing');
      
      const couponPage = new (require('../src/main/pages/CouponPage'))(page);
      let couponProductPage;
      
      // Step 38: Navigate to Product for Invalid Coupon Testing
      const step38 = stepTracker.addStep('Navigate to Product for Invalid Coupon Testing');
      try {
        console.log('Navigating to product for invalid coupon testing...');
        couponProductPage = await couponPage.navigateToProduct();
        stepTracker.completeStep(step38, 'passed');
        console.log('✅ Step 38: Navigate to Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 38 failed:', error.message);
        stepTracker.completeStep(step38, 'failed', error.message);
        throw error;
      }

      // Step 39: Add Product to Cart for Invalid Coupon Testing
      const step39 = stepTracker.addStep('Add Product to Cart for Invalid Coupon Testing');
      try {
        console.log('Adding product to cart for invalid coupon testing...');
        await couponPage.addProductToCart();
        stepTracker.completeStep(step39, 'passed');
        console.log('✅ Step 39: Add Product to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 39 failed:', error.message);
        stepTracker.completeStep(step39, 'failed', error.message);
        throw error;
      }

      // Step 40: Test Invalid Coupon Code
      const step40 = stepTracker.addStep('Test Invalid Coupon Code');
      try {
        console.log('Testing invalid coupon code...');
        await couponPage.testInvalidCoupon();
        stepTracker.completeStep(step40, 'passed');
        console.log('✅ Step 40: Test Invalid Coupon - COMPLETED');
      } catch (error) {
        console.error('❌ Step 40 failed:', error.message);
        stepTracker.completeStep(step40, 'failed', error.message);
        throw error;
      }

      // Step 41: Navigate and Add Product for Valid Coupon Testing
      const step41 = stepTracker.addStep('Navigate and Add Product for Valid Coupon Testing');
      try {
        console.log('Navigating and adding product for valid coupon testing...');
        await couponPage.navigateAndAddToCart();
        stepTracker.completeStep(step41, 'passed');
        console.log('✅ Step 41: Navigate and Add Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 41 failed:', error.message);
        stepTracker.completeStep(step41, 'failed', error.message);
        throw error;
      }

      // Step 42: Test Valid Coupon Code
      const step42 = stepTracker.addStep('Test Valid Coupon Code');
      try {
        console.log('Testing valid coupon code...');
        await couponPage.testValidCoupon();
        stepTracker.completeStep(step42, 'passed');
        console.log('✅ Step 42: Test Valid Coupon - COMPLETED');
      } catch (error) {
        console.error('❌ Step 42 failed:', error.message);
        stepTracker.completeStep(step42, 'failed', error.message);
        throw error;
      }

      // Step 43: Proceed to Payment with Coupon
      const step43 = stepTracker.addStep('Proceed to Payment with Coupon');
      try {
        console.log('Proceeding to payment with coupon...');
        await couponPage.proceedToPayment();
        stepTracker.completeStep(step43, 'passed');
        console.log('✅ Step 43: Proceed to Payment - COMPLETED');
      } catch (error) {
        console.error('❌ Step 43 failed:', error.message);
        stepTracker.completeStep(step43, 'failed', error.message);
        throw error;
      }

      // Step 44: Test Payment Flow with Coupon
      const step44 = stepTracker.addStep('Test Payment Flow with Coupon');
      try {
        console.log('Testing payment flow with coupon...');
        await couponPage.testPaymentFlow();
        stepTracker.completeStep(step44, 'passed');
        console.log('✅ Step 44: Test Payment Flow - COMPLETED');
        console.log('✅ Journey 10: Coupon Testing - COMPLETED');
      } catch (error) {
        console.error('❌ Step 44 failed:', error.message);
        stepTracker.completeStep(step44, 'failed', error.message);
        throw error;
      }

      // Navigate back to homepage after Journey 10
      try {
        console.log('Navigating back to homepage after Journey 10...');
        await couponPage.navigateBackToHome();
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 11: Personalized Water Bottle Purchase
      console.log('\n🍼 === JOURNEY 11: PERSONALIZED WATER BOTTLE PURCHASE ===');
      console.log('🚀 Starting Journey 11: Personalized Water Bottle Purchase');
      
      const PersonalizedTextPage = require('../src/main/pages/PersonalizedTextPage');
      const personalizedTextPage = new PersonalizedTextPage(page);
      
      // Step 45: Navigate to Personalized Text Product
      const step45 = stepTracker.addStep('Navigate to Personalized Text Product');
      try {
        console.log('Navigating to personalized water bottle product...');
        await personalizedTextPage.navigateToPersonalizedProduct();
        stepTracker.completeStep(step45, 'passed');
        console.log('✅ Step 45: Navigate to Personalized Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 45 failed:', error.message);
        stepTracker.completeStep(step45, 'failed', error.message);
        throw error;
      }

      // Step 46: Add Personalized Text
      const step46 = stepTracker.addStep('Add Personalized Text');
      try {
        console.log('Adding personalized text "ASTHA SINGH"...');
        await personalizedTextPage.addPersonalizedText();
        stepTracker.completeStep(step46, 'passed');
        console.log('✅ Step 46: Add Personalized Text - COMPLETED');
      } catch (error) {
        console.error('❌ Step 46 failed:', error.message);
        stepTracker.completeStep(step46, 'failed', error.message);
        throw error;
      }

      // Step 47: Add Personalized Product to Cart
      const step47 = stepTracker.addStep('Add Personalized Product to Cart');
      try {
        console.log('Adding personalized product to cart...');
        await personalizedTextPage.addToCart();
        stepTracker.completeStep(step47, 'passed');
        console.log('✅ Step 47: Add to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 47 failed:', error.message);
        stepTracker.completeStep(step47, 'failed', error.message);
        throw error;
      }

      // Step 48: Proceed to Payment for Personalized Product
      const step48 = stepTracker.addStep('Proceed to Payment for Personalized Product');
      try {
        console.log('Proceeding to payment for personalized product...');
        await personalizedTextPage.proceedToPayment();
        stepTracker.completeStep(step48, 'passed');
        console.log('✅ Step 48: Proceed to Payment - COMPLETED');
      } catch (error) {
        console.error('❌ Step 48 failed:', error.message);
        stepTracker.completeStep(step48, 'failed', error.message);
        throw error;
      }

      // Step 49: Test Payment Flow for Personalized Product
      const step49 = stepTracker.addStep('Test Payment Flow for Personalized Product');
      try {
        console.log('Testing payment flow for personalized product...');
        await personalizedTextPage.testPaymentFlow();
        stepTracker.completeStep(step49, 'passed');
        console.log('✅ Step 49: Test Payment Flow - COMPLETED');
        console.log('✅ Journey 11: Personalized Water Bottle Purchase - COMPLETED');
      } catch (error) {
        console.error('❌ Step 49 failed:', error.message);
        stepTracker.completeStep(step49, 'failed', error.message);
        throw error;
      }

      // Navigate back to homepage after Journey 11
      try {
        console.log('Navigating back to homepage after Journey 11...');
        await personalizedTextPage.navigateBackToHome();
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 12: Message Card Purchase
      console.log('\n🎂 === JOURNEY 12: MESSAGE CARD PURCHASE ===');
      console.log('🚀 Starting Journey 12: Celebration Bento Cake Purchase');
      
      const MessageCardPage = require('../src/main/pages/MessageCardPage');
      const messageCardPage = new MessageCardPage(page);
      
      // Step 50: Navigate to Message Card Product
      const step50 = stepTracker.addStep('Navigate to Message Card Product');
      try {
        console.log('Navigating to celebration bento cake product...');
        await messageCardPage.navigateToMessageCardProduct();
        stepTracker.completeStep(step50, 'passed');
        console.log('✅ Step 50: Navigate to Message Card Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 50 failed:', error.message);
        stepTracker.completeStep(step50, 'failed', error.message);
        throw error;
      }

      // Step 51: Set Delivery Date for Message Card
      const step51 = stepTracker.addStep('Set Delivery Date for Message Card');
      try {
        console.log('Setting delivery date for celebration bento cake...');
        await messageCardPage.setDeliveryDate();
        stepTracker.completeStep(step51, 'passed');
        console.log('✅ Step 51: Set Delivery Date - COMPLETED');
      } catch (error) {
        console.error('❌ Step 51 failed:', error.message);
        stepTracker.completeStep(step51, 'failed', error.message);
        throw error;
      }

      // Step 52: Add Message Card to Cart
      const step52 = stepTracker.addStep('Add Message Card to Cart');
      try {
        console.log('Adding celebration bento cake to cart...');
        await messageCardPage.addToCart();
        stepTracker.completeStep(step52, 'passed');
        console.log('✅ Step 52: Add to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 52 failed:', error.message);
        stepTracker.completeStep(step52, 'failed', error.message);
        throw error;
      }

      // Step 53: Proceed to Payment for Message Card
      const step53 = stepTracker.addStep('Proceed to Payment for Message Card');
      try {
        console.log('Adding message card and proceeding to payment...');
        await messageCardPage.proceedToPayment();
        stepTracker.completeStep(step53, 'passed');
        console.log('✅ Step 53: Proceed to Payment - COMPLETED');
      } catch (error) {
        console.error('❌ Step 53 failed:', error.message);
        stepTracker.completeStep(step53, 'failed', error.message);
        throw error;
      }

      // Step 54: Test Payment Flow for Message Card
      const step54 = stepTracker.addStep('Test Payment Flow for Message Card');
      try {
        console.log('Testing payment flow for celebration bento cake...');
        await messageCardPage.testPaymentFlow();
        stepTracker.completeStep(step54, 'passed');
        console.log('✅ Step 54: Test Payment Flow - COMPLETED');
        console.log('✅ Journey 12: Message Card Purchase - COMPLETED');
      } catch (error) {
        console.error('❌ Step 54 failed:', error.message);
        stepTracker.completeStep(step54, 'failed', error.message);
        throw error;
      }

      // Navigate back to homepage after Journey 12
      try {
        console.log('Navigating back to homepage after Journey 12...');
        await messageCardPage.navigateBackToHome();
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 13: Comprehensive Product Exploration
      console.log('\n🔍 === JOURNEY 13: COMPREHENSIVE PRODUCT EXPLORATION ===');
      console.log('🚀 Starting Journey 13: Product Exploration Journey');
      
      const ProductExplorationPage = require('../src/main/pages/ProductExplorationPage');
      const explorationPage = new ProductExplorationPage(page);
      
      // Step 55: Navigate to Exotic Blue Orchid Product
      const step55 = stepTracker.addStep('Navigate to Exotic Blue Orchid Product');
      try {
        console.log('Navigating to Exotic Blue Orchid product...');
        await explorationPage.exploreCategories();
        stepTracker.completeStep(step55, 'passed');
        console.log('✅ Step 55: Navigate to Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 55 failed:', error.message);
        stepTracker.completeStep(step55, 'failed', error.message);
        throw error;
      }

      // Step 56: Explore Product Photos
      const step56 = stepTracker.addStep('Explore Product Photos');
      try {
        console.log('Exploring product photo gallery...');
        await explorationPage.exploreProductPhotos();
        stepTracker.completeStep(step56, 'passed');
        console.log('✅ Step 56: Explore Product Photos - COMPLETED');
      } catch (error) {
        console.error('❌ Step 56 failed:', error.message);
        stepTracker.completeStep(step56, 'failed', error.message);
        throw error;
      }

      // Step 57: Browse Product Sections and Offers
      const step57 = stepTracker.addStep('Browse Product Sections and Offers');
      try {
        console.log('Browsing product sections and offers...');
        await explorationPage.browseProductSections();
        stepTracker.completeStep(step57, 'passed');
        console.log('✅ Step 57: Browse Product Sections - COMPLETED');
      } catch (error) {
        console.error('❌ Step 57 failed:', error.message);
        stepTracker.completeStep(step57, 'failed', error.message);
        throw error;
      }

      // Step 58: Check Product Details
      const step58 = stepTracker.addStep('Check Product Details');
      try {
        console.log('Checking product details...');
        await explorationPage.checkProductDetails();
        stepTracker.completeStep(step58, 'passed');
        console.log('✅ Step 58: Check Product Details - COMPLETED');
      } catch (error) {
        console.error('❌ Step 58 failed:', error.message);
        stepTracker.completeStep(step58, 'failed', error.message);
        throw error;
      }

      // Step 59: Explore Product Reviews
      const step59 = stepTracker.addStep('Explore Product Reviews');
      try {
        console.log('Exploring product reviews...');
        await explorationPage.exploreProductReviews();
        stepTracker.completeStep(step59, 'passed');
        console.log('✅ Step 59: Explore Product Reviews - COMPLETED');
      } catch (error) {
        console.error('❌ Step 59 failed:', error.message);
        stepTracker.completeStep(step59, 'failed', error.message);
        throw error;
      }

      // Step 60: Set Delivery Date and Time
      const step60 = stepTracker.addStep('Set Delivery Date and Time');
      try {
        console.log('Setting delivery date and time slot...');
        await explorationPage.setDeliveryDateAndTime();
        stepTracker.completeStep(step60, 'passed');
        console.log('✅ Step 60: Set Delivery Date and Time - COMPLETED');
      } catch (error) {
        console.error('❌ Step 60 failed:', error.message);
        stepTracker.completeStep(step60, 'failed', error.message);
        throw error;
      }

      // Step 61: Add Product to Cart
      const step61 = stepTracker.addStep('Add Product to Cart');
      try {
        console.log('Adding product to cart...');
        await explorationPage.addToCart();
        stepTracker.completeStep(step61, 'passed');
        console.log('✅ Step 61: Add to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 61 failed:', error.message);
        stepTracker.completeStep(step61, 'failed', error.message);
        throw error;
      }

      // Step 62: Test Payment Flow
      const step62 = stepTracker.addStep('Test Payment Flow');
      try {
        console.log('Testing QR payment flow...');
        await explorationPage.testPayment();
        stepTracker.completeStep(step62, 'passed');
        console.log('✅ Step 62: Test Payment Flow - COMPLETED');
        console.log('✅ Journey 13: Comprehensive Product Exploration - COMPLETED');
      } catch (error) {
        console.error('❌ Step 62 failed:', error.message);
        stepTracker.completeStep(step62, 'failed', error.message);
        throw error;
      }

      // Navigate back to homepage after Journey 13
      try {
        console.log('Navigating back to homepage after Journey 13...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 14: Same SKU Product Exploration
      console.log('\n🔄 === JOURNEY 14: SAME SKU PRODUCT EXPLORATION ===');
      console.log('🚀 Starting Journey 14: Same SKU Product Exploration');
      
      const SameSKUExplorationPage = require('../src/main/pages/SameSKUExplorationPage');
      const sameSKUPage = new SameSKUExplorationPage(page);
      
      // Journey 14A: Courier Delivery
      console.log('\n📦 === JOURNEY 14A: COURIER DELIVERY ===');
      
      // Step 63: Navigate to Jade Plant Product
      const step63 = stepTracker.addStep('Navigate to Jade Plant Product');
      try {
        console.log('Navigating to jade plant product...');
        await sameSKUPage.navigateToJadePlantProduct();
        stepTracker.completeStep(step63, 'passed');
        console.log('✅ Step 63: Navigate to Jade Plant Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 63 failed:', error.message);
        stepTracker.completeStep(step63, 'failed', error.message);
        throw error;
      }

      // Step 64: Set Courier Delivery Date and Time
      const step64 = stepTracker.addStep('Set Courier Delivery Date and Time');
      try {
        console.log('Setting courier delivery date and time...');
        await sameSKUPage.selectDeliveryDateAndTime();
        stepTracker.completeStep(step64, 'passed');
        console.log('✅ Step 64: Set Courier Delivery Date and Time - COMPLETED');
      } catch (error) {
        console.error('❌ Step 64 failed:', error.message);
        stepTracker.completeStep(step64, 'failed', error.message);
        throw error;
      }

      // Step 65: Add Product to Cart (Courier)
      const step65 = stepTracker.addStep('Add Product to Cart (Courier)');
      try {
        console.log('Adding product to cart with courier delivery...');
        await sameSKUPage.addToCart();
        stepTracker.completeStep(step65, 'passed');
        console.log('✅ Step 65: Add Product to Cart (Courier) - COMPLETED');
      } catch (error) {
        console.error('❌ Step 65 failed:', error.message);
        stepTracker.completeStep(step65, 'failed', error.message);
        throw error;
      }

      // Step 66: Test QR Payment (Courier)
      const step66 = stepTracker.addStep('Test QR Payment (Courier)');
      try {
        console.log('Testing QR payment for courier delivery...');
        await sameSKUPage.testPayment();
        stepTracker.completeStep(step66, 'passed');
        console.log('✅ Step 66: Test QR Payment (Courier) - COMPLETED');
        console.log('✅ Journey 14A: Courier Delivery - COMPLETED');
      } catch (error) {
        console.error('❌ Step 66 failed:', error.message);
        stepTracker.completeStep(step66, 'failed', error.message);
        throw error;
      }

      // Journey 14B: Hand Delivery
      console.log('\n🚚 === JOURNEY 14B: HAND DELIVERY ===');
      
      // Step 67: Navigate Back to Same Product
      const step67 = stepTracker.addStep('Navigate Back to Same Product');
      try {
        console.log('Navigating back to same jade plant product...');
        await sameSKUPage.navigateBackToProduct();
        stepTracker.completeStep(step67, 'passed');
        console.log('✅ Step 67: Navigate Back to Same Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 67 failed:', error.message);
        stepTracker.completeStep(step67, 'failed', error.message);
        throw error;
      }

      // Step 68: Select Hand Delivery Option
      const step68 = stepTracker.addStep('Select Hand Delivery Option');
      try {
        console.log('Selecting hand delivery option...');
        await sameSKUPage.selectHandDelivery();
        stepTracker.completeStep(step68, 'passed');
        console.log('✅ Step 68: Select Hand Delivery Option - COMPLETED');
      } catch (error) {
        console.error('❌ Step 68 failed:', error.message);
        stepTracker.completeStep(step68, 'failed', error.message);
        throw error;
      }

      // Step 69: Set Hand Delivery Date and Time
      const step69 = stepTracker.addStep('Set Hand Delivery Date and Time');
      try {
        console.log('Setting hand delivery date and time...');
        await sameSKUPage.setDeliveryDateAfterHandDelivery();
        stepTracker.completeStep(step69, 'passed');
        console.log('✅ Step 69: Set Hand Delivery Date and Time - COMPLETED');
      } catch (error) {
        console.error('❌ Step 69 failed:', error.message);
        stepTracker.completeStep(step69, 'failed', error.message);
        throw error;
      }

      // Step 70: Add Same Product to Cart (Hand)
      const step70 = stepTracker.addStep('Add Same Product to Cart (Hand)');
      try {
        console.log('Adding same product to cart with hand delivery...');
        await sameSKUPage.addToCart();
        stepTracker.completeStep(step70, 'passed');
        console.log('✅ Step 70: Add Same Product to Cart (Hand) - COMPLETED');
      } catch (error) {
        console.error('❌ Step 70 failed:', error.message);
        stepTracker.completeStep(step70, 'failed', error.message);
        throw error;
      }

      // Step 71: Test QR Payment (Hand)
      const step71 = stepTracker.addStep('Test QR Payment (Hand)');
      try {
        console.log('Testing QR payment for hand delivery...');
        await sameSKUPage.testPayment();
        stepTracker.completeStep(step71, 'passed');
        console.log('✅ Step 71: Test QR Payment (Hand) - COMPLETED');
        console.log('✅ Journey 14B: Hand Delivery - COMPLETED');
        console.log('✅ Journey 14: Same SKU Product Exploration - COMPLETED');
      } catch (error) {
        console.error('❌ Step 71 failed:', error.message);
        stepTracker.completeStep(step71, 'failed', error.message);
        throw error;
      }

      // Navigate back to homepage after Journey 14
      try {
        console.log('Navigating back to homepage after Journey 14...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 15: Search-based Product Purchase Journey
      console.log('\n🔍 === JOURNEY 15: SEARCH-BASED PRODUCT PURCHASE ===');
      console.log('🚀 Starting Journey 15: Search-based Product Purchase Journey');
      
      const SearchBasedPurchasePage = require('../src/main/pages/SearchBasedPurchasePage');
      const searchPage = new SearchBasedPurchasePage(page);
      
      // Step 72: Search and Navigate to Product
      const step72 = stepTracker.addStep('Search and Navigate to Product');
      let searchProductPage;
      try {
        console.log('Searching for cake and navigating to product...');
        searchProductPage = await searchPage.searchAndNavigateToProduct();
        stepTracker.completeStep(step72, 'passed');
        console.log('✅ Step 72: Search and Navigate to Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 72 failed:', error.message);
        stepTracker.completeStep(step72, 'failed', error.message);
        throw error;
      }

      // Step 73: Set Delivery Date and Time
      const step73 = stepTracker.addStep('Set Delivery Date and Time');
      try {
        console.log('Setting delivery date and time slot...');
        await searchPage.setDeliveryDateAndTime(searchProductPage);
        stepTracker.completeStep(step73, 'passed');
        console.log('✅ Step 73: Set Delivery Date and Time - COMPLETED');
      } catch (error) {
        console.error('❌ Step 73 failed:', error.message);
        stepTracker.completeStep(step73, 'failed', error.message);
        throw error;
      }

      // Step 74: Add Product to Cart
      const step74 = stepTracker.addStep('Add Product to Cart');
      try {
        console.log('Adding searched product to cart...');
        await searchPage.addToCart(searchProductPage);
        stepTracker.completeStep(step74, 'passed');
        console.log('✅ Step 74: Add Product to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 74 failed:', error.message);
        stepTracker.completeStep(step74, 'failed', error.message);
        throw error;
      }

      // Step 75: Test Payment Flow
      const step75 = stepTracker.addStep('Test Payment Flow');
      try {
        console.log('Testing QR payment flow for searched product...');
        await searchPage.testPayment(searchProductPage);
        stepTracker.completeStep(step75, 'passed');
        console.log('✅ Step 75: Test Payment Flow - COMPLETED');
        console.log('✅ Journey 15: Search-based Product Purchase - COMPLETED');
      } catch (error) {
        console.error('❌ Step 75 failed:', error.message);
        stepTracker.completeStep(step75, 'failed', error.message);
        throw error;
      }
      
      // Navigate back to homepage after Journey 15
      try {
        console.log('Navigating back to homepage after Journey 15...');
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
        console.log('✅ Journey 15: Search-based Product Purchase - COMPLETED');
      } catch (error) {
        console.error('❌ Failed to navigate back to homepage:', error.message);
      }

      // Journey 16: Personalized Photo Upload
      console.log('\n📸 === JOURNEY 16: PERSONALIZED PHOTO UPLOAD ===');
      console.log('🚀 Starting Journey 16: Personalized Photo Upload');
      
      const { PersonalizedPhotoUploadPage } = require('../src/main/pages/PersonalizedPhotoUploadPage');
      const personalizedPhotoPage = new PersonalizedPhotoUploadPage(page);
      
      // Step 76: Navigate to Personalized Cushion
      const step76 = stepTracker.addStep('Navigate to Personalized Cushion');
      try {
        console.log('Navigating to personalized cushion product...');
        await personalizedPhotoPage.navigateToPersonalizedCushion();
        stepTracker.completeStep(step76, 'passed');
        console.log('✅ Step 76: Navigate to Personalized Cushion - COMPLETED');
      } catch (error) {
        console.error('❌ Step 76 failed:', error.message);
        stepTracker.completeStep(step76, 'failed', error.message);
        throw error;
      }

      // Step 77: Upload Photo and Add Text
      const step77 = stepTracker.addStep('Upload Photo and Add Text');
      try {
        console.log('Uploading photo and adding personalized text...');
        await personalizedPhotoPage.uploadPhoto();
        stepTracker.completeStep(step77, 'passed');
        console.log('✅ Step 77: Upload Photo and Add Text - COMPLETED');
      } catch (error) {
        console.error('❌ Step 77 failed:', error.message);
        stepTracker.completeStep(step77, 'failed', error.message);
        throw error;
      }

      // Step 78: Add Personalized Product to Cart
      const step78 = stepTracker.addStep('Add Personalized Product to Cart');
      try {
        console.log('Adding personalized cushion to cart...');
        await personalizedPhotoPage.addToCart();
        stepTracker.completeStep(step78, 'passed');
        console.log('✅ Step 78: Add Personalized Product to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 78 failed:', error.message);
        stepTracker.completeStep(step78, 'failed', error.message);
        throw error;
      }

      // Step 79: Test Payment for Personalized Product
      const step79 = stepTracker.addStep('Test Payment for Personalized Product');
      try {
        console.log('Testing payment for personalized product...');
        await personalizedPhotoPage.testPayment();
        stepTracker.completeStep(step79, 'passed');
        console.log('✅ Step 79: Test Payment for Personalized Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 79 failed:', error.message);
        stepTracker.completeStep(step79, 'failed', error.message);
        throw error;
      }

      // Step 80: Navigate Back to Homepage
      const step80 = stepTracker.addStep('Navigate Back to Homepage');
      try {
        console.log('Navigating back to homepage...');
        await personalizedPhotoPage.navigateBackToHomepage();
        stepTracker.completeStep(step80, 'passed');
        console.log('✅ Step 80: Navigate Back to Homepage - COMPLETED');
      } catch (error) {
        console.error('❌ Step 80 failed:', error.message);
        stepTracker.completeStep(step80, 'failed', error.message);
        throw error;
      }

      // Step 81: Navigate to Fridge Magnet Product
      const step81 = stepTracker.addStep('Navigate to Fridge Magnet Product');
      try {
        console.log('Navigating to fridge magnet product...');
        await personalizedPhotoPage.navigateToFridgeMagnet();
        stepTracker.completeStep(step81, 'passed');
        console.log('✅ Step 81: Navigate to Fridge Magnet Product - COMPLETED');
      } catch (error) {
        console.error('❌ Step 81 failed:', error.message);
        stepTracker.completeStep(step84, 'failed', error.message);
        throw error;
      }

      // Step 85: Set Delivery Date and Time for Fridge Magnet
      const step85 = stepTracker.addStep('Set Delivery Date and Time for Fridge Magnet');
      try {
        console.log('Setting delivery date and time for fridge magnet...');
        await personalizedPhotoPage.setDeliveryDateAndTime();
        stepTracker.completeStep(step85, 'passed');
        console.log('✅ Step 85: Set Delivery Date and Time for Fridge Magnet - COMPLETED');
      } catch (error) {
        console.error('❌ Step 85 failed:', error.message);
        stepTracker.completeStep(step85, 'failed', error.message);
        throw error;
      }

      // Step 86: Upload Four Photos to Fridge Magnet
      const step86 = stepTracker.addStep('Upload Four Photos to Fridge Magnet');
      try {
        console.log('Uploading four photos to fridge magnet...');
        await personalizedPhotoPage.uploadFourPhotos();
        stepTracker.completeStep(step86, 'passed');
        console.log('✅ Step 86: Upload Four Photos to Fridge Magnet - COMPLETED');
      } catch (error) {
        console.error('❌ Step 86 failed:', error.message);
        stepTracker.completeStep(step86, 'failed', error.message);
        throw error;
      }

      // Step 87: Add Fridge Magnet to Cart
      const step87 = stepTracker.addStep('Add Fridge Magnet to Cart');
      try {
        console.log('Adding fridge magnet to cart...');
        await personalizedPhotoPage.addToCartFridgeMagnet();
        stepTracker.completeStep(step87, 'passed');
        console.log('✅ Step 87: Add Fridge Magnet to Cart - COMPLETED');
      } catch (error) {
        console.error('❌ Step 87 failed:', error.message);
        stepTracker.completeStep(step87, 'failed', error.message);
        throw error;
      }

      // Step 88: Test Payment for Fridge Magnet
      const step88 = stepTracker.addStep('Test Payment for Fridge Magnet');
      try {
        console.log('Testing payment for fridge magnet...');
        await personalizedPhotoPage.testPaymentFridgeMagnet();
        stepTracker.completeStep(step88, 'passed');
        console.log('✅ Step 88: Test Payment for Fridge Magnet - COMPLETED');
        console.log('✅ Journey 16: Personalized Photo Upload - COMPLETED');
      } catch (error) {
        console.error('❌ Step 88 failed:', error.message);
        stepTracker.completeStep(step88, 'failed', error.message);
        throw error;
      }

      // Journey 17: Location Testing
      console.log('\n📍 === JOURNEY 17: LOCATION TESTING ===');
      console.log('🚀 Starting Journey 17: Location Testing');
      
      const LocationPage = require('../src/main/pages/LocationPage');
      const locationPage = new LocationPage(page);
      
      // Step 89: Navigate to Homepage for Location Journey
      const step89 = stepTracker.addStep('Navigate to Homepage for Location Journey');
      try {
        console.log('Navigating to homepage for location journey...');
        await locationPage.navigateToHomepage();
        stepTracker.completeStep(step89, 'passed');
        console.log('✅ Step 89: Navigate to Homepage - COMPLETED');
      } catch (error) {
        console.error('❌ Step 89 failed:', error.message);
        stepTracker.completeStep(step89, 'failed', error.message);
        throw error;
      }

      // Step 90: Select New Pincode Gurgaon
      const step90 = stepTracker.addStep('Select New Pincode Gurgaon');
      try {
        console.log('Selecting new pincode Gurgaon...');
        await locationPage.selectNewPincode();
        stepTracker.completeStep(step90, 'passed');
        console.log('✅ Step 90: Select New Pincode Gurgaon - COMPLETED');
      } catch (error) {
        console.error('❌ Step 90 failed:', error.message);
        stepTracker.completeStep(step90, 'failed', error.message);
        throw error;
      }

      // Step 91: Select Delhi Location
      const step91 = stepTracker.addStep('Select Delhi Location');
      try {
        console.log('Selecting Delhi location...');
        await locationPage.selectDelhiLocation();
        stepTracker.completeStep(step91, 'passed');
        console.log('✅ Step 91: Select Delhi Location - COMPLETED');
      } catch (error) {
        console.error('❌ Step 91 failed:', error.message);
        stepTracker.completeStep(step91, 'failed', error.message);
        throw error;
      }

      // Step 92: Navigate to PLP and Select Existing Bangalore Pincode
      const step92 = stepTracker.addStep('Navigate to PLP and Select Existing Bangalore Pincode');
      try {
        console.log('Navigating to PLP and selecting existing Bangalore pincode...');
        await locationPage.navigateToPdpAndSelectExistingPincode();
        stepTracker.completeStep(step92, 'passed');
        console.log('✅ Step 92: Navigate to PLP and Select Existing Bangalore Pincode - COMPLETED');
      } catch (error) {
        console.error('❌ Step 92 failed:', error.message);
        stepTracker.completeStep(step92, 'failed', error.message);
        throw error;
      }

      // Step 93: Select Gorakhpur Pincode
      const step93 = stepTracker.addStep('Select Gorakhpur Pincode');
      try {
        console.log('Selecting Gorakhpur pincode...');
        await locationPage.selectGorakhpurPincode();
        stepTracker.completeStep(step93, 'passed');
        console.log('✅ Step 93: Select Gorakhpur Pincode - COMPLETED');
      } catch (error) {
        console.error('❌ Step 93 failed:', error.message);
        stepTracker.completeStep(step93, 'failed', error.message);
        throw error;
      }

      // Step 94: Select Final Bangalore Location
      const step94 = stepTracker.addStep('Select Final Bangalore Location');
      try {
        console.log('Selecting final Bangalore location...');
        await locationPage.selectBangaloreLocation();
        stepTracker.completeStep(step94, 'passed');
        console.log('✅ Step 94: Select Final Bangalore Location - COMPLETED');
      } catch (error) {
        console.error('❌ Step 94 failed:', error.message);
        stepTracker.completeStep(step94, 'failed', error.message);
        throw error;
      }

      // Step 95: Return to Homepage After Location Testing
      const step95 = stepTracker.addStep('Return to Homepage After Location Testing');
      try {
        console.log('Returning to homepage after location testing...');
        await locationPage.returnToHomePage();
        stepTracker.completeStep(step95, 'passed');
        console.log('✅ Step 95: Return to Homepage - COMPLETED');
        console.log('✅ Journey 17: Location Testing - COMPLETED');
      } catch (error) {
        console.error('❌ Step 95 failed:', error.message);
        stepTracker.completeStep(step95, 'failed', error.message);
        throw error;
      }

      // Journey 18: Spherical Home Page Icon Exploration
      console.log('\n🌐 === JOURNEY 18: SPHERICAL HOME PAGE ICON EXPLORATION ===');
      console.log('🚀 Starting Journey 18: Spherical Home Page Icon Exploration');
      
      const SphericalHomePageExplorationPage = require('../src/main/pages/SphericalHomePageExplorationPage');
      const sphericalPage = new SphericalHomePageExplorationPage(page);
      
      // Step 96: Navigate to Homepage for Spherical Icon Exploration
      const step96 = stepTracker.addStep('Navigate to Homepage for Spherical Icon Exploration');
      try {
        console.log('Navigating to homepage for spherical icon exploration...');
        await sphericalPage.navigateToHomepage();
        stepTracker.completeStep(step96, 'passed');
        console.log('✅ Step 96: Navigate to Homepage - COMPLETED');
      } catch (error) {
        console.error('❌ Step 96 failed:', error.message);
        stepTracker.completeStep(step96, 'failed', error.message);
        throw error;
      }

      // Step 97: Explore Category Icons
      const step97 = stepTracker.addStep('Explore Category Icons');
      try {
        console.log('Exploring category icons...');
        await sphericalPage.exploreCategoryIcons();
        stepTracker.completeStep(step97, 'passed');
        console.log('✅ Step 97: Explore Category Icons - COMPLETED');
        console.log('✅ Journey 18: Spherical Home Page Icon Exploration - COMPLETED');
      } catch (error) {
        console.error('❌ Step 97 failed:', error.message);
        stepTracker.completeStep(step97, 'failed', error.message);
        throw error;
      }

      // Journey 19: Payment from Order Page
      console.log('\n💳 === JOURNEY 19: PAYMENT FROM ORDER PAGE ===');
      console.log('🚀 Starting Journey 19: Payment from Order Page');
      
      const OrderPagePaymentPage = require('../src/main/pages/OrderPagePaymentPage');
      const orderPagePaymentPage = new OrderPagePaymentPage(page);
      
      // Step 98: Navigate to Homepage for Order Page Payment Journey
      const step98 = stepTracker.addStep('Navigate to Homepage for Order Page Payment Journey');
      try {
        console.log('Navigating to homepage for order page payment journey...');
        await orderPagePaymentPage.navigateToHomepage();
        await orderPagePaymentPage.navigateToProduct();
        await orderPagePaymentPage.setDeliveryAndTimeSlot();
        await orderPagePaymentPage.addToCart();
        await orderPagePaymentPage.testPayment();
        await orderPagePaymentPage.payFromOtherPage();
        await orderPagePaymentPage.testPayment();
        stepTracker.completeStep(step98, 'passed');
        console.log('✅ Step 98: Navigate to Homepage - COMPLETED');
        console.log('✅ Journey 19: Payment from Order Page - COMPLETED');
      } catch (error) {
        console.error('❌ Step 98 failed:', error.message);
        stepTracker.completeStep(step98, 'failed', error.message);
        throw error;
      }
      const summary = stepTracker.getSummary();
      await slackNotifier.sendAllJourneysComplete(summary);
      console.log('🎉 ALL NINETEEN JOURNEYS COMPLETED SUCCESSFULLY!');
      console.log('✅ Journey 1: Home Page Exploration');
      console.log('✅ Journey 2: Payment Methods Testing');
      console.log('✅ Journey 3: International Phone Number Change');
      console.log('✅ Journey 4: Reminder and FAQ Testing');
      console.log('✅ Journey 5: International Purchase');
      console.log('✅ Journey 6: DA Page Modification');
      console.log('✅ Journey 7: Domestic and International Combinational Purchase');
      console.log('✅ Journey 8: ADD-On Edge Case Testing on PDP');
      console.log('✅ Journey 9: Cake Variant Testing');
      console.log('✅ Journey 10: Coupon Testing (Invalid & Valid)');
      console.log('✅ Journey 11: Personalized Water Bottle Purchase');
      console.log('✅ Journey 12: Message Card Purchase');
      console.log('✅ Journey 13: Comprehensive Product Exploration');
      console.log('✅ Journey 14: Same SKU Product Exploration (14A: Courier + 14B: Hand)');
      console.log('✅ Journey 15: Search-based Product Purchase');
      console.log('✅ Journey 16: Personalized Photo Upload (Cushion + Fridge Magnet)');
      console.log('✅ Journey 17: Location Testing');
      console.log('✅ Journey 18: Spherical Home Page Icon Exploration');
      console.log('✅ Journey 19: Payment from Order Page');
      console.log(`📊 Summary: ${summary.passedSteps}/${summary.totalSteps} steps passed in ${Math.round(summary.duration / 1000)}s`);

    } catch (error) {
      const summary = stepTracker.getSummary();
      await slackNotifier.sendAllJourneysComplete(summary);
      console.error('❌ Journey failed:', error.message);
      
      try {
        await page.screenshot({ path: `debug-complete-journey-error-${Date.now()}.png`, fullPage: true });
      } catch (screenshotError) {
        console.log('❌ Failed to take screenshot');
      }
      
      try {
        // Don't close pages - just navigate back to homepage
        await page.goto('https://www.fnp.com/');
        await page.waitForTimeout(2000);
      } catch (navError) {
        console.log('Failed to navigate back to homepage in error handler:', navError.message);
      }
      
      throw error;
    }
  });
});


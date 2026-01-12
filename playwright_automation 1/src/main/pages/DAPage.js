const { BasePage } = require('./BasePage');

class DAPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigateToFNP() {
    const currentUrl = this.page.url();
    if (!currentUrl.includes('fnp.com/') || currentUrl !== 'https://www.fnp.com/') {
      await this.goto('https://www.fnp.com/');
    }
  }

  async selectGoldenHourProduct() {
    console.log('🎂 [SELECT PRODUCT] Starting product selection...');
    const startTime = Date.now();
    
    try {
      // Navigate directly to Black Forest Bento Birthday Cake product URL
      console.log('🔗 [SELECT PRODUCT] Navigating to Black Forest Bento Birthday Cake product URL...');
      await this.goto('https://www.fnp.com/gift/black-forest-bento-birthday-cake?OCCASION_TAGS=birthday&pos=7');
      await this.page.waitForTimeout(3000);
      console.log(`✅ [SELECT PRODUCT] Navigation completed (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Check for delivery location error
      try {
        console.log('🔍 [SELECT PRODUCT] Checking for delivery location restrictions...');
        const deliveryError = await this.page.getByTestId('input_related_message').textContent({ timeout: 5000 });
        if (deliveryError && deliveryError.includes(' product can not be delivered at the desired location')) {
          console.log('⚠️ [SELECT PRODUCT] Black Forest Bento product cannot be delivered to location, switching to alternative product');
          // Navigate to alternative product
          await this.goto('https://www.fnp.com/gift/chocolate-truffle-cream-cake-half-kg-eggless?OCCASION_TAGS=birthday&pos=24');
          await this.page.waitForTimeout(3000);
          console.log(`✅ [SELECT PRODUCT] Successfully switched to Chocolate Truffle Cream Cake product (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
        } else {
          console.log('✅ [SELECT PRODUCT] No delivery restriction found, continuing with current product');
        }
      } catch (error) {
        // No delivery error message found, continue with current product
        console.log('✅ [SELECT PRODUCT] No delivery restriction message found, continuing with current product');
      }

      // Verify we're on a valid product page
      const currentUrl = this.page.url();
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`📝 [SELECT PRODUCT] Current URL: ${currentUrl}`);
      console.log(`✅ [SELECT PRODUCT] Product selection completed successfully in ${totalTime}s`);

      return this.page;
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [SELECT PRODUCT] Failed after ${totalTime}s:`, error.message);
      console.log(`📝 [SELECT PRODUCT] Error type: ${error.constructor.name}`);
      console.log(`📝 [SELECT PRODUCT] Current URL: ${this.page.url()}`);
      console.log('⚠️ [SELECT PRODUCT] Continuing with current page');
      return this.page;
    }
  }

  async setInitialDeliveryDate(productPage) {
    console.log('📅 [INITIAL DELIVERY] Setting initial delivery date...');
    const startTime = Date.now();
    
    try {
      // Try to find and click Later button
      console.log('🖱️ [INITIAL DELIVERY] Looking for Later button...');
      const laterButton = productPage.getByText('Later');
      await laterButton.waitFor({ state: 'visible', timeout: 5000 });
      await laterButton.click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [INITIAL DELIVERY] Later button clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Navigate to next month
      console.log('🖱️ [INITIAL DELIVERY] Navigating to next month...');
      await productPage.getByTestId('popover').getByRole('img', { name: 'arrow-right' }).click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [INITIAL DELIVERY] Navigated to next month (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Select date 15
      console.log('🖱️ [INITIAL DELIVERY] Selecting date 15...');
      await productPage.getByTestId('popover').getByText('15').click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [INITIAL DELIVERY] Date 15 selected (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Select time slot
      console.log('🖱️ [INITIAL DELIVERY] Selecting time slot...');
      await productPage.getByText(':00 - 09:00 Hrs').click();
      await productPage.waitForTimeout(500);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [INITIAL DELIVERY] Initial delivery date set successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⚠️ [INITIAL DELIVERY] Later button not found after ${totalTime}s, trying alternative delivery options`);
      
      try {
        // Try Today option if available
        console.log('🖱️ [INITIAL DELIVERY] Looking for Today button...');
        const todayButton = productPage.getByText('Today');
        await todayButton.waitFor({ state: 'visible', timeout: 3000 });
        await todayButton.click();
        await productPage.waitForTimeout(500);
        console.log(`✅ [INITIAL DELIVERY] Today button clicked`);

        // Select available time slot
        const timeSlots = ['12:00 - 14:00 Hrs', '14:00 - 16:00 Hrs', '16:00 - 18:00 Hrs', '18:00 - 20:00 Hrs'];
        for (const slot of timeSlots) {
          try {
            console.log(`🖱️ [INITIAL DELIVERY] Trying time slot: ${slot}...`);
            const slotElement = productPage.getByText(slot);
            if (await slotElement.isVisible({ timeout: 2000 })) {
              await slotElement.click();
              await productPage.waitForTimeout(500);
              console.log(`✅ [INITIAL DELIVERY] Time slot ${slot} selected`);
              break;
            }
          } catch (slotError) {
            console.log(`📝 [INITIAL DELIVERY] Time slot ${slot} not available`);
            continue;
          }
        }
        
        const totalTime2 = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [INITIAL DELIVERY] Alternative delivery date set successfully in ${totalTime2}s`);
      } catch (todayError) {
        const totalTime2 = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`⚠️ [INITIAL DELIVERY] No delivery options found after ${totalTime2}s, continuing without setting delivery date`);
        console.log(`📝 [INITIAL DELIVERY] Error: ${todayError.message}`);
      }
    }
  }

  async addToCartAndContinue(productPage) {
    console.log('🛒 [ADD TO CART] Starting add to cart process...');
    const startTime = Date.now();
    
    try {
      // Check if page is still open
      if (productPage.isClosed()) {
        console.log('❌ [ADD TO CART] Product page was closed, cannot continue with cart operations');
        throw new Error('Product page was closed');
      }

      // Wait for Add To Cart button and click
      console.log('🖱️ [ADD TO CART] Looking for Add To Cart button...');
      const addToCartBtn = productPage.getByRole('button', { name: 'Add To Cart' });
      await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });
      console.log(`✅ [ADD TO CART] Add To Cart button found (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      await addToCartBtn.click();
      console.log(`✅ [ADD TO CART] Add To Cart button clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // CRITICAL FIX: Add explicit wait after clicking Add To Cart to allow Continue button or drawer to load
      console.log('⏳ [ADD TO CART] Waiting for Continue button or drawer to load...');
      await productPage.waitForTimeout(3000);
      console.log(`✅ [ADD TO CART] Wait completed (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Try to click Continue button if it appears
      console.log('🔍 [ADD TO CART] Looking for Continue button...');
      try {
        const continueButton = productPage.locator('button').filter({ hasText: 'Continue' });
        const isVisible = await continueButton.isVisible({ timeout: 5000 });
        
        if (isVisible) {
          await continueButton.click({ timeout: 5000 });
          console.log(`✅ [ADD TO CART] Continue button clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
          await productPage.waitForTimeout(2000);
        } else {
          console.log('📝 [ADD TO CART] Continue button not visible, proceeding to drawer');
        }
      } catch (error) {
        console.log('📝 [ADD TO CART] Continue button not found, proceeding to drawer');
      }

      // Additional wait to ensure drawer CTA is fully loaded
      console.log('⏳ [ADD TO CART] Ensuring drawer is fully loaded...');
      await productPage.waitForTimeout(2000);

      // Wait for cart drawer and click
      console.log('🖱️ [ADD TO CART] Looking for cart drawer button...');
      const drawerButton = productPage.getByTestId('drawer').getByRole('button', { name: 'button' });
      await drawerButton.waitFor({ state: 'visible', timeout: 20000 });
      console.log(`✅ [ADD TO CART] Cart drawer button found (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      await drawerButton.click();
      console.log(`✅ [ADD TO CART] Cart drawer button clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      await productPage.waitForTimeout(1000);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [ADD TO CART] Add to cart process completed successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [ADD TO CART] Failed after ${totalTime}s:`, error.message);
      console.log(`📝 [ADD TO CART] Error type: ${error.constructor.name}`);
      console.log(`📝 [ADD TO CART] Current URL: ${productPage.url()}`);
      throw error;
    }
  }

  async modifyDeliveryInfo(productPage) {
    console.log('📝 [MODIFY DELIVERY] Starting delivery info modification...');
    const startTime = Date.now();
    
    try {
      // Click delivery info change button (no .first() - matches working version)
      console.log('🖱️ [MODIFY DELIVERY] Clicking delivery-info-change button...');
      await productPage.getByTestId('delivery-info-change').click();
      await productPage.waitForTimeout(1000);
      console.log(`✅ [MODIFY DELIVERY] Delivery info change clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Navigate to next month
      console.log('🖱️ [MODIFY DELIVERY] Navigating to next month...');
      await productPage.getByRole('button', { name: 'left_arrow' }).nth(1).click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [MODIFY DELIVERY] Navigated to next month (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Select date 15
      console.log('🖱️ [MODIFY DELIVERY] Selecting date 15...');
      await productPage.getByTestId('delivery-on-calender').getByText('15').click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [MODIFY DELIVERY] Date 15 selected (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Select morning delivery
      console.log('🖱️ [MODIFY DELIVERY] Selecting morning delivery...');
      await productPage.getByText('Morning Delivery', { exact: true }).click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [MODIFY DELIVERY] Morning delivery selected (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Select time slot
      console.log('🖱️ [MODIFY DELIVERY] Selecting time slot 07:00 - 09:00 hrs...');
      await productPage.getByText('07:00 - 09:00 hrs', { exact: true }).click();
      await productPage.waitForTimeout(1000);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [MODIFY DELIVERY] Delivery info modification completed successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [MODIFY DELIVERY] Failed after ${totalTime}s:`, error.message);
      console.log(`📝 [MODIFY DELIVERY] Error type: ${error.constructor.name}`);
      console.log(`📝 [MODIFY DELIVERY] Current URL: ${productPage.url()}`);
      throw error;
    }
  }

  async addFrequentAddOns(productPage) {
    console.log('🎁 [ADD-ONS] Starting add-ons process...');
    const startTime = Date.now();
    
    try {
      // Add first add-on
      console.log('🖱️ [ADD-ONS] Adding first add-on...');
      await productPage.getByTestId('incrementBtn').first().click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [ADD-ONS] First add-on added (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Click arrow for second add-on
      console.log('🖱️ [ADD-ONS] Clicking arrow for second add-on...');
      await productPage.locator('button:nth-child(3) > .frequent-addOns_arrow__2MAew > div > img').click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [ADD-ONS] Arrow clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Add second add-on
      console.log('🖱️ [ADD-ONS] Adding second add-on...');
      await productPage.getByTestId('incrementBtn').nth(1).click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [ADD-ONS] Second add-on added (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Click fifth image
      console.log('🖱️ [ADD-ONS] Clicking fifth image...');
      await productPage.getByRole('img').nth(5).click();
      await productPage.waitForTimeout(500);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [ADD-ONS] Add-ons process completed successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⚠️ [ADD-ONS] Add-ons failed after ${totalTime}s: ${error.message}`);
      console.log('📝 [ADD-ONS] Continuing with journey despite add-ons failure');
    }
  }

  async addNewAddress(productPage) {
    console.log('🏠 [NEW ADDRESS] Adding new address...');
    const startTime = Date.now();
    
    try {
      await productPage.getByTestId('newAddress').click();
      await productPage.waitForTimeout(1000);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [NEW ADDRESS] New address button clicked successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [NEW ADDRESS] Failed after ${totalTime}s:`, error.message);
      throw error;
    }
  }

  async handleOrderingForMyself(productPage) {
    console.log('✅ [ORDERING] Handling ordering for myself checkbox...');
    try {
      await productPage.getByRole('checkbox', { name: 'unchecked Ordering for Myself' }).getByRole('checkbox').check();
      await productPage.waitForTimeout(500);
      console.log('✅ [ORDERING] Ordering for myself checkbox checked');
    } catch (error) {
      console.log('📝 [ORDERING] Ordering for myself checkbox not found or already checked');
    }
  }

  async fillAddressDetails(productPage) {
    console.log('📝 [ADDRESS DETAILS] Filling address details...');
    const startTime = Date.now();
    
    try {
      // Fill name field
      console.log('🖱️ [ADDRESS DETAILS] Filling name field...');
      await productPage.locator('div:nth-child(3) > .MuiGrid-root.MuiGrid-container.MuiGrid-direction-xs-column > div > .address-form_wrapperSingle__3mPI8 > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').first().click();
      await productPage.waitForTimeout(500);
      await productPage.locator('.MuiInputBase-root.MuiOutlinedInput-root.Mui-focused > .MuiInputBase-input').fill('asdf');
      await productPage.waitForTimeout(500);
      console.log(`✅ [ADDRESS DETAILS] Name field filled (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

      // Fill address field
      console.log('🖱️ [ADDRESS DETAILS] Filling address field...');
      await productPage.getByText('*Apartment, Street, Area,').click();
      await productPage.waitForTimeout(500);
      await productPage.getByRole('textbox', { name: '*Apartment, Street, Area,' }).fill('asdf');
      await productPage.waitForTimeout(500);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [ADDRESS DETAILS] Address details filled successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [ADDRESS DETAILS] Failed after ${totalTime}s:`, error.message);
      throw error;
    }
  }

  async saveAndDeliverHere(productPage) {
    console.log('💾 [SAVE ADDRESS] Saving address...');
    const startTime = Date.now();
    
    try {
      await productPage.getByRole('button', { name: 'Save & Deliver here' }).click();
      await productPage.waitForTimeout(2000);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [SAVE ADDRESS] Address saved successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [SAVE ADDRESS] Failed after ${totalTime}s:`, error.message);
      throw error;
    }
  }

  async editSenderName(productPage) {
    console.log('✏️ [EDIT SENDER] Editing sender name...');
    const startTime = Date.now();
    
    try {
      console.log('🖱️ [EDIT SENDER] Clicking edit button...');
      await productPage.getByTestId('editBtn').click();
      await productPage.waitForTimeout(500);
      console.log(`✅ [EDIT SENDER] Edit button clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      console.log('🖱️ [EDIT SENDER] Clicking sender name field...');
      await productPage.getByTestId('senderName').click();
      await productPage.waitForTimeout(500);
      
      console.log('📝 [EDIT SENDER] Filling sender name...');
      await productPage.getByTestId('senderName').fill('FNP FNP');
      await productPage.waitForTimeout(500);
      console.log(`✅ [EDIT SENDER] Sender name filled (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      console.log('🖱️ [EDIT SENDER] Clicking save button...');
      await productPage.getByTestId('saveBtn').click();
      await productPage.waitForTimeout(2000);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [EDIT SENDER] Sender name edited successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [EDIT SENDER] Failed after ${totalTime}s:`, error.message);
      throw error;
    }
  }

  async deleteAddress(productPage) {
    const startTime = Date.now();
    console.log('🗑️ [DELETE ADDRESS] Starting address deletion process...');
    console.log(`⏱️ [DELETE ADDRESS] Start time: ${new Date().toISOString()}`);
    await productPage.waitForTimeout(2000);
    
    try {
      // First, try to find any delete button (not hardcoded ID)
      console.log('🔍 [DELETE ADDRESS] Looking for delete address buttons...');
      console.log(`📝 [DELETE ADDRESS] Current URL: ${productPage.url()}`);
      
      // Try to find delete buttons with a shorter timeout first
      const deleteButtons = await productPage.locator('[data-testid^="delete-address-"]').all();
      const elapsed1 = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`📊 [DELETE ADDRESS] Found ${deleteButtons.length} delete address button(s) (${elapsed1}s elapsed)`);
      
      if (deleteButtons.length === 0) {
        console.log('⚠️ [DELETE ADDRESS] No delete address buttons found on page');
        console.log(`📝 [DELETE ADDRESS] Current URL: ${productPage.url()}`);
        console.log(`⏱️ [DELETE ADDRESS] Total time: ${elapsed1}s`);
        return;
      }
      
      // Click the first delete button found
      console.log('🖱️ [DELETE ADDRESS] Clicking first delete address button...');
      await deleteButtons[0].waitFor({ state: 'visible', timeout: 10000 });
      await deleteButtons[0].click({ timeout: 10000 });
      const elapsed2 = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [DELETE ADDRESS] Delete button clicked (${elapsed2}s elapsed)`);
      
      await productPage.waitForTimeout(1000);
      
      // Confirm deletion
      console.log('🖱️ [DELETE ADDRESS] Looking for confirmation button...');
      const confirmButton = productPage.getByRole('button', { name: 'Yes' });
      await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
      await confirmButton.click({ timeout: 10000 });
      const elapsed3 = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [DELETE ADDRESS] Deletion confirmed (${elapsed3}s elapsed)`);
      
      await productPage.waitForTimeout(2000);
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [DELETE ADDRESS] Address deletion completed successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [DELETE ADDRESS] Failed after ${totalTime}s:`, error.message);
      console.log(`📝 [DELETE ADDRESS] Error type: ${error.constructor.name}`);
      console.log(`📝 [DELETE ADDRESS] Current URL: ${productPage.url()}`);
      console.log(`📝 [DELETE ADDRESS] Error stack:`, error.stack);
      console.log('⚠️ [DELETE ADDRESS] Continuing with payment despite deletion failure');
    }
  }

  async proceedToPayment(productPage) {
    console.log('💳 [PAYMENT] Starting payment process...');
    const startTime = Date.now();
    
    try {
      // Click proceed to pay button
      console.log('🖱️ [PAYMENT] Looking for proceed to pay button...');
      const proceedButton = productPage.locator('#proceed-to-pay-btn');
      await proceedButton.waitFor({ state: 'visible', timeout: 10000 });
      console.log(`✅ [PAYMENT] Proceed to pay button found (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      await proceedButton.click();
      console.log(`✅ [PAYMENT] Proceed to pay button clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      await productPage.waitForTimeout(2000);
      
      // Click Show QR button
      console.log('🖱️ [PAYMENT] Looking for Show QR button...');
      const showQRButton = productPage.getByRole('button', { name: 'Show QR' });
      await showQRButton.waitFor({ state: 'visible', timeout: 10000 });
      console.log(`✅ [PAYMENT] Show QR button found (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      await showQRButton.click();
      console.log(`✅ [PAYMENT] Show QR button clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      await productPage.waitForTimeout(2000);
      
      // Cancel payment
      console.log('🖱️ [PAYMENT] Looking for Cancel Payment link...');
      const cancelLink = productPage.getByRole('link', { name: 'Cancel Payment' });
      await cancelLink.waitFor({ state: 'visible', timeout: 10000 });
      console.log(`✅ [PAYMENT] Cancel Payment link found (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      await cancelLink.click();
      console.log(`✅ [PAYMENT] Cancel Payment clicked (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      await productPage.waitForTimeout(1000);
      
      // Confirm cancellation
      console.log('🖱️ [PAYMENT] Looking for YES button...');
      const yesButton = productPage.getByRole('button', { name: 'YES' });
      await yesButton.waitFor({ state: 'visible', timeout: 10000 });
      console.log(`✅ [PAYMENT] YES button found (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      
      await yesButton.click();
      console.log(`✅ [PAYMENT] Payment cancelled successfully (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      await productPage.waitForTimeout(2000);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [PAYMENT] Payment process completed successfully in ${totalTime}s`);
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`❌ [PAYMENT] Payment process failed after ${totalTime}s:`, error.message);
      console.log(`📝 [PAYMENT] Error type: ${error.constructor.name}`);
      console.log(`📝 [PAYMENT] Current URL: ${productPage.url()}`);
      throw error;
    }
  }

  async completeDAPageModificationJourney() {
    console.log('🚀 Starting DA Page Modification Journey');

    // Navigate to FNP homepage
    await this.navigateToFNP();

    // Select Black Forest Bento Birthday Cake product
    const productPage = await this.selectGoldenHourProduct();

    // Set initial delivery date
    await this.setInitialDeliveryDate(productPage);

    // Add to cart and continue
    await this.addToCartAndContinue(productPage);

    // Modify delivery information
    await this.modifyDeliveryInfo(productPage);

    // Add frequent add-ons
    await this.addFrequentAddOns(productPage);

    // Add new address
    await this.addNewAddress(productPage);

    // Fill address details
    await this.fillAddressDetails(productPage);

    // Save and deliver here
    await this.saveAndDeliverHere(productPage);

    // Edit sender name
    await this.editSenderName(productPage);

    // Delete address and proceed to payment
    await this.deleteAddressAndProceedToPayment(productPage);

    console.log('✅ DA Page Modification Journey Completed');
    return productPage;
  }
}

module.exports = { DAPage };

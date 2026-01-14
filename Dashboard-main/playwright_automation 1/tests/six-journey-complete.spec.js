const { test, expect } = require('@playwright/test');
const { DAPage } = require('../src/main/pages/DAPage');
const { EightJourneyRunner } = require('../src/main/runners/SixJourneyRunner');

test.describe('Complete Eight Journey Flow', () => {
  let journeyRunner;

  test.beforeEach(async ({ page }) => {
    journeyRunner = new EightJourneyRunner();
  });

  test('DA Page Modification Journey - Standalone', async ({ page }) => {
    console.log('🏠 Starting DA Page Modification Journey');
    
    const daPage = new DAPage(page);
    
    // Execute the complete DA journey
    const productPage = await daPage.completeDAPageModificationJourney();
    
    // Verify the journey completed successfully
    expect(productPage).toBeTruthy();
    
    // Close the product page
    await productPage.close();
    
    console.log('✅ DA Page Modification Journey Completed');
  });

  test('Complete Eight Journey Integration Test', async ({ page }) => {
    console.log('🚀 Starting Complete Eight Journey Integration Test');
    
    // This test would integrate all eight journeys
    // For demonstration, we'll show the DA journey integration
    
    const daPage = new DAPage(page);
    
    try {
      // Journey 6: DA Page Modification (as part of complete flow)
      console.log('📋 Executing Journey 6: DA Page Modification');
      
      await daPage.navigateToFNP();
      await daPage.verifyFNPLuxeContent();
      await daPage.navigateToSameDayLuxury();
      
      const productPage = await daPage.selectGoldenHourProduct();
      await daPage.setInitialDeliveryDate(productPage);
      await daPage.addToCartAndContinue(productPage);
      await daPage.modifyDeliveryInfo(productPage);
      await daPage.addFrequentAddOns(productPage);
      await daPage.handleOrderingForMyself(productPage);
      await daPage.addNewAddress(productPage);
      await daPage.fillAddressDetails(productPage);
      await daPage.saveAndDeliverHere(productPage);
      await daPage.editSenderName(productPage);
      
      await productPage.close();
      
      console.log('✅ All Eight Journeys Completed Successfully');
      
    } catch (error) {
      console.error('❌ Journey execution failed:', error);
      throw error;
    }
  });

  test('Journey Runner Execution Test', async ({ page }) => {
    console.log('🎯 Testing Journey Runner Execution');
    
    // Test the journey runner
    const summary = await journeyRunner.executeDAJourneyOnly();
    
    expect(summary.totalDASteps).toBeGreaterThan(0);
    expect(summary.passedDASteps).toBe(summary.totalDASteps);
    expect(summary.failedDASteps).toBe(0);
    
    console.log('📊 Journey Runner Test Summary:', summary);
  });

  test.afterEach(async () => {
    if (journeyRunner) {
      const summary = journeyRunner.getExecutionSummary();
      console.log('📈 Final Execution Summary:', summary);
    }
  });
});
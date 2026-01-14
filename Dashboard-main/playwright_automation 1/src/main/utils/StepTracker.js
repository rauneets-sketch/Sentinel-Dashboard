/**
 * StepTracker - Tracks individual test steps for granular user journey reporting
 * Matches the Java framework's StepTracker.java implementation
 * Maps Playwright/Cucumber steps to business-friendly journey names
 */
const logger = require('./Logger');

class StepTracker {
  constructor() {
    // Static variables to persist data across step definitions
    this.currentJourneySteps = [];
    this.stepStartTime = 0;
    this.currentStepName = '';
    this.currentScenario = null;
  }

  /**
   * Start tracking a scenario
   */
  startScenario(scenarioName) {
    logger.info(`📊 Starting scenario tracking: ${scenarioName}`);
    this.currentJourneySteps = [];
    this.stepStartTime = Date.now();
    this.currentScenario = scenarioName;
  }

  /**
   * Start tracking a new step
   */
  startStep(stepDescription) {
    // Complete previous step if exists
    if (this.currentStepName) {
      this.completeCurrentStep('PASSED');
    }

    // Start new step
    this.currentStepName = this.mapStepToJourney(stepDescription);
    this.stepStartTime = Date.now();

    logger.debug(`Started tracking step: ${this.currentStepName}`);
  }

  /**
   * Complete the current step
   */
  completeCurrentStep(status, error = null) {
    if (!this.currentStepName) return;

    const duration = Date.now() - this.stepStartTime;

    const step = {
      name: this.currentStepName,
      status: status,
      duration: duration,
      timestamp: this.stepStartTime
    };

    // Capture error details for failed steps
    if (status === 'FAILED' && error) {
      step.error = {
        message: error.message || 'Unknown error',
        type: error.name || error.constructor?.name || 'Error',
        stack: error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : null
      };
    }

    this.currentJourneySteps.push(step);

    logger.info(`Completed step: ${this.currentStepName} in ${duration}ms with status: ${status}`);
    this.currentStepName = '';
  }

  /**
   * Complete scenario tracking
   */
  completeScenario(finalStatus, error = null) {
    // Complete final step if exists
    if (this.currentStepName) {
      this.completeCurrentStep(finalStatus === 'PASSED' ? 'PASSED' : 'FAILED', error);
    }

    logger.info(`📊 Scenario completed: ${this.currentScenario} - Total steps tracked: ${this.currentJourneySteps.length}`);
  }

  /**
   * Map Cucumber step descriptions to business-friendly journey names
   * Comprehensive mapping for all 20 journeys
   */
  mapStepToJourney(stepDescription) {
    if (!stepDescription) return 'Unknown Step';

    const lowerStep = stepDescription.toLowerCase();

    // ========== JOURNEY 1: HOME PAGE EXPLORATION ==========
    if (lowerStep.includes('navigate to fnp homepage') || lowerStep.includes('i am on the fnp website')) {
      return 'User Authentication: Navigate to Login Page';
    }
    if (lowerStep.includes('dismiss') && lowerStep.includes('notification')) {
      return 'User Authentication: Dismiss Notification Popup';
    }
    if (lowerStep.includes('login with valid credentials')) {
      return 'User Authentication: Click Guest Login';
    }
    if (lowerStep.includes('successfully logged in')) {
      return 'User Authentication: Email Entry';
    }
    if (lowerStep.includes('clear the cart')) {
      return 'Homepage Setup: Clear Cart';
    }
    if (lowerStep.includes('set delivery location')) {
      return 'Homepage Setup: Set Delivery Location';
    }
    if (lowerStep.includes('gift finder')) {
      return 'Product Discovery: Navigate to Gift Finder';
    }
    if (lowerStep.includes('love for pastel carnations') || (lowerStep.includes('select') && lowerStep.includes('carnations'))) {
      return 'Product Selection: Navigate to Carnations';
    }
    if (lowerStep.includes('delivery slot for carnations')) {
      return 'Delivery Setup: Select Date & Time Slot';
    }
    if (lowerStep.includes('add carnations to cart')) {
      return 'Cart Management: Add Product to Cart';
    }
    if (lowerStep.includes('proceed with qr payment for carnations')) {
      return 'Payment Process: Proceed to Payment';
    }
    if (lowerStep.includes('test qr payment method') && lowerStep.includes('carnations')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('completed the home page exploration')) {
      return 'Order Completion: PNC Created Successfully';
    }

    // ========== JOURNEY 2: PAYMENT METHODS TESTING ==========
    if (lowerStep.includes('navigate to cake products')) {
      return 'Product Discovery: Navigate to Cakes Section';
    }
    if (lowerStep.includes('select a cake for purchase')) {
      return 'Product Selection: Select Cake Product';
    }
    if (lowerStep.includes('set delivery date and proceed to payment')) {
      return 'Delivery Setup: Select Date & Time Slot';
    }
    if (lowerStep.includes('should be on the payment page')) {
      return 'Payment Process: Proceed to Payment';
    }
    if (lowerStep.includes('test qr payment method') && !lowerStep.includes('carnations') && !lowerStep.includes('variant') && !lowerStep.includes('coupon')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('test upi payment method')) {
      return 'Payment Process: Test UPI Payment Method';
    }
    if (lowerStep.includes('test card payment method')) {
      return 'Payment Process: Test Card Payment Method';
    }
    if (lowerStep.includes('completed all payment method tests')) {
      return 'Order Completion: All Payment Methods Tested';
    }

    // ========== JOURNEY 3: INTERNATIONAL PHONE NUMBER CHANGE ==========
    if (lowerStep.includes('navigate to my profile')) {
      return 'Profile Management: Navigate to Profile Page';
    }
    if (lowerStep.includes('change my international phone number')) {
      return 'Profile Management: Change International Phone Number';
    }
    if (lowerStep.includes('select a wedding product')) {
      return 'Product Discovery: Navigate to Wedding Section';
    }
    if (lowerStep.includes('set wedding delivery date')) {
      return 'Delivery Setup: Set Wedding Delivery Date';
    }
    if (lowerStep.includes('edit sender phone number')) {
      return 'Address Management: Edit Sender Phone Number';
    }
    if (lowerStep.includes('proceed to wedding payment and cancel')) {
      return 'Payment Process: Proceed and Cancel Payment';
    }
    if (lowerStep.includes('completed the phone number change flow')) {
      return 'Order Completion: Phone Number Change Completed';
    }

    // ========== JOURNEY 4: REMINDER AND FAQ TESTING ==========
    if (lowerStep.includes('navigate to reminder section')) {
      return 'Navigation: Navigate to Reminder Section';
    }
    if (lowerStep.includes('create a new reminder')) {
      return 'Reminder Management: Create New Reminder';
    }
    if (lowerStep.includes('schedule a gift')) {
      return 'Reminder Management: Schedule Gift';
    }
    if (lowerStep.includes('navigate to faq section')) {
      return 'Navigation: Navigate to FAQ Section';
    }
    if (lowerStep.includes('explore faq categories')) {
      return 'FAQ Management: Explore FAQ Categories';
    }
    if (lowerStep.includes('completed the reminder and faq flow')) {
      return 'Order Completion: Reminder and FAQ Flow Completed';
    }

    // ========== JOURNEY 5: INTERNATIONAL PURCHASE ==========
    if (lowerStep.includes('navigate to international section') && !lowerStep.includes('cart')) {
      return 'Navigation: Navigate to International Section';
    }
    if (lowerStep.includes('select birthday category')) {
      return 'Location Setup: Select UAE as Destination';
    }
    if (lowerStep.includes('set international delivery location')) {
      return 'Location Setup: Set International Delivery Location';
    }
    if (lowerStep.includes('select international product') && !lowerStep.includes('anniversary')) {
      return 'Product Selection: Select International Product';
    }
    if (lowerStep.includes('set international delivery date') && !lowerStep.includes('anniversary')) {
      return 'Delivery Setup: Set International Delivery Date';
    }
    if (lowerStep.includes('add international product to cart') && !lowerStep.includes('checkout')) {
      return 'Cart Management: Add International Product to Cart';
    }
    if (lowerStep.includes('test international payment')) {
      return 'Payment Process: Test International Payment';
    }
    if (lowerStep.includes('completed the international purchase flow')) {
      return 'Order Completion: International Purchase Completed';
    }

    // ========== JOURNEY 6: DA PAGE MODIFICATION ==========
    if (lowerStep.includes('navigate to fnp homepage for da journey')) {
      return 'User Authentication: Navigate to Login Page';
    }
    if (lowerStep.includes('select golden hour product')) {
      return 'Product Selection: Select Golden Hour Product';
    }
    if (lowerStep.includes('set initial delivery date and time')) {
      return 'Delivery Setup: Set Initial Delivery Date';
    }
    if (lowerStep.includes('add product to cart and continue')) {
      return 'Cart Management: Add Product and Continue';
    }
    if (lowerStep.includes('modify delivery information')) {
      return 'Delivery Management: Modify Delivery Information';
    }
    if (lowerStep.includes('add frequent add-ons')) {
      return 'Add-on Management: Add Frequent Add-ons';
    }
    if (lowerStep.includes('add new delivery address')) {
      return 'Address Management: Add New Delivery Address';
    }
    if (lowerStep.includes('handle ordering for myself')) {
      return 'Address Management: Handle Ordering Options';
    }
    if (lowerStep.includes('fill address details')) {
      return 'Address Management: Fill Address Details';
    }
    if (lowerStep.includes('save and deliver')) {
      return 'Address Management: Save Address';
    }
    if (lowerStep.includes('edit sender name')) {
      return 'Address Management: Edit Sender Information';
    }
    if (lowerStep.includes('delete the address')) {
      return 'Address Management: Delete Address';
    }
    if (lowerStep.includes('proceed to payment and cancel')) {
      return 'Payment Process: Proceed and Cancel Payment';
    }
    if (lowerStep.includes('completed the da page modification flow')) {
      return 'Order Completion: DA Page Modification Completed';
    }

    // ========== JOURNEY 7: COMBINATIONAL PURCHASE ==========
    if (lowerStep.includes('navigate to fnp homepage for combinational')) {
      return 'User Authentication: Navigate to Login Page';
    }
    if (lowerStep.includes('navigate to domestic anniversary product')) {
      return 'Product Selection: Navigate to Anniversary Product';
    }
    if (lowerStep.includes('select domestic anniversary product')) {
      return 'Product Selection: Select Domestic Product';
    }
    if (lowerStep.includes('set domestic delivery date')) {
      return 'Delivery Setup: Set Domestic Delivery Date';
    }
    if (lowerStep.includes('add domestic product to cart')) {
      return 'Cart Management: Add Domestic Product to Cart';
    }
    if (lowerStep.includes('navigate to international section from cart')) {
      return 'Navigation: Navigate to International Section';
    }
    if (lowerStep.includes('set usa delivery location')) {
      return 'Location Setup: Select USA as Destination';
    }
    if (lowerStep.includes('navigate to international anniversary section')) {
      return 'Product Selection: Navigate to International Section';
    }
    if (lowerStep.includes('select international anniversary product')) {
      return 'Product Selection: Select International Anniversary Product';
    }
    if (lowerStep.includes('add international product to cart and checkout')) {
      return 'Cart Management: Add International Product and Checkout';
    }
    if (lowerStep.includes('test combinational payment')) {
      return 'Payment Process: Test Combinational Payment';
    }
    if (lowerStep.includes('completed the combinational purchase flow')) {
      return 'Order Completion: Combinational Purchase Completed';
    }

    // ========== JOURNEY 8: ADD-ON TESTING ==========
    if (lowerStep.includes('navigate to fnp homepage for addon')) {
      return 'User Authentication: Navigate to Login Page';
    }
    if (lowerStep.includes('navigate to timeless love product')) {
      return 'Navigation: Navigate to Timeless Love Product';
    }
    if (lowerStep.includes('set delivery date for addon product')) {
      return 'Delivery Setup: Set Delivery Date for Addon Product';
    }
    if (lowerStep.includes('test add-on functionality on pdp')) {
      return 'Add-on Testing: Test Add-on Functionality on PDP';
    }
    if (lowerStep.includes('add product with addons to cart')) {
      return 'Cart Management: Add Product with Addons to Cart';
    }
    if (lowerStep.includes('add extra special addons')) {
      return 'Add-on Management: Add Extra Special Addons';
    }
    if (lowerStep.includes('test payment with addons')) {
      return 'Payment Process: Test Payment with Addons';
    }
    if (lowerStep.includes('navigate to qatar gifts page')) {
      return 'International Testing: Navigate to Qatar Gifts Page';
    }
    if (lowerStep.includes('set qatar delivery location')) {
      return 'Location Setup: Set Qatar Delivery Location';
    }
    if (lowerStep.includes('select qatar birthday product')) {
      return 'Product Selection: Select Qatar Birthday Product';
    }
    if (lowerStep.includes('set qatar delivery date with midnight')) {
      return 'Delivery Setup: Set Qatar Delivery Date with Midnight';
    }
    if (lowerStep.includes('add qatar product add-ons')) {
      return 'Add-on Management: Add Qatar Product Add-ons';
    }
    if (lowerStep.includes('process qatar checkout and payment')) {
      return 'Payment Process: Process Qatar Checkout and Payment';
    }
    if (lowerStep.includes('completed the addon testing flow')) {
      return 'Order Completion: ADD-On Testing Completed';
    }

    // ========== JOURNEY 9: CAKE VARIANT TESTING ==========
    if (lowerStep.includes('navigate to fnp homepage for cake variant')) {
      return 'User Authentication: Navigate to Login Page';
    }
    if (lowerStep.includes('navigate to fudge brownie cake')) {
      return 'Navigation: Navigate to Fudge Brownie Cake Product';
    }
    if (lowerStep.includes('set cake variant delivery date')) {
      return 'Delivery Setup: Set Cake Variant Delivery Date';
    }
    if (lowerStep.includes('change the cake variant')) {
      return 'Variant Testing: Change the Cake Variant';
    }
    if (lowerStep.includes('set cake variant delivery and proceed')) {
      return 'Payment Process: Proceed to Payment';
    }
    if (lowerStep.includes('test qr payment for cake variant')) {
      return 'Payment Process: Test QR Payment for Cake Variant';
    }
    if (lowerStep.includes('completed the cake variant testing flow')) {
      return 'Order Completion: Cake Variant Testing Completed';
    }

    // ========== JOURNEY 10: COUPON TESTING ==========
    if (lowerStep.includes('navigate to fnp homepage for coupon')) {
      return 'User Authentication: Navigate to Login Page';
    }
    if (lowerStep.includes('navigate to product for invalid coupon')) {
      return 'Navigation: Navigate to Chocolate Truffle Cake Product';
    }
    if (lowerStep.includes('add product to cart for invalid coupon')) {
      return 'Cart Management: Add Product to Cart';
    }
    if (lowerStep.includes('test invalid coupon code')) {
      return 'Coupon Testing: Apply Invalid Coupon Code (INVALID10)';
    }
    if (lowerStep.includes('navigate and add product to cart for valid coupon')) {
      return 'Navigation: Navigate to Chocolate Truffle Cake Product';
    }
    if (lowerStep.includes('test valid coupon code')) {
      return 'Coupon Testing: Apply Valid Coupon Code (GIFT10)';
    }
    if (lowerStep.includes('proceed to payment with coupon')) {
      return 'Payment Process: Proceed to Payment';
    }
    if (lowerStep.includes('test payment flow with coupon')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('completed the coupon testing flow')) {
      return 'Order Completion: Coupon Testing Completed';
    }

    // ========== JOURNEY 11: PERSONALIZED TEXT PRODUCT ==========
    if (lowerStep.includes('navigate back to homepage after journey 10')) {
      return 'Navigation: Return to Homepage';
    }
    if (lowerStep.includes('navigate to personalized text product') || lowerStep.includes('personalized water bottle')) {
      return 'Navigation: Navigate to Personalized Water Bottle';
    }
    if (lowerStep.includes('add personalized text')) {
      return 'Personalization: Add Custom Text "ASTHA SINGH"';
    }
    if (lowerStep.includes('add personalized product to cart') && !lowerStep.includes('photo')) {
      return 'Cart Management: Add Personalized Product to Cart';
    }
    if (lowerStep.includes('proceed to payment for personalized product')) {
      return 'Payment Process: Proceed to Payment Page';
    }
    if (lowerStep.includes('test payment flow for personalized product')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('navigate back to homepage after journey 11')) {
      return 'Navigation: Navigate Back to Homepage';
    }
    if (lowerStep.includes('completed the personalized text product purchase flow')) {
      return 'Order Completion: Personalized Purchase Completed';
    }

    // ========== JOURNEY 12: MESSAGE CARD INTEGRATION ==========
    if (lowerStep.includes('navigate to message card product') || lowerStep.includes('celebration bento')) {
      return 'Navigation: Navigate to Celebration Bento Cake';
    }
    if (lowerStep.includes('set delivery date for message card')) {
      return 'Delivery Setup: Set Delivery Date and Time';
    }
    if (lowerStep.includes('add message card to cart')) {
      return 'Message Card: Add Free Message Card with Custom Text';
    }
    if (lowerStep.includes('proceed to payment for message card')) {
      return 'Payment Process: Proceed to Payment Page';
    }
    if (lowerStep.includes('test payment flow for message card')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('navigate back to homepage after journey 12')) {
      return 'Navigation: Return to Homepage';
    }
    if (lowerStep.includes('completed the message card purchase flow')) {
      return 'Order Completion: Message Card Purchase Completed';
    }

    // ========== JOURNEY 13: PRODUCT EXPLORATION ==========
    if (lowerStep.includes('explore different product categories') || lowerStep.includes('exotic blue orchid')) {
      return 'Product Navigation: Navigate to Exotic Blue Orchid';
    }
    if (lowerStep.includes('browse through various product sections')) {
      return 'Photo Gallery: Open Main Product Image';
    }
    if (lowerStep.includes('check product details and reviews')) {
      return 'Product Details: Check Description & Instructions';
    }
    if (lowerStep.includes('completed the product exploration journey')) {
      return 'Order Completion: Product Exploration Completed';
    }

    // ========== JOURNEY 14: SAME SKU PRODUCT EXPLORATION ==========
    if (lowerStep.includes('explore same sku product') || lowerStep.includes('jade plant')) {
      return 'Product Navigation: Navigate to Jade Plant Product';
    }
    if (lowerStep.includes('validate product sku consistency')) {
      return 'Delivery Setup: Set Courier Delivery Date & Time Slot';
    }
    if (lowerStep.includes('compare product details and variants')) {
      return 'Cart Management: Add Product to Cart (Courier)';
    }
    if (lowerStep.includes('completed the same sku exploration journey')) {
      return 'Order Completion: Same SKU Exploration Completed';
    }

    // ========== JOURNEY 15: SEARCH BASED PURCHASE ==========
    if (lowerStep.includes('search for cake products')) {
      return 'Search Function: Search for "cake" in Search Bar';
    }
    if (lowerStep.includes('set delivery date and time for search product')) {
      return 'Delivery Setup: Set Delivery Date & Time Slot';
    }
    if (lowerStep.includes('add search product to cart')) {
      return 'Cart Management: Add Search Product to Cart';
    }
    if (lowerStep.includes('test payment for search product')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('completed the search based purchase flow')) {
      return 'Order Completion: Search Based Purchase Completed';
    }

    // ========== JOURNEY 16: PERSONALIZED PHOTO UPLOAD ==========
    if (lowerStep.includes('navigate to personalized cushion')) {
      return 'Navigation: Navigate to Personalized Cushion Product';
    }
    if (lowerStep.includes('upload a photo to the product')) {
      return 'Photo Upload: Upload Custom Photo from Local Path';
    }
    if (lowerStep.includes('add the personalized product to cart')) {
      return 'Cart Management: Add Personalized Product to Cart';
    }
    if (lowerStep.includes('test payment for personalized product')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('navigate back to homepage after journey 16')) {
      return 'Navigation: Navigate Back to Homepage';
    }
    if (lowerStep.includes('navigate to fridge magnet')) {
      return 'Navigation: Navigate to Fridge Magnet Product';
    }
    if (lowerStep.includes('set delivery date and time for fridge magnet')) {
      return 'Delivery Setup: Set Delivery Date (15th) & Time Slot (8-9 AM)';
    }
    if (lowerStep.includes('upload four photos')) {
      return 'Photo Upload: Upload 4 Custom Photos (photo1-4.jpg)';
    }
    if (lowerStep.includes('add fridge magnet to cart')) {
      return 'Cart Management: Add Fridge Magnet to Cart';
    }
    if (lowerStep.includes('test payment for fridge magnet')) {
      return 'Payment Process: Test QR Payment Method';
    }
    if (lowerStep.includes('completed the personalized photo upload journey')) {
      return 'Order Completion: Multi-Photo Upload Journey Completed';
    }

    // ========== JOURNEY 17: LOCATION TESTING ==========
    if (lowerStep.includes('navigate to homepage for location journey')) {
      return 'Navigation: Navigate to Homepage for Location Journey';
    }
    if (lowerStep.includes('select new pincode gurgaon')) {
      return 'Location Change: Select New Pincode Gurgaon';
    }
    if (lowerStep.includes('select delhi location')) {
      return 'Location Change: Select Delhi Location';
    }
    if (lowerStep.includes('navigate to plp and select existing bangalore')) {
      return 'Navigation: Navigate to PLP and Select Existing Bangalore Pincode';
    }
    if (lowerStep.includes('select gorakhpur pincode')) {
      return 'Location Change: Select Gorakhpur Pincode';
    }
    if (lowerStep.includes('select final bangalore location')) {
      return 'Location Change: Select Final Bangalore Location';
    }
    if (lowerStep.includes('return to homepage after location testing')) {
      return 'Navigation: Return to Homepage After Location Testing';
    }
    if (lowerStep.includes('completed the location testing flow')) {
      return 'Order Completion: Location Testing Completed';
    }

    // ========== JOURNEY 18: SPHERICAL HOME PAGE ICON EXPLORATION ==========
    if (lowerStep.includes('navigate to homepage for spherical icon')) {
      return 'Navigation: Navigate to Homepage for Icon Exploration';
    }
    if (lowerStep.includes('explore category icons')) {
      return 'Category Navigation: Explore Spherical Icons';
    }
    if (lowerStep.includes('completed the spherical icon exploration journey')) {
      return 'Order Completion: Spherical Icon Exploration Completed';
    }

    // ========== JOURNEY 20: GMAIL OTP LOGIN ==========
    if (lowerStep.includes('i am on the login page for gmail otp')) {
      return 'Gmail OTP Journey: Navigate to Login Page';
    }
    if (lowerStep.includes('log out if already logged in')) {
      return 'Gmail OTP Journey: Logout If Already Logged In';
    }
    if (lowerStep.includes('open the account drawer')) {
      return 'Gmail OTP Journey: Open Account Drawer';
    }
    if (lowerStep.includes('login using gmail otp')) {
      return 'Gmail OTP Journey: Perform Gmail OTP Login';
    }
    if (lowerStep.includes('should be logged in via gmail otp')) {
      return 'Gmail OTP Journey: Verify Login Success';
    }

    // ========== COMMON STEPS ==========
    if (lowerStep.includes('navigate back to homepage') && !lowerStep.includes('journey')) {
      return 'Navigation: Return to Homepage';
    }
    if (lowerStep.includes('completed all') && lowerStep.includes('journeys successfully')) {
      return 'Order Completion: All Journeys Completed Successfully';
    }

    // Default cleanup for unmapped steps
    return `Journey Step: ${this.capitalizeWords(stepDescription)}`;
  }

  /**
   * Capitalize words for better presentation
   */
  capitalizeWords(text) {
    if (!text) return text;

    const words = text.split(/\s+/);
    return words
      .map(word => {
        if (word.length > 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
      })
      .join(' ');
  }

  /**
   * Get current journey steps (for external access)
   */
  getCurrentJourneySteps() {
    return [...this.currentJourneySteps];
  }

  /**
   * Clear tracking data
   */
  clear() {
    this.currentJourneySteps = [];
    this.currentStepName = '';
    this.stepStartTime = 0;
  }
}

// Singleton instance
const stepTracker = new StepTracker();

module.exports = { StepTracker, stepTracker };

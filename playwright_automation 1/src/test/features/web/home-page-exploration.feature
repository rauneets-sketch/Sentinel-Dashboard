Feature: Complete User Journey - Home Page Exploration, Payment Testing, International Phone Number Change, Reminder FAQ, International Purchase, DA Page Modification, Combinational Purchase, ADD-On Edge Case Testing, Cake Variant Testing, Coupon Testing, Personalized Water Bottle Purchase, Message Card Purchase, Comprehensive Product Exploration, Same SKU Product Exploration, Search Based Purchase, Personalized Photo Upload, Location Testing, Spherical Home Page Icon Exploration, and Gmail OTP Login (Journey 19 - Payment from Order Page - COMMENTED OUT)
  As a user of FNP website
  I want to explore the home page, test payment methods, verify checkout login flow, test reminder and FAQ features, complete international purchase, test delivery address modification, test combinational purchases, test ADD-On edge case functionality on PDP, test cake variant functionality, test coupon functionality, test personalized water bottle purchase with custom text, test message card purchase with custom message, perform comprehensive product exploration with photo gallery testing, validate same SKU product variations, test search based purchase functionality, test personalized photo upload, perform location testing across different pincodes, explore spherical/circular icons on homepage, and test Gmail-based OTP login functionality (Journey 19 - Payment from Order Page - COMMENTED OUT)
  So that I can navigate through sections and complete purchase flows with comprehensive validation including detailed product interaction, SKU consistency validation, search functionality testing, photo personalization, location management, spherical icon exploration, and Gmail OTP authentication (Journey 19 - Payment from Order Page - COMMENTED OUT)

  Background:
    Given I am on the FNP website

  @smoke @complete-journey
  Scenario: Complete Nineteen Journey Flow (Journey 19 - Payment from Order Page - COMMENTED OUT)
    # Journey 1: Home Page Exploration
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I clear the cart
    And I set delivery location
    And I use the gift finder feature
    And I select Love For Pastel Carnations product
    And I select delivery slot for carnations
    And I add carnations to cart
    And I proceed with QR payment for carnations
    Then I should have completed the home page exploration
    
    # Journey 2: Payment Methods Testing
    When I navigate to cake products
    And I select a cake for purchase
    And I set delivery date and proceed to payment
    Then I should be on the payment page
    
    When I test QR payment method
    And I test UPI payment method
    And I test card payment method
    Then I should have completed all payment method tests
    
    # Journey 3: International Phone Number Change
    When I navigate to my profile
    And I change my international phone number
    And I navigate back to homepage
    And I select a wedding product
    And I set wedding delivery date and add to cart
    And I edit sender phone number in DA page
    And I proceed to wedding payment and cancel
    Then I should have completed the phone number change flow
    
    # Journey 4: Reminder and FAQ Testing
    When I navigate to reminder section
    And I create a new reminder
    # And I edit the reminder
    # And I delete the reminder
    And I schedule a gift
    And I navigate to FAQ section
    And I explore FAQ categories
    Then I should have completed the reminder and FAQ flow
    
    # Journey 5: International Cake Purchase
    When I navigate to international section
    And I select birthday category
    And I set international delivery location
    And I select international product
    And I set international delivery date and explore details
    And I add international product to cart
    And I test international payment
    Then I should have completed the international purchase flow
    
    # Journey 6: DA Page Modification
    When I navigate to FNP homepage for DA journey
    And I select Golden Hour product
    And I set initial delivery date and time
    And I add product to cart and continue
    And I modify delivery information
    And I add frequent add-ons
    And I add new delivery address
    And I handle ordering for myself options
    And I fill address details
    And I save and deliver to new address
    And I edit sender name information
    And I delete the address
    And I proceed to payment and cancel
    Then I should have completed the DA page modification flow
    
    # Journey 7: Domestic and International Combinational Purchase
    When I navigate to FNP homepage for combinational journey
    And I navigate to domestic anniversary product
    And I select domestic anniversary product
    And I set domestic delivery date
    And I add domestic product to cart
    And I navigate to international section from cart
    And I set USA delivery location
    And I navigate to international anniversary section
    And I select international anniversary product
    And I set international delivery date
    And I add international product to cart and checkout
    And I test combinational payment for both products
    Then I should have completed the combinational purchase flow
    
    # Journey 8: ADD-On Testing on PDP
    When I navigate to FNP homepage for addon journey
    And I navigate to Timeless Love product
    And I set delivery date for addon product
    And I test add-on functionality on PDP
    And I add product with addons to cart
    And I add extra special addons in cart
    And I test payment with addons
    And I navigate to Qatar gifts page
    And I set Qatar delivery location
    And I select Qatar birthday product
    And I set Qatar delivery date with midnight delivery
    And I add Qatar product add-ons
    And I process Qatar checkout and payment
    Then I should have completed the addon testing flow
    
    # Journey 9: Cake Variant Testing
    When I navigate to FNP homepage for cake variant journey
    And I navigate to Fudge Brownie Cake product
    And I set cake variant delivery date and add to cart with add-ons
    And I change the cake variant
    And I set cake variant delivery and proceed to payment
    And I test QR payment for cake variant
    Then I should have completed the cake variant testing flow
    
    # Journey 10A: Invalid Coupon Testing
    When I navigate to FNP homepage for coupon journey
    And I navigate to product for invalid coupon testing
    And I add product to cart for invalid coupon testing
    And I test invalid coupon code
    
    # Journey 10B: Valid Coupon Testing
    And I navigate and add product to cart for valid coupon testing
    And I test valid coupon code
    And I proceed to payment with coupon
    And I test payment flow with coupon applied
    Then I should have completed the coupon testing flow
    
    # Navigate back to homepage after Journey 10
    When I navigate back to homepage after Journey 10
    
    # Journey 11: Personalized Water Bottle Purchase (with delivery date handling)
    And I navigate to personalized text product
    And I add personalized text to the product
    And I add personalized product to cart
    And I proceed to payment for personalized product
    And I test payment flow for personalized product
    And I navigate back to homepage after Journey 11
    Then I should have completed the personalized text product purchase flow
    
    # Navigate back to homepage after Journey 11
    When I navigate back to homepage after Journey 11
    
    # Journey 12: Celebration Bento Cake Purchase
    And I navigate to message card product
    And I set delivery date for message card
    And I add message card to cart
    And I proceed to payment for message card
    And I test payment flow for message card
    And I navigate back to homepage after Journey 12
    Then I should have completed the message card purchase flow
    
    # Journey 13: Comprehensive Product Exploration Journey
    When I explore different product categories
    And I browse through various product sections
    And I check product details and reviews
    And I navigate back to FNP homepage
    Then I should have completed the product exploration journey
    
    # Journey 14: Same SKU Product Exploration Journey
    When I explore same SKU product variations
    And I validate product SKU consistency
    And I compare product details and variants
    And I navigate back to FNP homepage
    Then I should have completed the same SKU exploration journey
    
    # Journey 15: Search Based Purchase
    When I search for cake products
    And I set delivery date and time for search product
    And I add search product to cart
    And I test payment for search product
    Then I should have completed the search based purchase flow
    
    # Journey 16: Personalized Photo Upload
    When I navigate to personalized cushion product
    And I upload a photo to the product
    And I add the personalized product to cart
    And I test payment for personalized product
    And I navigate back to homepage after Journey 16
    And I navigate to fridge magnet product
    And I set delivery date and time for fridge magnet
    And I upload four photos to fridge magnet
    And I add fridge magnet to cart
    And I test payment for fridge magnet
    Then I should have completed the personalized photo upload journey
    
    # Journey 17: Location Testing
    When I navigate to homepage for location journey
    And I select new pincode Gurgaon
    And I select Delhi location
    And I navigate to PLP and select existing Bangalore pincode
    And I select Gorakhpur pincode
    And I select final Bangalore location
    And I return to homepage after location testing
    Then I should have completed the location testing flow
    
    # Journey 18: Spherical Home Page Icon Exploration
    When I navigate to homepage for spherical icon exploration
    And I explore category icons
    Then I should have completed the spherical icon exploration journey
    
    # Journey 19: Payment from Order Page - COMMENTED OUT
    # When I navigate to homepage for order page payment journey
    # Then I should have completed the order page payment journey
    
    # Journey 20: Gmail OTP Login
    Given I am on the login page for gmail otp
    When I log out if already logged in
    And I open the account drawer
    And I login using gmail otp
    Then I should be logged in via gmail otp
    
    Then I should have completed all nineteen journeys successfully
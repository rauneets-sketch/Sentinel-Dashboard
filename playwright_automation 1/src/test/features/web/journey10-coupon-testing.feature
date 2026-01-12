Feature: Journey 10 - Coupon Testing (Invalid and Valid)
  As a user
  I want to test coupon functionality
  So that I can verify both invalid and valid coupon scenarios

  @journey10A @invalid-coupon-testing
  Scenario: Journey 10A - Invalid coupon testing
    Given I am on the FNP website
    When I navigate to FNP homepage for coupon journey
    And I navigate to product for invalid coupon testing
    And I add product to cart for invalid coupon testing
    And I test invalid coupon code
    
  @journey10B @valid-coupon-testing
  Scenario: Journey 10B - Valid coupon testing
    Given I am on the FNP website
    When I navigate to FNP homepage for coupon journey
    And I navigate and add product to cart for valid coupon testing
    And I test valid coupon code
    And I proceed to payment with coupon
    And I test payment flow with coupon applied
    Then I should have completed the coupon testing flow
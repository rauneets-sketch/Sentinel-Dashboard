Feature: Journey 9 - Cake Variant Testing
  As a user of FNP website
  I want to test cake variant functionality
  So that I can verify variant selection and purchase flow

  Background:
    Given I am on the FNP website

  @journey9 @cake-variant
  Scenario: Cake Variant Testing Flow
    # Journey 9: Cake Variant Testing
    When I navigate to FNP homepage for cake variant journey
    And I navigate to Fudge Brownie Cake product
    And I set cake variant delivery date and add to cart
    And I change the cake variant
    And I set cake variant delivery and proceed to payment
    And I test QR payment for cake variant
    Then I should have completed the cake variant testing flow

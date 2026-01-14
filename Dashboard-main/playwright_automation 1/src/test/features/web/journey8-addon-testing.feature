Feature: Journey 8 - ADD-On Edge Case Testing on PDP
  As a user of FNP website
  I want to test ADD-On functionality on Product Detail Page
  So that I can verify add-on features work correctly

  Background:
    Given I am on the FNP website

  @journey8 @addon-testing
  Scenario: Journey 8 - ADD-On Testing Flow
    # Setup - Login and prepare
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
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
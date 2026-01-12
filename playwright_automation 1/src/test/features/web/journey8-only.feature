Feature: Journey 8 - ADD-On Testing on PDP
  As a user of FNP website
  I want to test ADD-On functionality on Product Detail Page
  So that I can validate add-on behavior

  Background:
    Given I am on the FNP website

  @journey8 @addon-testing
  Scenario: Journey 8 ADD-On Testing
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I navigate to FNP homepage for addon journey
    And I navigate to Timeless Love product
    And I set delivery date for addon product
    And I test add-on functionality on PDP
    And I add product with addons to cart
    And I test payment with addons
    Then I should have completed the addon testing flow
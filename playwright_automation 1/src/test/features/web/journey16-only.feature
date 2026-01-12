Feature: Journey 16 - Personalized Photo Upload
  As a user of FNP website
  I want to test personalized photo upload functionality
  So that I can validate this specific user journey

  Background:
    Given I am on the FNP website

  @smoke @journey16
  Scenario: Journey 16 - Personalized Photo Upload Flow
    # Setup - Login and Clear Cart
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I clear the cart
    And I set delivery location
    
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
Feature: Journey 15-17 - Search Purchase, Photo Upload, and Location Testing
  As a user of FNP website
  I want to test search functionality, photo upload, and location testing
  So that I can validate these specific user journeys

  Background:
    Given I am on the FNP website

  @smoke @journey15-17
  Scenario: Journey 15-17 Flow
    # Setup - Login and Clear Cart
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I clear the cart
    And I set delivery location
    
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
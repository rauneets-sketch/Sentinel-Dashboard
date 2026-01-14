Feature: Journey 12-16 - Message Card, Product Exploration, Same SKU, Search Purchase, and Photo Upload
  As a user of FNP website
  I want to test message card integration, product exploration, same SKU validation, search functionality, and photo upload
  So that I can validate these specific user journeys

  Background:
    Given I am on the FNP website

  @smoke @journey12-16
  Scenario: Journey 12-16 Flow
    # Setup - Login and Clear Cart
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I clear the cart
    And I set delivery location
    
    # Journey 12: Message Card Integration
    When I navigate to message card product
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
Feature: Journey 17-19 Testing - Location Testing, Spherical Icon Exploration, and Payment from Order Page
  As a user of FNP website
  I want to test location changes, explore spherical icons, and test payment from order page
  So that I can validate location functionality, icon navigation, and order page payment flow

  Background:
    Given I am on the FNP website

  @smoke @journey17-19
  Scenario: Journey 17-19 Flow
    # Initial Setup
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I clear the cart
    And I set delivery location
    
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
    
    # Journey 19: Payment from Order Page
    When I navigate to homepage for order page payment journey
    Then I should have completed the order page payment journey
    
    Then I should have completed all three journeys successfully
Feature: Journey 18 and 20 Testing
  As a user of FNP website
  I want to test spherical icon exploration and Gmail OTP login
  So that I can validate these specific functionalities

  Background:
    Given I am on the FNP website

  @smoke @journey18-20
  Scenario: Journey 18 and 20 Testing Flow
    # Initial Setup
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I clear the cart
    And I set delivery location
    
    # Journey 18: Spherical Home Page Icon Exploration
    When I navigate to homepage for spherical icon exploration
    And I explore category icons
    Then I should have completed the spherical icon exploration journey
    
    # Journey 20: Gmail OTP Login
    Given I am on the login page for gmail otp
    When I log out if already logged in
    And I open the account drawer
    And I login using gmail otp
    Then I should be logged in via gmail otp
    
    Then I should have completed Journey 18 and 20 successfully
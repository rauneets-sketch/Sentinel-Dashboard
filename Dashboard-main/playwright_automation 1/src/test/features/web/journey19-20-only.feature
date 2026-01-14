Feature: Journey 19-20 Testing - Payment from Order Page and Gmail OTP Login
  As a user of FNP website
  I want to test payment from order page and Gmail OTP login
  So that I can validate order page payment flow and Gmail-based OTP login functionality

  Background:
    Given I am on the FNP website

  @smoke @journey19-20
  Scenario: Journey 19-20 Flow
    # Initial Setup (login and cart clearing for Journey 19)
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    And I login with valid credentials
    Then I should be successfully logged in
    
    When I clear the cart
    And I set delivery location
    
    # Journey 19: Payment from Order Page
    When I navigate to homepage for order page payment journey
    Then I should have completed the order page payment journey
    
    # Journey 20: Gmail OTP Login
    Given I am on the login page for gmail otp
    When I log out if already logged in
    And I open the account drawer
    And I login using gmail otp
    Then I should be logged in via gmail otp
    When I log out after gmail otp login
    
    Then I should have completed all twenty journeys successfully


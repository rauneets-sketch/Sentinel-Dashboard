Feature: Journey 20 - Gmail OTP Login
  As a user of FNP website
  I want to login using Gmail OTP authentication
  So that I can verify the Gmail-based OTP login functionality

  Background:
    Given I am on the FNP website

  @smoke @gmail-otp-login @journey20
  Scenario: Complete Gmail OTP Login Journey
    # Journey 20: Gmail OTP Login
    Given I am on the login page for gmail otp
    When I log out if already logged in
    And I open the account drawer
    And I login using gmail otp
    Then I should be logged in via gmail otp
    When I log out after gmail otp login


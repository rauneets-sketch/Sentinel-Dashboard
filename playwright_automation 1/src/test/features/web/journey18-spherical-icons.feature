Feature: Journey 18 - Spherical Home Page Icon Exploration

  Background:
    Given I am on the FNP website
    Given I navigate to FNP homepage
    When I dismiss the notification popup
    When I login with valid credentials
    Then I should be successfully logged in
    When I clear the cart
    When I set delivery location

  Scenario: Journey 18 - Explore spherical category icons on homepage
    When I navigate to FNP homepage for spherical icon exploration
    And I explore category icons
    Then I should have completed the spherical icon exploration journey

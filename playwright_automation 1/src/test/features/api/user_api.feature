@api
Feature: User API
  Scenario: Get user details
    Given I have a valid API endpoint
    When I send a GET request to "/users/1"
    Then I should receive a 200 status code
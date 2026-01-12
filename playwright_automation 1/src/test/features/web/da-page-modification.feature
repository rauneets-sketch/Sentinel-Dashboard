Feature: DA Page Modification Journey
  As a user of FNP website
  I want to modify delivery address information during checkout
  So that I can update delivery details and sender information

  Background:
    Given I am on the FNP website

  @smoke @da-journey
  Scenario: DA Page Modification Flow
    Given I navigate to FNP homepage for DA journey
    When I navigate to FNP Luxe section
    And I navigate to same day luxury gifts
    And I select Golden Hour product
    And I set initial delivery date and time
    And I add product to cart and continue
    And I modify delivery information
    And I add frequent add-ons
    And I handle ordering for myself options
    And I add new delivery address
    And I fill address details
    And I save and deliver to new address
    And I edit sender name information
    Then I should have completed the DA page modification flow
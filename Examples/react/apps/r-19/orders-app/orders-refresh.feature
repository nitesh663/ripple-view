Feature: Orders app refresh

  @pass
  Scenario: Refreshing the orders list updates the readout
    Given I am on route "/"
    When I activate the button "Refresh"
    Then the text "Refreshed 1 time(s)" is shown

  @fail
  Scenario: Refresh button is wrongly asserted disabled
    Given I am on route "/"
    Then the button "Refresh" is disabled

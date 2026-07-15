@smoke
Feature: Grid sorting

  @regression @sort
  Scenario: Sort by name ascending
    Given a grid with at least 3 rows
    When I activate the button "Sort by Name"
    Then the text "Alice" is shown

  @sort
  Scenario: Sort by date descending
    Given a grid with at least 3 rows
    When I activate the button "Sort by Date"
    Then the text "2026-01-01" is shown

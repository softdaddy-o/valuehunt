/**
 * E2E tests for backtesting feature
 */
import { test, expect } from '@playwright/test';

test.describe('Backtest Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to backtest page
    await page.goto('http://localhost:3000/backtest');
  });

  test('should display backtest page with summary cards', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'Backtesting' })).toBeVisible();

    // Check description
    await expect(
      page.getByText('Test AI stock recommendations using historical data')
    ).toBeVisible();

    // Check New Backtest button
    await expect(page.getByRole('button', { name: /new backtest/i })).toBeVisible();
  });

  test('should open create backtest dialog', async ({ page }) => {
    // Click New Backtest button
    await page.getByRole('button', { name: /new backtest/i }).click();

    // Check dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create New Backtest')).toBeVisible();

    // Check form fields
    await expect(page.getByLabel('Backtest Name')).toBeVisible();
    await expect(page.getByLabel('Strategy Type')).toBeVisible();
    await expect(page.getByLabel('Market')).toBeVisible();
    await expect(page.getByLabel('Start Date')).toBeVisible();
    await expect(page.getByLabel('End Date')).toBeVisible();
    await expect(page.getByLabel('Lookback Years')).toBeVisible();
    await expect(page.getByLabel('Holding Period')).toBeVisible();
    await expect(page.getByLabel('Test Frequency')).toBeVisible();
  });

  test('should fill and submit backtest creation form', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /new backtest/i }).click();

    // Fill in form
    await page.getByLabel('Backtest Name').fill('Test 5-Year Backtest');

    // Select strategy
    await page.getByLabel('Strategy Type').click();
    await page.getByRole('option', { name: 'Value Score Only' }).click();

    // Select market
    await page.getByLabel('Market').click();
    await page.getByRole('option', { name: 'KOSPI' }).click();

    // Fill dates
    await page.getByLabel('Start Date').fill('2019-01-01');
    await page.getByLabel('End Date').fill('2024-01-01');

    // Select lookback years
    await page.getByLabel('Lookback Years').click();
    await page.getByRole('option', { name: '5 Years' }).click();

    // Select holding period
    await page.getByLabel('Holding Period').click();
    await page.getByRole('option', { name: '12 Months' }).click();

    // Select frequency
    await page.getByLabel('Test Frequency').click();
    await page.getByRole('option', { name: 'Monthly' }).click();

    // Submit form
    const createButton = page.getByRole('button', { name: /create & run/i });
    await expect(createButton).toBeEnabled();

    // Note: We don't actually submit to avoid creating real backtests in tests
    // In a real test environment with a test database, we would click and verify
  });

  test('should close create dialog on cancel', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /new backtest/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should display tabs for Backtest Runs and Analytics', async ({ page }) => {
    // Check tabs exist
    await expect(page.getByRole('tab', { name: 'Backtest Runs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Analytics' })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Initially on Backtest Runs tab
    const runsTab = page.getByRole('tab', { name: 'Backtest Runs' });
    await expect(runsTab).toHaveAttribute('aria-selected', 'true');

    // Click Analytics tab
    const analyticsTab = page.getByRole('tab', { name: 'Analytics' });
    await analyticsTab.click();

    // Analytics tab should be selected
    await expect(analyticsTab).toHaveAttribute('aria-selected', 'true');
    await expect(runsTab).toHaveAttribute('aria-selected', 'false');

    // Switch back
    await runsTab.click();
    await expect(runsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should disable create button when name is empty', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /new backtest/i }).click();

    // Create button should be disabled when name is empty
    const createButton = page.getByRole('button', { name: /create & run/i });
    await expect(createButton).toBeDisabled();

    // Enter name
    await page.getByLabel('Backtest Name').fill('Test Backtest');

    // Button should now be enabled
    await expect(createButton).toBeEnabled();
  });
});

test.describe('Backtest List View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/backtest');
  });

  test('should display backtest list table when runs exist', async ({ page }) => {
    // Mock API response with sample data
    await page.route('**/api/v1/backtest/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Test Backtest 1',
            strategy_type: 'UNDERVALUED_SCREENER',
            market: 'KOSPI',
            simulation_date: '2020-01-01T00:00:00',
            status: 'completed',
            total_recommendations: 20,
            avg_return_pct: 15.5,
            win_rate_pct: 70.0,
            alpha_pct: 5.5,
            sharpe_ratio: 1.5,
            created_at: '2024-01-01T00:00:00',
            lookback_years: 5,
            holding_period_months: 12,
          },
        ]),
      });
    });

    // Wait for table to load
    await page.waitForSelector('table');

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Strategy' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Market' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /avg return/i })).toBeVisible();

    // Check data is displayed
    await expect(page.getByText('Test Backtest 1')).toBeVisible();
    await expect(page.getByText('15.5%')).toBeVisible();
  });

  test('should show empty state when no backtests exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/v1/backtest/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.waitForTimeout(1000);

    // Check empty state message
    await expect(page.getByText('No backtests found')).toBeVisible();
  });

  test('should display action buttons for each backtest', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/backtest/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Test Backtest',
            status: 'completed',
            market: 'KOSPI',
            simulation_date: '2020-01-01T00:00:00',
            created_at: '2024-01-01T00:00:00',
            lookback_years: 5,
            holding_period_months: 12,
          },
        ]),
      });
    });

    await page.waitForSelector('table');

    // Check for action buttons (View, Delete)
    const viewButtons = page.getByRole('button', { name: /view/i });
    await expect(viewButtons.first()).toBeVisible();

    const deleteButtons = page.getByRole('button', { name: /delete/i });
    await expect(deleteButtons.first()).toBeVisible();
  });
});

test.describe('Backtest Detail View', () => {
  test('should display backtest details', async ({ page }) => {
    // Mock backtest detail API
    await page.route('**/api/v1/backtest/runs/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Test Backtest Detail',
          strategy_type: 'UNDERVALUED_SCREENER',
          market: 'KOSPI',
          simulation_date: '2020-01-01T00:00:00',
          lookback_years: 5,
          holding_period_months: 12,
          status: 'completed',
          total_recommendations: 20,
          avg_return_pct: 15.5,
          win_rate_pct: 70.0,
          alpha_pct: 5.5,
          sharpe_ratio: 1.5,
          volatility_pct: 10.2,
          max_drawdown_pct: -15.3,
          created_at: '2024-01-01T00:00:00',
        }),
      });
    });

    // Mock patterns API
    await page.route('**/api/v1/backtest/analytics/runs/1/patterns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sector_performance: {},
          value_score_performance: {},
          top_performers: [],
          bottom_performers: [],
          prediction_accuracy: {},
        }),
      });
    });

    await page.goto('http://localhost:3000/backtest/1');

    // Check page title
    await expect(page.getByText('Test Backtest Detail')).toBeVisible();

    // Check summary cards
    await expect(page.getByText('Total Recommendations')).toBeVisible();
    await expect(page.getByText('20')).toBeVisible();
    await expect(page.getByText('15.5%')).toBeVisible();

    // Check back button
    await expect(page.getByRole('button', { name: /back to backtests/i })).toBeVisible();
  });

  test('should navigate back to backtest list', async ({ page }) => {
    // Mock API
    await page.route('**/api/v1/backtest/runs/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Test',
          market: 'KOSPI',
          status: 'completed',
          simulation_date: '2020-01-01T00:00:00',
          lookback_years: 5,
          holding_period_months: 12,
          created_at: '2024-01-01T00:00:00',
        }),
      });
    });

    await page.route('**/api/v1/backtest/analytics/runs/1/patterns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sector_performance: {},
          value_score_performance: {},
          top_performers: [],
          bottom_performers: [],
          prediction_accuracy: {},
        }),
      });
    });

    await page.goto('http://localhost:3000/backtest/1');

    // Click back button
    await page.getByRole('button', { name: /back to backtests/i }).click();

    // Should navigate to backtest list
    await expect(page).toHaveURL(/.*\/backtest$/);
  });
});

test.describe('Backtest Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/backtest');
  });

  test('should display analytics tab content', async ({ page }) => {
    // Mock analytics APIs
    await page.route('**/api/v1/backtest/analytics/compare', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strategies: {
            'Value Score': {
              total_runs: 10,
              avg_return: 15.0,
              avg_win_rate: 70.0,
              avg_sharpe_ratio: 1.5,
              avg_alpha: 5.0,
            },
          },
          best_by_return: {
            strategy: 'Value Score',
            avg_return_pct: 15.0,
          },
          best_by_sharpe: {
            strategy: 'Value Score',
            sharpe_ratio: 1.5,
          },
          best_by_winrate: {
            strategy: 'Value Score',
            win_rate_pct: 70.0,
          },
          total_backtests: 10,
        }),
      });
    });

    await page.route('**/api/v1/backtest/analytics/time-series', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          time_series: [],
          total_backtests: 10,
        }),
      });
    });

    // Click Analytics tab
    await page.getByRole('tab', { name: 'Analytics' }).click();

    // Wait for content
    await page.waitForTimeout(500);

    // Check for analytics content
    await expect(page.getByText('Best by Return')).toBeVisible();
    await expect(page.getByText('Value Score')).toBeVisible();
  });

  test('should allow filtering analytics by market', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/v1/backtest/analytics/compare*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strategies: {},
          best_by_return: { strategy: 'Test', avg_return_pct: 10.0 },
          best_by_sharpe: { strategy: 'Test', sharpe_ratio: 1.0 },
          best_by_winrate: { strategy: 'Test', win_rate_pct: 60.0 },
          total_backtests: 5,
        }),
      });
    });

    await page.route('**/api/v1/backtest/analytics/time-series*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ time_series: [], total_backtests: 5 }),
      });
    });

    // Go to Analytics tab
    await page.getByRole('tab', { name: 'Analytics' }).click();

    // Find and click market filter
    const marketFilter = page.getByLabel('Market Filter');
    await marketFilter.click();

    // Select KOSPI
    await page.getByRole('option', { name: 'KOSPI' }).click();

    // Wait for API call with filter
    await page.waitForTimeout(500);
  });
});

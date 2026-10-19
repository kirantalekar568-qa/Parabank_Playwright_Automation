import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import { registerUniqueCustomer } from './test-data';

test.describe('Module 2: Account Management', () => {
  test('TC-ACC-001: Open an account and verify its overview and details', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    const accountId = await accountPage.openNewAccount('CHECKING');

    await expect(page.getByText('Congratulations, your account is now open.')).toBeVisible();
    await expect(page.locator('#newAccountId')).toHaveText(accountId);

    await accountPage.openOverview();
    const accountRow = accountPage.accountRow(accountId);
    await expect(accountRow).toBeVisible();
    await expect(accountRow.locator('td')).toHaveCount(3);
    await expect(accountRow.locator('td').nth(1)).toContainText('$');

    await accountPage.openAccountDetails(accountId);
    await expect(page.getByText(accountId, { exact: true })).toBeVisible();
    await expect(page.getByText('CHECKING', { exact: true })).toBeVisible();
    await expect(page.getByText('Balance')).toBeVisible();
  });

  test('TC-ACC-002: Open a savings account and verify its account type and balance', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    const savingsAccountId = await accountPage.openNewAccount('SAVINGS');

    await expect(page.getByRole('heading', { name: 'Account Opened!' })).toBeVisible();
    await expect(page.locator('#newAccountId')).toHaveText(savingsAccountId);

    await accountPage.openOverview();
    await expect(accountPage.accountRow(savingsAccountId)).toBeVisible();
    await accountPage.openAccountDetails(savingsAccountId);
    await expect(page.getByText(savingsAccountId, { exact: true })).toBeVisible();
    await expect(page.getByText('SAVINGS', { exact: true })).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });

  test('TC-ACC-003: Verify multiple newly opened accounts appear in the overview', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    const checkingAccountId = await accountPage.openNewAccount('CHECKING');
    const savingsAccountId = await accountPage.openNewAccount('SAVINGS');

    await accountPage.openOverview();
    const checkingRow = accountPage.accountRow(checkingAccountId);
    const savingsRow = accountPage.accountRow(savingsAccountId);

    await expect(checkingRow).toBeVisible();
    await expect(savingsRow).toBeVisible();
    await expect(page.locator('#accountTable tbody tr').filter({ has: page.locator('a') })).toHaveCount(3);
    await expect(checkingRow.locator('td').nth(1)).toContainText('$');
    await expect(savingsRow.locator('td').nth(1)).toContainText('$');
  });
});
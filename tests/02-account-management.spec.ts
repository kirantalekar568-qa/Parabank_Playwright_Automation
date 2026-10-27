import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import { registerUniqueCustomer } from './test-data';

test.describe('Module 2: Account Management', () => {
  test('TC-14 / TC-17: Open a checking account and verify its overview and details', async ({ page }) => {
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

  test('TC-15: Open a savings account and verify its account type and balance', async ({ page }) => {
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

  test('TC-13: Verify customer accounts and balances in the overview', async ({ page }) => {
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

  test('TC-16: Check minimum opening deposit validation', async ({ page }) => {
    await registerUniqueCustomer(page);
    await page.getByRole('link', { name: 'Open New Account' }).click();

    const amountField = page.locator('#amount');
    await expect(amountField).toBeVisible();
    await amountField.fill('0');
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await expect(page.getByRole('heading', { name: 'Account Opened!' })).not.toBeVisible();
  });

  test('TC-18: Update contact details and verify they persist after refresh', async ({ page }) => {
    await registerUniqueCustomer(page);
    await page.getByRole('link', { name: /Update Contact Info/i }).click();
    const firstName = page.locator('input[name="customer.firstName"]');
    await firstName.fill('Updated');
    await page.getByRole('button', { name: /Update Profile/i }).click();

    await page.reload();
    await expect(firstName).toHaveValue('Updated');
  });

  test('TC-19: Reject invalid contact information', async ({ page }) => {
    await registerUniqueCustomer(page);
    await page.getByRole('link', { name: /Update Contact Info/i }).click();
    await page.locator('input[name="customer.phoneNumber"]').fill('not-a-phone-number');
    await page.getByRole('button', { name: /Update Profile/i }).click();

    await expect(page.getByText(/invalid|error|phone/i)).toBeVisible();
    await page.reload();
    await expect(page.locator('input[name="customer.phoneNumber"]')).not.toHaveValue('not-a-phone-number');
  });
});
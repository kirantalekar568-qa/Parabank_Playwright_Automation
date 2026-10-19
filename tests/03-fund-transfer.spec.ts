import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import { LoginPage } from '../pages/LoginPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { registerUniqueCustomer } from './test-data';

test.describe('Module 3 and 4: Fund Transfer and Transaction History', () => {
  test('TC-TRF-001: Transfer funds, verify balances, and find the transaction', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    await accountPage.openOverview();
    const sourceAccountId = (await page.locator('#accountTable a').first().innerText()).trim();
    const destinationAccountId = await accountPage.openNewAccount('CHECKING');
    await accountPage.openOverview();
    const sourceBalanceBefore = await accountPage.accountBalance(sourceAccountId);
    const destinationBalanceBefore = await accountPage.accountBalance(destinationAccountId);
    const amount = 10;

    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts(amount.toFixed(2), sourceAccountId, destinationAccountId);

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();
    await expect(page.getByText('$10.00 has been transferred', { exact: false })).toBeVisible();

    await accountPage.openOverview();
    await expect.poll(() => accountPage.accountBalance(sourceAccountId)).toBeCloseTo(sourceBalanceBefore - amount, 2);
    await expect.poll(() => accountPage.accountBalance(destinationAccountId)).toBeCloseTo(destinationBalanceBefore + amount, 2);

    await page.getByRole('link', { name: 'Find Transactions' }).click();
    await page.locator('#accountId').selectOption(destinationAccountId);
    await page.locator('#amount').fill(amount.toFixed(2));
    await page.getByRole('button', { name: 'Find Transactions' }).last().click();
    const transactionRow = page.locator('#transactionTable tbody tr').filter({ hasText: '$10.00' });
    await expect(transactionRow).toHaveCount(1);
    await expect(transactionRow).toContainText('Funds Transfer Received');
    await expect(transactionRow).toContainText(/\d{2}-\d{2}-\d{4}/);
    await expect(transactionRow.locator('td').last()).toContainText('$10.00');
  });

  test('TC-NEG-TRF-001: Reject a transfer amount above the source balance', async ({ page }) => {
    const username = process.env.PARABANK_USERNAME;
    const password = process.env.PARABANK_PASSWORD;
    test.skip(!username || !password, 'Set PARABANK_USERNAME and PARABANK_PASSWORD to run this seeded-account test.');

    const loginPage = new LoginPage(page);
    await loginPage.navigate('/index.htm');
    await loginPage.login(username!, password!);
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();

    const accountPage = new AccountPage(page);
    await accountPage.openOverview();
    const sourceAccountId = (await page.locator('#accountTable a').first().innerText()).trim();
    const balance = await accountPage.accountBalance(sourceAccountId);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferFunds((balance + 1).toFixed(2));
    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).not.toBeVisible();
    await expect(page.getByText(/error|insufficient|not enough/i)).toBeVisible();
  });
});

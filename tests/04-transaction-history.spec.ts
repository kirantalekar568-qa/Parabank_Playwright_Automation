import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { createTransferAccounts, registerUniqueCustomer } from './test-data';

test.describe('Module 4: Transaction History', () => {
  test('TC-29 / TC-30 / TC-31 / TC-34: Find sent and received transfers in account history', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    await accountPage.openOverview();
    const sourceAccountId = (await page.locator('#accountTable a').first().innerText()).trim();
    const destinationAccountId = await accountPage.openNewAccount('CHECKING');
    const transferAmount = 10;

    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts(
      transferAmount.toFixed(2),
      sourceAccountId,
      destinationAccountId,
    );

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();
    await expect(page.getByText('$10.00 has been transferred', { exact: false })).toBeVisible();

    await accountPage.openOverview();
    await accountPage.openAccountDetails(destinationAccountId);
    await page.getByRole('link', { name: 'Find Transactions' }).click();
    await page.locator('#accountId').selectOption(destinationAccountId);
    await page.locator('#amount').fill(transferAmount.toFixed(2));
    await page.getByRole('button', { name: 'Find Transactions' }).last().click();

    const transactionRow = page.locator('#transactionTable tbody tr').filter({
      hasText: `$${transferAmount.toFixed(2)}`,
    });
    await expect(transactionRow).toHaveCount(1);
    await expect(transactionRow).toContainText('Funds Transfer Received');
    await expect(transactionRow).toContainText(/\d{2}-\d{2}-\d{4}/);
    await expect(transactionRow.locator('td').last()).toContainText('$10.00');

    await page.getByRole('link', { name: 'Find Transactions' }).click();
    await page.locator('#accountId').selectOption(sourceAccountId);
    await page.locator('#amount').fill(transferAmount.toFixed(2));
    await page.getByRole('button', { name: 'Find Transactions' }).last().click();
    const debitRow = page.locator('#transactionTable tbody tr').filter({
      hasText: `$${transferAmount.toFixed(2)}`,
    });
    await expect(debitRow).toHaveCount(1);
    await expect(debitRow).toContainText('Funds Transfer Sent');
  });

  test('TC-32: Find transactions for a specific month', async ({ page }) => {
    const { sourceAccountId, destinationAccountId } = await createTransferAccounts(page);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts('2.00', sourceAccountId, destinationAccountId);
    await page.getByRole('link', { name: 'Find Transactions' }).click();
    await page.locator('#accountId').selectOption(destinationAccountId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const formatDate = (date: Date) =>
      `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
    await page.locator('#fromDate').fill(formatDate(monthStart));
    await page.locator('#toDate').fill(formatDate(now));
    await page.getByRole('button', { name: 'Find Transactions' }).nth(2).click();

    await expect(page.locator('#transactionTable')).toContainText('$2.00');
  });

  test('TC-33: Search transactions with valid and invalid date ranges', async ({ page }) => {
    const { sourceAccountId, destinationAccountId } = await createTransferAccounts(page);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts('2.00', sourceAccountId, destinationAccountId);
    await page.getByRole('link', { name: 'Find Transactions' }).click();
    await page.locator('#accountId').selectOption(destinationAccountId);
    const now = new Date();
    const formatDate = (date: Date) =>
      `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
    await page.locator('#fromDate').fill(formatDate(new Date(now.getFullYear(), now.getMonth(), 1)));
    await page.locator('#toDate').fill(formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    await page.getByRole('button', { name: 'Find Transactions' }).nth(2).click();
    await expect(page.locator('#transactionTable')).toContainText('$2.00');

    await page.getByRole('link', { name: 'Find Transactions' }).click();
    await page.locator('#accountId').selectOption(destinationAccountId);
    await page.locator('#fromDate').fill('12-31-2030');
    await page.locator('#toDate').fill('01-01-2020');
    await page.getByRole('button', { name: 'Find Transactions' }).nth(2).click();
    await expect(page.getByText(/invalid.*date|date.*invalid/i)).toBeVisible();
  });

  test('TC-35: Show a clear result when no transactions match', async ({ page }) => {
    const { destinationAccountId } = await createTransferAccounts(page);
    await page.getByRole('link', { name: 'Find Transactions' }).click();
    await page.locator('#accountId').selectOption(destinationAccountId);
    await page.locator('#amount').fill('987654321.99');
    await page.getByRole('button', { name: 'Find Transactions' }).last().click();

    await expect(page.locator('#transactionTable tbody tr')).toHaveCount(0);
    await expect(page.getByText(/no transactions found|no transactions|no results/i)).toBeVisible();
  });
});
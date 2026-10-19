import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { registerUniqueCustomer } from './test-data';

test.describe('Module 4: Transaction History', () => {
  test('TC-HIST-001: Find and validate a completed transfer in account history', async ({ page }) => {
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
  });
});
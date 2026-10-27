import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { createTransferAccounts, registerUniqueCustomer } from './test-data';

test.describe('Module 3: Fund Transfer', () => {
  test('TC-20 / TC-21 / TC-27 / TC-39: Transfer funds, verify messages and balances', async ({ page }) => {
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

  test('TC-25: Reject a transfer amount above the source balance', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    await accountPage.openOverview();
    const sourceAccountId = (await page.locator('#accountTable a').first().innerText()).trim();
    const balance = await accountPage.accountBalance(sourceAccountId);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferFunds((balance + 1).toFixed(2));
    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Error!' })).toBeVisible();
    await accountPage.openOverview();
    await expect.poll(() => accountPage.accountBalance(sourceAccountId)).toBe(balance);
  });

  test('TC-22: Reject a zero-amount transfer without changing balances', async ({ page }) => {
    const { accountPage, sourceAccountId, destinationAccountId } = await createTransferAccounts(page);
    const sourceBefore = await accountPage.accountBalance(sourceAccountId);
    const destinationBefore = await accountPage.accountBalance(destinationAccountId);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts('0', sourceAccountId, destinationAccountId);

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).not.toBeVisible();
    await accountPage.openOverview();
    await expect.poll(() => accountPage.accountBalance(sourceAccountId)).toBe(sourceBefore);
    await expect.poll(() => accountPage.accountBalance(destinationAccountId)).toBe(destinationBefore);
  });

  test('TC-23: Reject a negative transfer without changing balances', async ({ page }) => {
    const { accountPage, sourceAccountId, destinationAccountId } = await createTransferAccounts(page);
    const sourceBefore = await accountPage.accountBalance(sourceAccountId);
    const destinationBefore = await accountPage.accountBalance(destinationAccountId);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts('-1', sourceAccountId, destinationAccountId);

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).not.toBeVisible();
    await accountPage.openOverview();
    await expect.poll(() => accountPage.accountBalance(sourceAccountId)).toBe(sourceBefore);
    await expect.poll(() => accountPage.accountBalance(destinationAccountId)).toBe(destinationBefore);
  });

  test('TC-24: Reject non-numeric transfer amounts', async ({ page }) => {
    await registerUniqueCustomer(page);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await page.locator('#amount').fill('not-a-number');
    await page.getByRole('button', { name: 'Transfer' }).click();

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).not.toBeVisible();
  });

  test('TC-26: Reject a transfer to the same source and destination account', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    await accountPage.openOverview();
    const accountId = (await page.locator('#accountTable a').first().innerText()).trim();
    const balanceBefore = await accountPage.accountBalance(accountId);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts('1.00', accountId, accountId);

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).not.toBeVisible();
    await accountPage.openOverview();
    await expect.poll(() => accountPage.accountBalance(accountId)).toBe(balanceBefore);
  });

  test('TC-28 / TC-40: Refreshing a completed transfer does not duplicate it', async ({ page }) => {
    const { accountPage, sourceAccountId, destinationAccountId } = await createTransferAccounts(page);
    const sourceBefore = await accountPage.accountBalance(sourceAccountId);
    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferBetweenAccounts('1.00', sourceAccountId, destinationAccountId);
    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();
    await page.reload();
    await accountPage.openOverview();

    await expect.poll(() => accountPage.accountBalance(sourceAccountId)).toBe(sourceBefore - 1);
  });
});

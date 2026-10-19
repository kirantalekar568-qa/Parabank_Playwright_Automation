import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AccountPage } from '../pages/AccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { createUniqueCustomerData, registerUniqueCustomer } from './test-data';

test.describe('Module 5: Negative Testing', () => {
  test('TC-NEG-001: Reject an invalid username and password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/index.htm');
    await loginPage.login('invalid_user_0000000000', 'WrongPassword123!');

    await expect(page.getByRole('heading', { name: 'Error!' })).toBeVisible();
    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
  });

  test('TC-NEG-002: Reject registration when password confirmation differs', async ({ page }) => {
    const customer = createUniqueCustomerData();
    const registerPage = new RegisterPage(page);
    await registerPage.navigate('/index.htm');
    await registerPage.gotoRegister();
    await registerPage.registerUserWithMismatchedPasswords(customer, `${customer.pass}wrong`);

    await expect(page.getByText('Passwords did not match.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome' })).not.toBeVisible();
  });

  test('TC-NEG-003: Reject a transfer amount greater than the source balance', async ({ page }) => {
    await registerUniqueCustomer(page);
    const accountPage = new AccountPage(page);
    await accountPage.openOverview();
    const sourceAccountId = (await page.locator('#accountTable a').first().innerText()).trim();
    const startingBalance = await accountPage.accountBalance(sourceAccountId);

    const transferPage = new TransferFundsPage(page);
    await transferPage.navigateToTransfer();
    await transferPage.transferFunds((startingBalance + 1).toFixed(2));

    await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Error!' })).toBeVisible();
    await expect(page.getByText('An internal error has occurred and has been logged.')).toBeVisible();
    await accountPage.openOverview();
    await expect.poll(() => accountPage.accountBalance(sourceAccountId)).toBe(startingBalance);
  });
});
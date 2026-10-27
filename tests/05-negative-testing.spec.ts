import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { createUniqueCustomerData, openRegistration, registerUniqueCustomer } from './test-data';

test.describe('Module 5: Negative Testing', () => {
  test('TC-36: Handle special characters and unexpected registration input', async ({ page }) => {
    const customer = createUniqueCustomerData();
    const registerPage = await openRegistration(page);
    await registerPage.registerUser({
      ...customer,
      firstName: '<script>alert(1)</script>',
      username: `symbols_${customer.username}!`,
    });

    await expect(page.getByText(/internal error|exception|stack trace/i)).toHaveCount(0);
  });

  test('TC-37: Protected account pages require a valid session', async ({ page }) => {
    await page.goto('overview.htm');

    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
    await expect(page.locator("input[name='username']")).toBeVisible();
  });

  test('TC-38: Account information is inaccessible after logout', async ({ page }) => {
    await registerUniqueCustomer(page);
    await new LoginPage(page).logout();
    await page.goto('overview.htm');

    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
    await expect(page.locator("input[name='username']")).toBeVisible();
  });

  test('TC-41: Browser Back after logout does not expose account data', async ({ page }) => {
    await registerUniqueCustomer(page);
    await page.getByRole('link', { name: 'Accounts Overview' }).click();
    await new LoginPage(page).logout();
    await page.goBack();

    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
    await page.goto('overview.htm');
    await expect(page.locator("input[name='username']")).toBeVisible();
  });

  test('TC-42: An expired session cannot access protected account pages', async ({ page }) => {
    await registerUniqueCustomer(page);
    await page.context().clearCookies();
    await page.goto('overview.htm');

    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
    await expect(page.locator("input[name='username']")).toBeVisible();
  });

  test('TC-43: Login errors are clear and do not expose technical details', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/index.htm');
    await loginPage.login('unknown-user', 'wrong-password');

    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
    await expect(page.getByText(/stack trace|exception|sql|password hash/i)).toHaveCount(0);
  });
});
import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { createUniqueCustomerData, registerUniqueCustomer } from './test-data';

test.describe('Module 1: Registration and Login', () => {
  test('TC-REG-001: Register a unique user and log in with the new credentials', async ({ page }) => {
    const customer = await registerUniqueCustomer(page);

    const loginPage = new LoginPage(page);
    await loginPage.logout();
    await loginPage.login(customer.username, customer.pass);
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
  });

  test('TC-LOG-002: Reject invalid login credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/index.htm');
    await loginPage.login('invalid_user', 'WrongPassword123!');
    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
  });

  test('TC-NEG-REG-001: Reject mismatched registration passwords', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const customer = createUniqueCustomerData();
    await registerPage.navigate('/index.htm');
    await registerPage.gotoRegister();
    await registerPage.registerUserWithMismatchedPasswords(customer, 'NotTheSame123!');

    await expect(page.getByText('Passwords did not match.')).toBeVisible();
  });
});

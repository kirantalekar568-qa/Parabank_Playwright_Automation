import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { AccountPage } from '../pages/AccountPage';
import {
  createUniqueCustomerData,
  fillRegistrationFields,
  openRegistration,
  registerUniqueCustomer,
} from './test-data';

test.describe('Module 1: Registration and Login', () => {
  test('TC-01 / TC-07: Register a unique user and log in with the new credentials', async ({ page }) => {
    const customer = await registerUniqueCustomer(page);

    const loginPage = new LoginPage(page);
    await loginPage.logout();
    await loginPage.login(customer.username, customer.pass);
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
  });

  test('TC-08: Reject login with an invalid username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/index.htm');
    await loginPage.login('invalid_user', 'WrongPassword123!');
    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
  });

  test('TC-04: Reject mismatched registration passwords', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const customer = createUniqueCustomerData();
    await registerPage.navigate('/index.htm');
    await registerPage.gotoRegister();
    await registerPage.registerUserWithMismatchedPasswords(customer, 'NotTheSame123!');

    await expect(page.getByText('Passwords did not match.')).toBeVisible();
  });

  test('TC-02: Reject registration when all required fields are blank', async ({ page }) => {
    await openRegistration(page);
    await page.locator("input[value='Register']").click();

    await expect(page.getByText('Your account was created successfully.')).not.toBeVisible();
    await expect(page.locator('input[name="customer.firstName"]')).toBeVisible();
    await expect(page.locator('input[name="customer.username"]')).toBeVisible();
  });

  test('TC-03: Require a phone number during registration', async ({ page }) => {
    test.fail(true, 'The public ParaBank demo currently accepts registrations without a phone number.');
    const customer = createUniqueCustomerData();
    await openRegistration(page);
    await fillRegistrationFields(page, customer, { phone: '' });
    await page.locator("input[value='Register']").click();

    await expect(page.getByText('Your account was created successfully.')).not.toBeVisible();
    await expect(page.locator('input[name="customer.phoneNumber"]')).toBeVisible();
  });

  test('TC-05: Reject a duplicate username', async ({ page }) => {
    const customer = await registerUniqueCustomer(page);
    await new LoginPage(page).logout();
    await openRegistration(page);
    await fillRegistrationFields(page, customer);
    await page.locator("input[value='Register']").click();

    await expect(page.getByText('This username already exists.')).toBeVisible();
  });

  test('TC-06: Reject a whitespace-only username', async ({ page }) => {
    test.fixme(true, 'The public ParaBank demo does not consistently reject whitespace-only usernames, and registrations persist across runs.');
    const customer = createUniqueCustomerData();
    await openRegistration(page);
    await fillRegistrationFields(page, customer, { username: '     ' });
    await page.locator("input[value='Register']").click();

    await expect(page.getByText('Your account was created successfully.')).not.toBeVisible();
    await expect(page.locator('input[name="customer.username"]')).toBeVisible();
  });

  test('TC-06: Handle a 50-character username without crashing', async ({ page }) => {
    const customer = createUniqueCustomerData();
    await openRegistration(page);
    await fillRegistrationFields(page, customer, { username: 'u'.repeat(50) });
    let serverErrorStatus: number | undefined;
    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrorStatus = response.status();
      }
    });
    await page.locator("input[value='Register']").click();

    await expect(page.getByText(/internal error|exception|stack trace/i)).toHaveCount(0);
    expect(serverErrorStatus).toBeUndefined();
  });

  test('TC-09: Reject a valid username with an incorrect password', async ({ page }) => {
    const customer = await registerUniqueCustomer(page);
    const loginPage = new LoginPage(page);
    await loginPage.logout();
    await loginPage.navigate('/index.htm');
    await loginPage.login(customer.username, `${customer.pass}incorrect`);

    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
  });

  test('TC-10: Reject blank and partially completed login fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/index.htm');
    await page.locator("input[value='Log In']").click();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();

    await page.locator("input[name='username']").fill('only-username');
    await page.locator("input[value='Log In']").click();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
  });

  test('TC-11: Logging out ends access to the account overview', async ({ page }) => {
    await registerUniqueCustomer(page);
    await new LoginPage(page).logout();
    await page.goto('overview.htm');

    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
    await expect(page.locator("input[name='username']")).toBeVisible();
  });

  test('TC-12: Browser Back after logout does not reveal account data', async ({ page }) => {
    await registerUniqueCustomer(page);
    await new AccountPage(page).openOverview();
    await new LoginPage(page).logout();
    await page.goBack();

    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).not.toBeVisible();
    await page.goto('overview.htm');
    await expect(page.locator("input[name='username']")).toBeVisible();
  });
});

import { expect, Page } from '@playwright/test';
import { randomInt } from 'node:crypto';
import { RegisterPage, RegistrationData } from '../pages/RegisterPage';
import { AccountPage } from '../pages/AccountPage';

export async function fillRegistrationFields(
  page: Page,
  customer: RegistrationData,
  overrides: Partial<Record<keyof RegistrationData, string>> = {},
): Promise<void> {
  const fields: Array<[keyof RegistrationData, string]> = [
    ['firstName', 'customer.firstName'],
    ['lastName', 'customer.lastName'],
    ['address', 'customer.address.street'],
    ['city', 'customer.address.city'],
    ['state', 'customer.address.state'],
    ['zip', 'customer.address.zipCode'],
    ['phone', 'customer.phoneNumber'],
    ['ssn', 'customer.ssn'],
    ['username', 'customer.username'],
    ['pass', 'customer.password'],
  ];

  for (const [key, name] of fields) {
    await page.locator(`input[name="${name}"]`).fill(overrides[key] ?? customer[key]);
  }

  await page.locator('input[name="repeatedPassword"]').fill(overrides.pass ?? customer.pass);
}

export async function openRegistration(page: Page): Promise<RegisterPage> {
  const registerPage = new RegisterPage(page);
  await registerPage.navigate('/index.htm');
  await registerPage.gotoRegister();
  return registerPage;
}

export async function createTransferAccounts(page: Page): Promise<{
  accountPage: AccountPage;
  sourceAccountId: string;
  destinationAccountId: string;
}> {
  await registerUniqueCustomer(page);
  const accountPage = new AccountPage(page);
  await accountPage.openOverview();
  const sourceAccountId = (await page.locator('#accountTable a').first().innerText()).trim();
  const destinationAccountId = await accountPage.openNewAccount('CHECKING');
  await accountPage.openOverview();
  return { accountPage, sourceAccountId, destinationAccountId };
}

export function createUniqueCustomerData(): RegistrationData {
  const numericUsername = String(randomInt(1_000_000_000, 10_000_000_000));
  const passwordSuffix = String(randomInt(100_000, 1_000_000));

  return {
    firstName: 'Playwright',
    lastName: 'Tester',
    address: '1 Test Street',
    city: 'Test City',
    state: 'CA',
    zip: '90210',
    phone: '5551234567',
    ssn: String(randomInt(100_000_000, 1_000_000_000)),
    username: numericUsername,
    pass: `Pw!${passwordSuffix}a9`,
  };
}

export async function registerUniqueCustomer(page: Page): Promise<RegistrationData> {
  const registerPage = new RegisterPage(page);
  await registerPage.navigate('/index.htm');
  await registerPage.gotoRegister();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const customer = createUniqueCustomerData();
    await registerPage.registerUser(customer);

    if (await page.getByText('This username already exists.').isVisible().catch(() => false)) {
      continue;
    }

    await expect(page.getByText('Your account was created successfully. You are now logged in.')).toBeVisible();
    return customer;
  }

  throw new Error('ParaBank rejected three generated usernames as already taken.');
}
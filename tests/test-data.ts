import { expect, Page } from '@playwright/test';
import { randomInt } from 'node:crypto';
import { RegisterPage, RegistrationData } from '../pages/RegisterPage';

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
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  ssn: string;
  username: string;
  pass: string;
}

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoRegister() {
    await this.page.click('text=Register');
    await this.page.locator('input[name="customer.firstName"]').waitFor({ state: 'visible' });
  }

  async registerUser(data: RegistrationData) {
    await this.fillRegistrationForm(data, data.pass);
  }

  async registerUserWithMismatchedPasswords(data: RegistrationData, confirmation: string) {
    await this.fillRegistrationForm(data, confirmation);
  }

  private async fillRegistrationForm(data: RegistrationData, confirmation: string) {
    const fields: Array<[string, string]> = [
      ['customer.firstName', data.firstName],
      ['customer.lastName', data.lastName],
      ['customer.address.street', data.address],
      ['customer.address.city', data.city],
      ['customer.address.state', data.state],
      ['customer.address.zipCode', data.zip],
      ['customer.phoneNumber', data.phone],
      ['customer.ssn', data.ssn],
      ['customer.username', data.username],
      ['customer.password', data.pass],
      ['repeatedPassword', confirmation],
    ];

    for (const [name, value] of fields) {
      const field = this.page.locator(`input[name="${name}"]`);
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await field.fill(value);
        if ((await field.inputValue()) === value) {
          break;
        }
      }
      await expect(field).toHaveValue(value);
    }

    await this.page.click("input[value='Register']");
  }
}

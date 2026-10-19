import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async login(username: string, pass: string) {
    await this.page.fill("input[name='username']", username);
    await this.page.fill("input[name='password']", pass);
    await this.page.click("input[value='Log In']");
  }

  async logout() {
    await this.page.click('text=Log Out');
  }
}

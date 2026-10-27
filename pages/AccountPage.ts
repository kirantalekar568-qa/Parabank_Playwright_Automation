import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openNewAccount(type: 'CHECKING' | 'SAVINGS' = 'CHECKING'): Promise<string> {
    await this.page.getByRole('link', { name: 'Open New Account' }).click();
    await this.page.locator('#type').selectOption({ label: type });
    await this.page.locator('#fromAccountId').selectOption({ index: 0 });
    await this.page.getByRole('button', { name: 'Open New Account' }).click();
    await this.page.getByRole('heading', { name: 'Account Opened!' }).waitFor();
    return (await this.page.locator('#newAccountId').innerText()).trim();
  }

  async openOverview(): Promise<void> {
    await this.page.getByRole('link', { name: 'Accounts Overview' }).click();
    await this.page.getByRole('heading', { name: 'Accounts Overview' }).waitFor();
  }

  accountRow(accountId: string): Locator {
    return this.page.locator('#accountTable tr').filter({
      has: this.page.getByRole('link', { name: accountId, exact: true }),
    });
  }

  async accountBalance(accountId: string): Promise<number> {
    const text = await this.accountRow(accountId).locator('td').nth(1).innerText();
    return Number(text.replace(/[^0-9.-]/g, ''));
  }

  async openAccountDetails(accountId: string): Promise<void> {
    await this.accountRow(accountId).getByRole('link', { name: accountId, exact: true }).click();
    await this.page.getByRole('heading', { name: 'Account Details' }).waitFor();
  }
}
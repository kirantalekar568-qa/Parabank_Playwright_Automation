import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransferFundsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToTransfer() {
    await this.page.click('text=Transfer Funds');
  }

  async transferFunds(amount: string) {
    await this.page.waitForSelector("#amount");
    await this.page.fill("#amount", amount);
    await this.page.click("input[value='Transfer']");
  }

  async transferBetweenAccounts(amount: string, fromAccount: string, toAccount: string) {
    await this.page.locator('#fromAccountId').selectOption(fromAccount);
    await this.page.locator('#toAccountId').selectOption(toAccount);
    await this.page.locator('#amount').fill(amount);
    await this.page.getByRole('button', { name: 'Transfer' }).click();
  }
}

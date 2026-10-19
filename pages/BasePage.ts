import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string = '/index.htm') {
    await this.page.goto(path.replace(/^\/+/, ''));
  }
}

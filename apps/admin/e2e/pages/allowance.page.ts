import { type Locator, type Page, expect } from '@playwright/test';

export interface AllowanceData {
  userName: string;
  absenceTypeName: string;
  year?: number;
  totalDays: number;
  carriedOver?: number;
  notes?: string;
}

export class AllowancePage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly totalRecords: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: 'Create Allowance' });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.totalRecords = page.getByText(/Total \d+ records/);
  }

  async goto() {
    await this.page.goto('/#/hr/allowance');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.getByText('Leave Allowances').first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.totalRecords.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getRecordCount(): Promise<number> {
    const text = await this.totalRecords.textContent();
    const match = text?.match(/Total (\d+) records/);
    return match ? Number.parseInt(match[1] ?? '0', 10) : 0;
  }

  /**
   * Check if an allowance row matching user + absence type exists.
   */
  async allowanceExists(userName: string, absenceTypeName: string): Promise<boolean> {
    // Reset filter first to see all
    await this.resetButton.click();
    await this.page.waitForTimeout(1_000);
    await this.searchButton.click();
    await this.page.waitForTimeout(1_500);

    const rows = this.page.locator('.vxe-body--row');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes(userName) && text?.includes(absenceTypeName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Select an option from a searchable Ant Design Select (show-search).
   */
  private async selectSearchableOption(combobox: Locator, optionText: string) {
    await combobox.click();
    await combobox.fill(optionText);
    await this.page.waitForTimeout(500);

    const option = this.page.locator('.ant-select-dropdown .ant-select-item-option').filter({
      hasText: optionText,
    }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select an option from a non-searchable Ant Design Select.
   * Click the selector wrapper to open the dropdown, then pick the option.
   */
  private async selectDropdownOption(combobox: Locator, optionText: string) {
    // Click the .ant-select-selector parent to open dropdown (avoids span interception)
    const selectorWrapper = combobox.locator('xpath=ancestor::div[contains(@class,"ant-select-selector")]');
    await selectorWrapper.click();
    await this.page.waitForTimeout(500);

    const option = this.page.locator('.ant-select-dropdown .ant-select-item-option').filter({
      hasText: optionText,
    }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  async createAllowance(data: AllowanceData) {
    await this.createButton.click();

    const dialog = this.page.getByRole('dialog', { name: 'Create Allowance' });
    await dialog.waitFor({ state: 'visible', timeout: 10_000 });

    // Select user (searchable select)
    const userCombobox = dialog.getByRole('combobox', { name: '* User' });
    await this.selectSearchableOption(userCombobox, data.userName);

    // Select absence type (non-searchable dropdown)
    const absenceTypeCombobox = dialog.getByRole('combobox', { name: '* Absence Type' });
    await this.selectDropdownOption(absenceTypeCombobox, data.absenceTypeName);

    // Set total days
    const totalDaysInput = dialog.getByRole('spinbutton', { name: '* Total Days' });
    await totalDaysInput.click({ clickCount: 3 });
    await totalDaysInput.fill(String(data.totalDays));

    // Set carried over if provided
    if (data.carriedOver !== undefined && data.carriedOver > 0) {
      const carriedOverInput = dialog.getByRole('spinbutton', { name: 'Carried Over' });
      await carriedOverInput.click({ clickCount: 3 });
      await carriedOverInput.fill(String(data.carriedOver));
    }

    // Fill notes if provided
    if (data.notes) {
      await dialog.getByRole('textbox', { name: 'Notes' }).fill(data.notes);
    }

    // Click Create
    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Get action buttons from the fixed-right column for a row matching user + absence type.
   */
  private async getRowActionButton(userName: string, absenceTypeName: string, index: number): Promise<Locator> {
    const rows = this.page.locator('.vxe-body--row');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes(userName) && text?.includes(absenceTypeName)) {
        const buttons = rows.nth(i).locator('button');
        const btnCount = await buttons.count();
        if (btnCount >= index + 1) {
          return buttons.nth(index);
        }
        // Fallback to fixed-right wrapper
        const mainRows = this.page.locator('.vxe-table--main-wrapper .vxe-body--row');
        const mainCount = await mainRows.count();
        let rowIndex = -1;
        for (let j = 0; j < mainCount; j++) {
          const mainText = await mainRows.nth(j).textContent();
          if (mainText?.includes(userName) && mainText?.includes(absenceTypeName)) {
            rowIndex = j;
            break;
          }
        }
        if (rowIndex >= 0) {
          const fixedRow = this.page.locator('.vxe-table--fixed-right-wrapper .vxe-body--row').nth(rowIndex);
          return fixedRow.locator('button').nth(index);
        }
      }
    }
    // Fallback
    return this.page.locator('.vxe-body--row').first().locator('button').nth(index);
  }

  async deleteAllowance(userName: string, absenceTypeName: string) {
    const deleteBtn = await this.getRowActionButton(userName, absenceTypeName, 2);
    await deleteBtn.click();

    const okButton = this.page.getByRole('button', { name: 'OK' });
    await okButton.waitFor({ state: 'visible', timeout: 5_000 });
    await okButton.click();
    await this.page.waitForTimeout(1_500);
  }
}

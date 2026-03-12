import { type Locator, type Page, expect } from '@playwright/test';

export interface AbsenceTypeData {
  name: string;
  description?: string;
  deductsFromAllowance?: boolean;
  requiresApproval?: boolean;
  isActive?: boolean;
  signingRequired?: boolean;
  sortOrder?: number;
}

export class AbsenceTypePage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly totalRecords: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: 'Create Absence Type' });
    this.searchInput = page.getByRole('textbox', { name: 'Search' });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.totalRecords = page.getByText(/Total \d+ records/);
  }

  async goto() {
    await this.page.goto('/#/hr/absence-type');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.getByText('Absence Types').first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.totalRecords.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getRecordCount(): Promise<number> {
    const text = await this.totalRecords.textContent();
    const match = text?.match(/Total (\d+) records/);
    return match ? Number.parseInt(match[1] ?? '0', 10) : 0;
  }

  async search(query: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForTimeout(1_500);
  }

  async resetSearch() {
    await this.resetButton.click();
    await this.page.waitForTimeout(1_000);
  }

  async absenceTypeExists(name: string): Promise<boolean> {
    await this.search(name);
    const count = await this.getRecordCount();
    await this.resetSearch();
    return count > 0;
  }

  private getRow(name: string): Locator {
    return this.page.locator('.vxe-body--row', {
      hasText: name,
    }).first();
  }

  /**
   * Get action buttons in the row's action cell.
   * VxeTable may render fixed-right columns in a separate wrapper,
   * so we locate buttons across the full table scope.
   * Action buttons order: [View(eye), Edit(pencil), Delete(trash)]
   */
  private async getRowActionButton(name: string, index: number): Promise<Locator> {
    // Try to find the row with action buttons — check both main and fixed wrappers
    const row = this.page.locator('.vxe-body--row', { hasText: name });
    const buttons = row.locator('button').filter({ hasNotText: /Search|Reset|Create/ });

    // If no buttons found in the text-matching row, the action column may be in a
    // fixed-right wrapper with a separate row at the same index
    const count = await buttons.count();
    if (count >= index + 1) {
      return buttons.nth(index);
    }

    // Fallback: find the row index, then get the button from the fixed-right panel
    const mainRows = this.page.locator('.vxe-table--main-wrapper .vxe-body--row');
    const mainRowCount = await mainRows.count();
    let rowIndex = -1;
    for (let i = 0; i < mainRowCount; i++) {
      const text = await mainRows.nth(i).textContent();
      if (text?.includes(name)) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex >= 0) {
      const fixedRow = this.page.locator('.vxe-table--fixed-right-wrapper .vxe-body--row').nth(rowIndex);
      return fixedRow.locator('button').nth(index);
    }

    // Last fallback — just return the first match
    return buttons.nth(index);
  }

  async createAbsenceType(data: AbsenceTypeData) {
    await this.createButton.click();

    const dialog = this.page.getByRole('dialog', { name: 'Create Absence Type' });
    await dialog.waitFor({ state: 'visible', timeout: 10_000 });

    await dialog.getByRole('textbox', { name: '* Name' }).fill(data.name);

    if (data.description !== undefined) {
      await dialog.getByRole('textbox', { name: 'Description' }).fill(data.description);
    }

    if (data.deductsFromAllowance === false) {
      await dialog.getByRole('switch', { name: 'Deducts from Allowance' }).click();
    }
    if (data.requiresApproval === false) {
      await dialog.getByRole('switch', { name: 'Requires Approval' }).click();
    }
    if (data.isActive === false) {
      await dialog.getByRole('switch', { name: 'Active' }).click();
    }
    if (data.signingRequired === true) {
      await dialog.getByRole('switch', { name: 'Signing Required' }).click();
    }

    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await this.page.waitForTimeout(1_000);
  }

  async editAbsenceType(name: string, updatedData: Partial<AbsenceTypeData>) {
    await this.search(name);

    const row = this.getRow(name);
    await row.waitFor({ state: 'visible', timeout: 10_000 });

    // Edit is the 2nd action button (View=0, Edit=1, Delete=2)
    const editBtn = await this.getRowActionButton(name, 1);
    await editBtn.click();

    const dialog = this.page.getByRole('dialog', { name: 'Edit Absence Type' });
    await dialog.waitFor({ state: 'visible', timeout: 10_000 });

    if (updatedData.name !== undefined) {
      const nameInput = dialog.getByRole('textbox', { name: '* Name' });
      await nameInput.clear();
      await nameInput.fill(updatedData.name);
    }

    if (updatedData.description !== undefined) {
      const descInput = dialog.getByRole('textbox', { name: 'Description' });
      await descInput.clear();
      await descInput.fill(updatedData.description);
    }

    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await this.page.waitForTimeout(1_000);
  }

  async deleteAbsenceType(name: string) {
    await this.search(name);

    const row = this.getRow(name);
    await row.waitFor({ state: 'visible', timeout: 10_000 });

    // Delete is the 3rd action button (View=0, Edit=1, Delete=2)
    // It's wrapped in a-popconfirm so clicking shows a confirmation popover
    const deleteBtn = await this.getRowActionButton(name, 2);
    await deleteBtn.click();

    // a-popconfirm shows a popover with OK / Cancel buttons
    const okButton = this.page.getByRole('button', { name: 'OK' });
    await okButton.waitFor({ state: 'visible', timeout: 5_000 });
    await okButton.click();

    await this.page.waitForTimeout(1_500);
  }
}

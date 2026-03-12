import { type Locator, type Page, expect } from '@playwright/test';

export interface LeaveRequestData {
  absenceTypeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
  notes?: string;
}

export class LeaveRequestPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly totalRecords: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: 'Create Request' });
    this.totalRecords = page.getByText(/Total \d+ records/);
  }

  async goto() {
    await this.page.goto('/#/hr/request');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.getByText('Leave Requests').first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.totalRecords.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getRecordCount(): Promise<number> {
    const text = await this.totalRecords.textContent();
    const match = text?.match(/Total (\d+) records/);
    return match ? Number.parseInt(match[1] ?? '0', 10) : 0;
  }

  /**
   * Select an option from a non-searchable Ant Design Select.
   */
  private async selectDropdownOption(combobox: Locator, optionText: string) {
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

  /**
   * Create a leave request. The User field is pre-filled with the current logged-in user.
   */
  async createLeaveRequest(data: LeaveRequestData) {
    await this.createButton.click();

    const dialog = this.page.getByRole('dialog', { name: 'Create Request' });
    await dialog.waitFor({ state: 'visible', timeout: 10_000 });

    // Select absence type (non-searchable dropdown)
    const absenceTypeCombobox = dialog.getByRole('combobox', { name: '* Absence Type' });
    await this.selectDropdownOption(absenceTypeCombobox, data.absenceTypeName);

    // Fill start date (HTML5 date input)
    const startDateInput = dialog.locator('input[type="date"]').first();
    await startDateInput.fill(data.startDate);

    // Fill end date (HTML5 date input)
    const endDateInput = dialog.locator('input[type="date"]').nth(1);
    await endDateInput.fill(data.endDate);

    // Fill reason if provided
    if (data.reason) {
      await dialog.getByRole('textbox', { name: 'Reason' }).fill(data.reason);
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
   * Check if a leave request row matching absence type exists.
   */
  async requestExists(absenceTypeName: string): Promise<boolean> {
    const rows = this.page.locator('.vxe-table--main-wrapper .vxe-body--row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes(absenceTypeName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Count leave requests matching a given absence type name.
   */
  async countRequestsByAbsenceType(absenceTypeName: string): Promise<number> {
    const rows = this.page.locator('.vxe-table--main-wrapper .vxe-body--row');
    const count = await rows.count();
    let matched = 0;
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes(absenceTypeName)) {
        matched++;
      }
    }
    return matched;
  }

  /**
   * Count leave requests for a specific user.
   */
  async countRequestsByUser(userName: string): Promise<number> {
    const rows = this.page.locator('.vxe-table--main-wrapper .vxe-body--row');
    const count = await rows.count();
    let matched = 0;
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes(userName)) {
        matched++;
      }
    }
    return matched;
  }

  /**
   * Extract the current Bearer token from localStorage (Pinia persisted store).
   */
  private async getAccessToken(): Promise<string> {
    return this.page.evaluate(() => {
      // Pinia persisted store stores access data in localStorage
      for (const key of Object.keys(localStorage)) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (parsed?.accessToken && typeof parsed.accessToken === 'string') {
            return parsed.accessToken as string;
          }
        } catch {
          // not JSON, skip
        }
      }
      return '';
    });
  }

  /**
   * Try to delete the first leave request matching an absence type via the API.
   * Returns the HTTP status code of the delete response.
   */
  async tryDeleteFirstRequest(absenceTypeName: string): Promise<number> {
    const token = await this.getAccessToken();
    if (!token) return -1;

    // Get request ID from the list API
    const requestId = await this.page.evaluate(async (args: { typeName: string; token: string }) => {
      const res = await fetch('/admin/v1/modules/hr/v1/leave-requests?page=1&pageSize=50', {
        headers: { Authorization: `Bearer ${args.token}` },
      });
      const data = await res.json();
      const items = data.items || [];
      const match = items.find((r: { absenceTypeName?: string }) =>
        r.absenceTypeName === args.typeName,
      );
      return match?.id ?? null;
    }, { typeName: absenceTypeName, token });

    if (!requestId) return -1;

    // Try to delete
    const status = await this.page.evaluate(async (args: { id: string; token: string }) => {
      const res = await fetch(`/admin/v1/modules/hr/v1/leave-requests/${args.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${args.token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.status;
    }, { id: requestId, token });

    return status;
  }

  /**
   * Delete all leave requests matching a given absence type via the API.
   * Must be called as a user with delete permission (e.g. HR Admin).
   */
  async deleteAllRequestsByAbsenceType(absenceTypeName: string) {
    const token = await this.getAccessToken();
    if (!token) return;

    const deleted = await this.page.evaluate(async (args: { typeName: string; token: string }) => {
      const listRes = await fetch('/admin/v1/modules/hr/v1/leave-requests?page=1&pageSize=50', {
        headers: { Authorization: `Bearer ${args.token}` },
      });
      const data = await listRes.json();
      const items = data.items || [];
      const results: number[] = [];

      for (const item of items) {
        if ((item as { absenceTypeName?: string }).absenceTypeName === args.typeName) {
          const res = await fetch(`/admin/v1/modules/hr/v1/leave-requests/${(item as { id: string }).id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${args.token}`, 'Content-Type': 'application/json' },
          });
          results.push(res.status);
        }
      }
      return results;
    }, { typeName: absenceTypeName, token });

    if (deleted.length > 0) {
      // Reload the page to reflect changes
      await this.page.reload();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }
}

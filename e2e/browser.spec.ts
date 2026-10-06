import { test, expect } from '@playwright/test';
import { login, state, unexpected, watchConsole } from './helpers';

// Browser-level checks: every page of every role renders without console errors or CSP
// violations, role-based navigation matches the backend rules, and phone-width layouts fit.
const s = state();

const PAGES: Record<string, string[]> = {
  employee: ['/dashboard', '/tickets', '/tickets/new', '/account'],
  engineer: ['/dashboard', '/tickets', '/account'],
  manager: ['/dashboard', '/tickets', '/tickets/new', '/account'],
  admin: ['/dashboard', '/tickets', '/tickets/new', '/users', '/activity', '/sla-policies', '/account'],
};

const NAV: Record<string, string[]> = {
  employee: ['Dashboard', 'Tickets', 'New Ticket', 'Account'],
  engineer: ['Dashboard', 'Tickets', 'Account'],
  manager: ['Dashboard', 'Tickets', 'New Ticket', 'Account'],
  admin: ['Dashboard', 'Tickets', 'New Ticket', 'Users', 'Activity', 'SLA Policies', 'Account'],
};

const ADMIN_ONLY = ['/users', '/activity', '/sla-policies'];

for (const role of Object.keys(PAGES) as (keyof typeof PAGES)[]) {
  test(`${role}: pages load cleanly and navigation matches the role`, async ({ page }) => {
    const problems = watchConsole(page);
    await login(page, s.users[role as 'employee']);

    const nav = page.getByRole('navigation').first();
    for (const label of NAV[role]) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    for (const label of ['Users', 'Activity', 'SLA Policies']) {
      if (!NAV[role].includes(label)) {
        await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(0);
      }
    }

    for (const path of PAGES[role]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator('h1').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
    }

    if (role !== 'admin') {
      for (const path of ADMIN_ONLY) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/dashboard$/);
      }
    }

    expect(unexpected(problems), 'console errors / CSP violations').toEqual([]);
  });
}

test('phone width: no horizontal page scroll on the main pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const problems = watchConsole(page);
  await login(page, s.users.admin);

  for (const path of ['/dashboard', '/tickets', '/users', '/activity', '/account']) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);
  }

  expect(unexpected(problems)).toEqual([]);
});

test('signing out clears the session', async ({ page }) => {
  await login(page, s.users.employee);
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/tickets');
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('flowdesk_token'))).toBeNull();
});

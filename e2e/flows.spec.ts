import { test, expect } from '@playwright/test';
import { login, signOut, state } from './helpers';

// One ticket's journey through the roles, plus the admin and account pages.
// Runs in order: later steps use the ticket created first.
test.describe.configure({ mode: 'serial' });

const s = state();
const { employee, employee2, engineer, manager, admin, pwchange } = s.users;
const title = `E2E printer ${s.run}`;
let ticketId = '';

test('protected pages redirect to login when signed out', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/users');
  await expect(page).toHaveURL(/\/login$/);
});

test('wrong password shows an error and stays on login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(employee.email);
  await page.getByLabel(/^Password/).fill('Not-the-password-1');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Sign in failed')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('employee creates a ticket and sees it', async ({ page }) => {
  await login(page, employee);
  await page.goto('/tickets/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill('Paper jam on floor 3 (E2E test).');
  // Priority is a set of radio cards
  await page.getByRole('radio', { name: /^Low/ }).check({ force: true });
  await expect(page.getByRole('radio', { name: /^Low/ })).toBeChecked();
  await page.getByRole('button', { name: 'Submit Ticket' }).click();

  await expect(page).toHaveURL(/\/tickets\/\d+$/);
  ticketId = page.url().split('/').pop()!;
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  // Server-side search on the list page
  await page.goto('/tickets');
  await page.getByLabel('Search tickets').fill(title);
  await expect(page.getByRole('link', { name: title })).toBeVisible();
  await expect(page.getByText('1 ticket found')).toBeVisible();
});

test('another employee cannot see the ticket', async ({ page }) => {
  await login(page, employee2);
  await page.goto('/tickets');
  await page.getByLabel('Search tickets').fill(title);
  await expect(page.getByText('No tickets match your filters')).toBeVisible();

  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
});

test('manager assigns the ticket to the engineer', async ({ page }) => {
  await login(page, manager);
  await page.goto(`/tickets/${ticketId}`);
  await page.getByLabel('Support engineer').selectOption(engineer.email);
  await page.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(page.getByText(`Assigned to ${engineer.email}`)).toBeVisible();
});

test('engineer is notified, opens the ticket and moves it forward', async ({ page }) => {
  await login(page, engineer);

  const bell = page.getByRole('button', { name: /Notifications \(\d+ unread\)/ });
  await expect(bell).toBeVisible();
  await bell.click();
  await page.getByRole('button', { name: /Ticket assigned to you/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`/tickets/${ticketId}$`));

  // Only the valid next steps are offered as workflow actions
  const actions = page.getByRole('group', { name: 'Workflow actions' });
  await expect(actions.getByRole('button')).toHaveText(['Cancel ticket', 'Start progress']);
  await actions.getByRole('button', { name: 'Start progress' }).click();
  await expect(page.getByText('Ticket is now In Progress.')).toBeVisible();
  await expect(actions.getByRole('button')).toHaveText(['Cancel ticket', 'Mark resolved']);
});

test('employee sees the status change in notifications', async ({ page }) => {
  await login(page, employee);
  await page.getByRole('button', { name: /Notifications/ }).click();
  await expect(page.getByRole('button', { name: /Ticket status changed/ }).first()).toBeVisible();
});

test('admin manages users; other roles are kept out', async ({ page }) => {
  await login(page, admin);
  await page.goto('/users');
  await page.getByLabel('Search users').fill(employee2.email);
  const row = page.getByRole('row', { name: new RegExp(employee2.email) });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Department').fill(`${s.department}-MOVED`);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('User updated')).toBeVisible();
  await expect(row).toContainText(`${s.department}-MOVED`);

  await page.goto('/activity');
  await page.getByLabel('Search activity').fill(employee2.email);
  await expect(page.getByText(/events?$/).first()).toBeVisible();
});

test('admin views SLA policies without changing them; employee is redirected', async ({ page }) => {
  await login(page, admin);
  await page.goto('/sla-policies');
  for (const p of ['Low', 'Medium', 'High', 'Critical']) {
    await expect(page.getByText(`${p} Priority`, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(4);

  await signOut(page);
  await login(page, employee);
  await page.goto('/sla-policies');
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('user changes their password and must sign in again', async ({ page }) => {
  await login(page, pwchange);
  await page.goto('/account');
  await expect(page.getByText(pwchange.email)).toBeVisible();

  await page.getByLabel('Current password').fill('Wrong-password-1');
  await page.getByLabel('New password', { exact: true }).fill('Fresh-Harbor-2026');
  await page.getByLabel('Confirm new password').fill('Fresh-Harbor-2026');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Current password is incorrect')).toBeVisible();

  await page.getByLabel('Current password').fill(pwchange.password);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, { ...pwchange, password: 'Fresh-Harbor-2026' });
});

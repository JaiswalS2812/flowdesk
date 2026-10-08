import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { STATE_FILE, type E2eUser } from './global-setup';

interface E2eState {
  run: string;
  department: string;
  users: Record<'employee' | 'employee2' | 'engineer' | 'manager' | 'admin' | 'pwchange', E2eUser>;
}

export function state(): E2eState {
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
}

export async function login(page: Page, user: E2eUser) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel(/^Password/).fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Signs out through the account menu (sidebar on desktop, top bar on small screens). */
export async function signOut(page: Page) {
  await page.getByRole('button', { name: /^Account menu for/ }).first().click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Collects console errors and CSP violations for the rest of the test. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(msg.text());
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

/**
 * Console errors that are expected rather than defects: the browser logs every non-2xx
 * response, and some tests provoke 4xx responses on purpose.
 */
export function unexpected(problems: string[]) {
  return problems.filter((p) => !/Failed to load resource: the server responded with a status of 4\d\d/.test(p));
}

import { mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import type { FullConfig } from '@playwright/test';

export type E2eRole = 'EMPLOYEE' | 'SUPPORT_ENGINEER' | 'MANAGER' | 'ADMIN';

export interface E2eUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: E2eRole;
  department: string;
}

export const STATE_FILE = path.join(__dirname, '.state', 'users.json');

/**
 * Creates a fresh set of users for this run: registers them through the public API, then an
 * existing admin (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD) gives each its role. Emails use
 * E2E_EMAIL_DOMAIN (default e2e.local) so the data is easy to find and remove afterwards.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3000';
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (an existing ADMIN account) to run the E2E tests.');
  }

  const domain = process.env.E2E_EMAIL_DOMAIN || 'e2e.local';
  const run = randomBytes(3).toString('hex');
  const department = `E2E-${run.toUpperCase()}`;

  const api = async (method: string, url: string, body?: unknown, token?: string) => {
    const res = await fetch(`${baseURL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}`);
    return res.status === 204 ? null : res.json();
  };

  const admin = await api('POST', '/api/auth/login', { email: adminEmail, password: adminPassword });

  const roles: [string, E2eRole][] = [
    ['employee', 'EMPLOYEE'],
    ['employee2', 'EMPLOYEE'],
    ['engineer', 'SUPPORT_ENGINEER'],
    ['manager', 'MANAGER'],
    ['admin', 'ADMIN'],
    ['pwchange', 'EMPLOYEE'],
  ];

  const users: Record<string, E2eUser> = {};
  for (const [key, role] of roles) {
    const email = `e2e-${key}-${run}@${domain}`;
    const password = `E2e-${randomBytes(8).toString('hex')}`;
    const name = `E2E ${key} ${run}`;
    const created = await api('POST', '/api/auth/register', { name, email, password, department });
    if (role !== 'EMPLOYEE') {
      await api('PATCH', `/api/users/${created.id}`, { role, department }, admin.token);
    }
    users[key] = { id: created.id, name, email, password, role, department };
  }

  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify({ run, department, users }, null, 2));
}

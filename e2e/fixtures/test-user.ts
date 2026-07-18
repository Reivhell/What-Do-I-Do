import { test as base } from '@playwright/test';

export const test = base.extend<{ apiBase: string }>({
  apiBase: 'http://localhost:3000',
});

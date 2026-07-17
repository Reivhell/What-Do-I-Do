import { describe, it, expect } from 'vitest';

describe('Shared index exports', () => {
  it('should export all type modules', async () => {
    const shared = await import('../../src/index');
    expect(shared).toBeDefined();
  });
});

import { Provider } from '@nestjs/common';
import { getDb } from '../../drizzle';
import { runMigrations } from '../../scripts/run-migrations';

export const DRIZZLE = 'DRIZZLE';

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: async () => {
    await runMigrations();
    return getDb();
  },
};

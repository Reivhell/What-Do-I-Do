import { Provider } from '@nestjs/common';
import { getDb } from '../../drizzle/index.js';

export const DRIZZLE = 'DRIZZLE';

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: async () => {
    return getDb();
  },
};

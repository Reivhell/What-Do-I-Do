import { Provider } from '@nestjs/common';
import { getDb } from '../../drizzle';

export const DRIZZLE = 'DRIZZLE';

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: () => getDb(),
};

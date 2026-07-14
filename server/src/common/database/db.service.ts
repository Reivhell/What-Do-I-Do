import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from './drizzle.provider';
import type { DbInstance } from '../../drizzle';

@Injectable()
export class DbService {
  constructor(@Inject(DRIZZLE) public readonly db: DbInstance) {}
}

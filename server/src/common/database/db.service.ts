import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from './drizzle.provider.js'
import type { DbInstance } from '../../drizzle/index.js'

@Injectable()
export class DbService {
  constructor(@Inject(DRIZZLE) public readonly db: DbInstance) {}
}

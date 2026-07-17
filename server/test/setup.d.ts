import type { DbInstance } from '../src/drizzle';
export declare function getTestDb(): DbInstance;
export declare function closeTestDb(): void;
export declare function resetTestDb(): void;
export declare function createTestUser(db: DbInstance, overrides?: Partial<{
    id: string;
    email: string;
    passwordHash: string;
}>): {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
};

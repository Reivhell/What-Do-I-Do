import { getDb } from './drizzle';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { users } from './drizzle/schema/users';
import { userProfiles, userPreferences, notificationSettings } from './drizzle/schema/settings';

async function seed() {
  const db = getDb();
  const userId = 'default';

  // Check if already seeded
  const existing = db.select().from(users).where(eq(users.id, userId)).all();
  if (existing.length > 0) {
    console.log('Default user already seeded, skipping...');
    process.exit(0);
  }

  // Seed user
  const now = new Date().toISOString();
  db.insert(users).values({ id: userId, email: 'default@local.local', createdAt: now, updatedAt: now }).run();

  // Seed profile
  db.insert(userProfiles).values({ userId, name: 'User', email: 'default@local.local', createdAt: now, updatedAt: now }).run();

  // Seed preferences
  db.insert(userPreferences).values({ userId, createdAt: now, updatedAt: now }).run();

  // Seed notifications
  db.insert(notificationSettings).values({ userId, createdAt: now, updatedAt: now }).run();

  console.log('Default user + settings seeded successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

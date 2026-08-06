import { randomUUID } from 'crypto';
import { Client } from 'pg';
import * as argon2 from 'argon2';
import { DATABASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD } from './test-user';

// Seeds a single, known email/password user directly in the Postgres
// database the backend reads from (see backend/prisma/schema.prisma's User
// model), so auth.spec.ts can log in through the real POST /auth/login
// endpoint. There's no public register endpoint to call instead (see
// backend/src/auth/auth.controller.ts) and the backend's own test suite
// never hits a real database (its auth spec files mock UsersService/Prisma
// entirely), so there is no existing fixture pattern to reuse - this seeds
// the row directly instead.
//
// The password is hashed with `argon2`, the same library the backend's
// AuthService.validateUser() uses to verify it (argon2.verify), so the
// seeded hash is a real, valid credential from the backend's point of view.
export default async function globalSetup() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
  } catch (error) {
    throw new Error(
      `[e2e] Could not connect to Postgres at ${DATABASE_URL} to seed the test user. ` +
        "Make sure the backend's database is running locally (see backend/docker-compose.yml) " +
        'and reachable, or set E2E_DATABASE_URL to point at the database your local backend ' +
        'actually uses. See e2e/README.md for details.',
      { cause: error },
    );
  }

  try {
    const passwordHash = await argon2.hash(TEST_USER_PASSWORD);

    // Upsert so re-running the suite against a database that already has
    // this fixture (from a previous run, or one global-teardown.ts failed to
    // clean up) is idempotent rather than erroring on the unique email.
    await client.query(
      `INSERT INTO "User" (id, email, "passwordHash", "authProvider", status, "createdAt", "updatedAt")
   VALUES ($1, $2, $3, 'email', 'active', NOW(), NOW())
   ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "updatedAt" = NOW()`,
      [randomUUID(), TEST_USER_EMAIL, passwordHash],
    );
  } finally {
    await client.end();
  }
}

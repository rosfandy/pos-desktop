import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './electron/database/migrations',
  schema: './electron/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/pos.db',
  },
});

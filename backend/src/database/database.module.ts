
import {
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';
export const DATABASE_POOL = 'DATABASE_POOL';

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
  ) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () =>
        new Pool({
          host: process.env.DB_HOST ?? 'localhost',
          port: Number(process.env.DB_PORT ?? 5432),
          user: process.env.DB_USER ?? 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME ?? '247_vtu',
        }),
    },
    {
      provide: DRIZZLE,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
    DatabaseShutdown,
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}

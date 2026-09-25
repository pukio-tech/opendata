import { Module } from '@nestjs/common';
import { MinceturModule } from './mincetur/mincetur.module';
import { PapaModule } from './papa/papa.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Rate Limiting para miles de peticiones (1,200 reqs por minuto por IP)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1200,
      },
    ]),
    MinceturModule,
    PapaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

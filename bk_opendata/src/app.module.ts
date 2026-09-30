import { Module } from '@nestjs/common';
import { MinceturModule } from './mincetur/mincetur.module';
import { PapaModule } from './papa/papa.module';
import { EmpresasModule } from './empresas/empresas.module';
import { MuseosModule } from './museos/museos.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
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
    PrismaModule,
    AuthModule,
    AdminModule,
    MinceturModule,
    PapaModule,
    EmpresasModule,
    MuseosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

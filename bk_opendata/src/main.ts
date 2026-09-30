import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Compresión Gzip/Deflate para reducir hasta 80% el tamaño de las respuestas JSON
  app.use(compression());

  // 2. Cabeceras de seguridad optimizadas para alta concurrencia
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  // 3. CORS configurable para permitir comunicación con el panel de administración
  const corsOriginEnv = process.env.CORS_ORIGIN || '*';
  const allowedOrigins = corsOriginEnv.includes(',')
    ? corsOriginEnv.split(',').map((o) => o.trim())
    : corsOriginEnv;

  app.enableCors({
    origin: allowedOrigins === '*' ? true : allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    credentials: true,
  });

  // 4. Transformación y validación automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 5. Logger Middleware de peticiones HTTP en vivo
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      logger.log(
        `[HTTP] ${method} ${originalUrl} -> ${statusCode} (${duration}ms)`,
      );
    });
    next();
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend OpenData Turismo Perú listo en http://localhost:${port}`);
}
bootstrap();

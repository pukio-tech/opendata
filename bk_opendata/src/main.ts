import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
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

  // 3. CORS de alto rendimiento
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend OpenData Turismo Perú listo en http://localhost:${port}`);
}
bootstrap();

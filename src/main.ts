import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : null;

  app.enableCors({
    origin: allowedOrigins
      ? allowedOrigins
      : (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
          // Em dev, permite qualquer localhost
          if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
            cb(null, true);
          } else {
            cb(new Error('Not allowed by CORS'));
          }
        },
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const swaggerPath = 'api-docs';
  
  // Prevent CDN/browser caching of Swagger docs
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Distribuidora de Gás API')
    .setDescription('API completa para gerenciamento de distribuidora de gás GLP')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: 'Distribuidora de Gás API',
    customCss: `
      .topbar { display: none; }
      .swagger-ui .info .title { color: #2c3e50; font-size: 2.5rem; font-weight: 600; }
      .swagger-ui .info .description { color: #34495e; font-size: 1.1rem; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #ecf0f1; padding: 20px; border-radius: 8px; }
      .swagger-ui .opblock { border-radius: 8px; margin-bottom: 15px; border: 1px solid #bdc3c7; }
      .swagger-ui .opblock .opblock-summary { padding: 15px; }
      .swagger-ui .opblock-tag { font-size: 1.5rem; color: #2c3e50; font-weight: 600; margin-top: 30px; }
      .swagger-ui .parameter__name, .swagger-ui .parameter__type { color: #2c3e50; font-weight: 600; }
      .swagger-ui table thead tr th { color: #2c3e50; font-weight: 600; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }
    `,
    customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🔥</text></svg>',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/${swaggerPath}`);
}
bootstrap();

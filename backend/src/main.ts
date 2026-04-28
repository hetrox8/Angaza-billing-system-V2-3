import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { CompanyMiddleware } from './common/middleware/company.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { CompaniesService } from './companies/companies.service';
import { RadiusUsersService } from './radius-users/radius-users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS - allow frontend dev server and production domains
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:80',
    'http://localhost',
  ];
  app.enableCors({ origin: allowedOrigins, credentials: true });

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Angaza Billing System API')
    .setDescription('API documentation for Angaza Billing System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Rate limiting middleware (applied first)
  app.use(new RateLimitMiddleware().use);

  // Company middleware - must be bound properly to preserve `this`
  const companyMiddleware = new CompanyMiddleware(app.get(CompaniesService));
  app.use((req: any, res: any, next: any) => companyMiddleware.use(req, res, next));

  // Initialize FreeRADIUS tables on startup
  if (process.env.NODE_ENV !== 'test') {
    try {
      const radiusService = app.get(RadiusUsersService);
      await radiusService.initializeRadiusTables();
    } catch (error: any) {
      console.warn('Failed to initialize FreeRADIUS tables (will retry on first use):', error.message);
    }
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Angaza backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api`);
}
bootstrap();

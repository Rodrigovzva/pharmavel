import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Seguridad
  app.use(helmet());
  app.use(cookieParser());

  // CORS (Authorization explícito para que el navegador envíe el Bearer token)
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://10.0.0.3:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación global (forbidNonWhitelisted: false para evitar 500 por propiedades extra)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Pharmavel API')
    .setDescription('API para Sistema de Distribución de Insumos Médicos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend corriendo en http://0.0.0.0:${port}`);
  console.log(`📚 Documentación API en http://0.0.0.0:${port}/api`);
}

bootstrap();

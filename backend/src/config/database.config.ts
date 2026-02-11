import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', '10.0.0.3'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', 'Rvel8080Ipv6**'),
  database: configService.get<string>('DB_DATABASE', 'pharmavelbd'),
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  synchronize: true, // Crear tablas automáticamente
  logging: configService.get<string>('NODE_ENV') === 'development',
  timezone: 'Z',
  charset: 'utf8mb4',
});

// Para migraciones
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', '10.0.0.3'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', 'Rvel8080Ipv6**'),
  database: configService.get<string>('DB_DATABASE', 'pharmavelbd'),
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  timezone: 'Z',
  charset: 'utf8mb4',
});

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ProductosModule } from './modules/productos/productos.module';
import { AlmacenesModule } from './modules/almacenes/almacenes.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { CuentasCobrarModule } from './modules/cuentas-cobrar/cuentas-cobrar.module';
import { AdministracionModule } from './modules/administracion/administracion.module';
import { TrazabilidadModule } from './modules/trazabilidad/trazabilidad.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { IngresosModule } from './modules/ingresos/ingresos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    ClientesModule,
    ProductosModule,
    AlmacenesModule,
    VentasModule,
    CuentasCobrarModule,
    AdministracionModule,
    TrazabilidadModule,
    ReportesModule,
    InventarioModule,
    ProveedoresModule,
    IngresosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

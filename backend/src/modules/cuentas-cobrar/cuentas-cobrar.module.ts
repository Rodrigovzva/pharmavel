import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentasCobrarController } from './cuentas-cobrar.controller';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { CuentaCobrar } from '../../entities/cuenta-cobrar.entity';
import { Venta } from '../../entities/venta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CuentaCobrar, Venta])],
  controllers: [CuentasCobrarController],
  providers: [CuentasCobrarService],
  exports: [CuentasCobrarService],
})
export class CuentasCobrarModule {}

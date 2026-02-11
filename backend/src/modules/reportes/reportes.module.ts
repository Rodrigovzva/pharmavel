import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Venta } from '../../entities/venta.entity';
import { Producto } from '../../entities/producto.entity';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { CuentaCobrar } from '../../entities/cuenta-cobrar.entity';
import { Ingreso } from '../../entities/ingreso.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venta,
      Producto,
      MovimientoInventario,
      CuentaCobrar,
      Ingreso,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}

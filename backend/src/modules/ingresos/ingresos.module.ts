import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingreso } from '../../entities/ingreso.entity';
import { IngresoDetalle } from '../../entities/ingreso-detalle.entity';
import { Producto } from '../../entities/producto.entity';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { IngresosController } from './ingresos.controller';
import { IngresosService } from './ingresos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingreso, IngresoDetalle, Producto, MovimientoInventario]),
  ],
  controllers: [IngresosController],
  providers: [IngresosService],
  exports: [IngresosService],
})
export class IngresosModule {}

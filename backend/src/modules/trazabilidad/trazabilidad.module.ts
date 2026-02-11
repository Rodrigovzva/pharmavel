import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrazabilidadController } from './trazabilidad.controller';
import { TrazabilidadService } from './trazabilidad.service';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { IngresoDetalle } from '../../entities/ingreso-detalle.entity';
import { VentaDetalle } from '../../entities/venta-detalle.entity';
import { Producto } from '../../entities/producto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovimientoInventario,
      IngresoDetalle,
      VentaDetalle,
      Producto,
    ]),
  ],
  controllers: [TrazabilidadController],
  providers: [TrazabilidadService],
  exports: [TrazabilidadService],
})
export class TrazabilidadModule {}

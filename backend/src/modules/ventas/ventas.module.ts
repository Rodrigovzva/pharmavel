import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { Venta } from '../../entities/venta.entity';
import { VentaDetalle } from '../../entities/venta-detalle.entity';
import { Producto } from '../../entities/producto.entity';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { Almacen } from '../../entities/almacen.entity';
import { CuentaCobrar } from '../../entities/cuenta-cobrar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venta,
      VentaDetalle,
      Producto,
      MovimientoInventario,
      Almacen,
      CuentaCobrar,
    ]),
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}

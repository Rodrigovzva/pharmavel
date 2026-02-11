import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IngresoDetalle } from './ingreso-detalle.entity';
import { VentaDetalle } from './venta-detalle.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  codigo: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 100, nullable: true })
  categoria: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 50, default: 'UNIDAD' })
  unidad_medida: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precio_compra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precio_venta: number;

  @Column({ type: 'int', default: 0 })
  stock_minimo: number;

  @Column({ type: 'text', nullable: true })
  imagen: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => IngresoDetalle, (detalle) => detalle.producto)
  ingresos_detalle: IngresoDetalle[];

  @OneToMany(() => VentaDetalle, (detalle) => detalle.producto)
  ventas_detalle: VentaDetalle[];

  @OneToMany(() => MovimientoInventario, (movimiento) => movimiento.producto)
  movimientos: MovimientoInventario[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

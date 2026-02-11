import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Ingreso } from './ingreso.entity';
import { Producto } from './producto.entity';

@Entity('ingreso_detalle')
export class IngresoDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ingreso, (ingreso) => ingreso.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingreso_id' })
  ingreso: Ingreso;

  @Column()
  ingreso_id: number;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column()
  producto_id: number;

  @Column({ length: 50 })
  lote: string;

  @Column({ type: 'date' })
  fecha_vencimiento: Date;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  created_at: Date;
}

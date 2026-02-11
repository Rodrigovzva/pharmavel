import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Producto } from './producto.entity';
import { Almacen } from './almacen.entity';
import { Usuario } from './usuario.entity';

@Entity('movimientos_inventario')
export class MovimientoInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column()
  producto_id: number;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column()
  almacen_id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  usuario_id: number;

  @Column({ length: 50 })
  tipo: string;

  @Column({ length: 50 })
  origen: string;

  @Column({ nullable: true })
  origen_id: number;

  @Column({ length: 50 })
  lote: string;

  @Column({ type: 'date' })
  fecha_vencimiento: Date;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'int' })
  stock_anterior: number;

  @Column({ type: 'int' })
  stock_actual: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  created_at: Date;
}

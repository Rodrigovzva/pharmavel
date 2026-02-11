import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ingreso } from './ingreso.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';

@Entity('almacenes')
export class Almacen {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Ingreso, (ingreso) => ingreso.almacen)
  ingresos: Ingreso[];

  @OneToMany(() => MovimientoInventario, (movimiento) => movimiento.almacen)
  movimientos: MovimientoInventario[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

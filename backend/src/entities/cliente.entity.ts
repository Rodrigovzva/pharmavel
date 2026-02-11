import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Venta } from './venta.entity';
import { CuentaCobrar } from './cuenta-cobrar.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 200, nullable: true })
  razon_social: string;

  @Column({ length: 20, nullable: true })
  nit: string;

  @Column({ length: 100, nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 20, nullable: true })
  telefono_secundario: string;

  @Column({ length: 100, nullable: true })
  zona: string;

  @Column({ length: 100, nullable: true })
  gps: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  fotografia: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Venta, (venta) => venta.cliente)
  ventas: Venta[];

  @OneToMany(() => CuentaCobrar, (cuenta) => cuenta.cliente)
  cuentas_cobrar: CuentaCobrar[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

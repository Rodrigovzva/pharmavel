import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Venta } from './venta.entity';

@Entity('cuentas_cobrar')
export class CuentaCobrar {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  cliente_id: number;

  @ManyToOne(() => Venta, { nullable: true })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @Column({ nullable: true })
  venta_id: number;

  @Column({ length: 50 })
  numero_documento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto_total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_pagado: number;

  @Column({ type: 'date' })
  fecha_emision: Date;

  @Column({ type: 'date' })
  fecha_vencimiento: Date;

  @Column({ type: 'date', nullable: true })
  fecha_pago: Date;

  @Column({ length: 50, default: 'PENDIENTE' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

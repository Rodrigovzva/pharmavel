import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { CuentaCobrar } from '../../entities/cuenta-cobrar.entity';
import { Venta } from '../../entities/venta.entity';
import { CreateCuentaCobrarDto } from './dto/create-cuenta-cobrar.dto';
import { UpdateCuentaCobrarDto } from './dto/update-cuenta-cobrar.dto';

@Injectable()
export class CuentasCobrarService {
  constructor(
    @InjectRepository(CuentaCobrar)
    private cuentaCobrarRepository: Repository<CuentaCobrar>,
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
  ) {}

  async create(createDto: CreateCuentaCobrarDto): Promise<CuentaCobrar> {
    const cuenta = this.cuentaCobrarRepository.create(createDto);
    return this.cuentaCobrarRepository.save(cuenta);
  }

  async findAll(): Promise<CuentaCobrar[]> {
    return this.cuentaCobrarRepository.find({
      relations: ['cliente', 'venta', 'venta.almacen'],
      order: { fecha_vencimiento: 'ASC' },
    });
  }

  async findVencidas(): Promise<CuentaCobrar[]> {
    const hoy = new Date();
    return this.cuentaCobrarRepository.find({
      where: {
        estado: 'PENDIENTE',
        fecha_vencimiento: Between(new Date(0), hoy),
      },
      relations: ['cliente', 'venta', 'venta.almacen'],
    });
  }

  /** Cuentas PENDIENTES que vencen en los próximos N días (por defecto 7). */
  async findPorVencer(dias: number = 7): Promise<CuentaCobrar[]> {
    const hoy = new Date();
    const hoySolo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const limite = new Date(hoySolo);
    limite.setDate(limite.getDate() + Math.max(1, dias));
    const hoyStr = hoySolo.toISOString().slice(0, 10);
    const limiteStr = limite.toISOString().slice(0, 10);
    return this.cuentaCobrarRepository
      .createQueryBuilder('cuenta')
      .leftJoinAndSelect('cuenta.cliente', 'cliente')
      .leftJoinAndSelect('cuenta.venta', 'venta')
      .leftJoinAndSelect('venta.almacen', 'almacen')
      .where('cuenta.estado = :estado', { estado: 'PENDIENTE' })
      .andWhere('cuenta.fecha_vencimiento BETWEEN :hoy AND :limite', { hoy: hoyStr, limite: limiteStr })
      .orderBy('cuenta.fecha_vencimiento', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<CuentaCobrar> {
    const cuenta = await this.cuentaCobrarRepository.findOne({
      where: { id },
      relations: ['cliente', 'venta', 'venta.almacen'],
    });
    if (!cuenta) {
      throw new NotFoundException(`Cuenta por cobrar con ID ${id} no encontrada`);
    }
    return cuenta;
  }

  async update(id: number, updateDto: UpdateCuentaCobrarDto): Promise<CuentaCobrar> {
    const cuenta = await this.findOne(id);
    Object.assign(cuenta, updateDto);
    return this.cuentaCobrarRepository.save(cuenta);
  }

  async registrarPago(id: number, monto: number): Promise<CuentaCobrar> {
    const cuenta = await this.findOne(id);
    const montoPagado = Number(cuenta.monto_pagado) || 0;
    const montoTotal = Number(cuenta.monto_total) || 0;
    const nuevoPagado = Math.round((montoPagado + Number(monto)) * 100) / 100;
    const esPagado = nuevoPagado >= montoTotal;

    const montoRedondeado = Number(nuevoPagado.toFixed(2));
    const estadoNuevo = esPagado ? 'PAGADO' : cuenta.estado;
    const fechaPagoNueva = esPagado ? new Date() : cuenta.fecha_pago;

    await this.cuentaCobrarRepository.query(
      'UPDATE cuentas_cobrar SET monto_pagado = ?, estado = ?, fecha_pago = ? WHERE id = ?',
      [montoRedondeado, estadoNuevo, fechaPagoNueva, id],
    );

    return this.findOne(id);
  }

  /**
   * Crea cuentas por cobrar para ventas a crédito que aún no tienen una.
   * Útil cuando las ventas se registraron antes de implementar la creación automática.
   */
  async sincronizarDesdeVentas(): Promise<{ creadas: number; ventas: any[] }> {
    const ventasCredito = await this.ventaRepository.find({
      where: { tipo_pago: 'CREDITO' },
      relations: ['cliente'],
    });
    if (ventasCredito.length === 0) {
      return { creadas: 0, ventas: [] };
    }
    const ventaIds = ventasCredito.map((v) => v.id);
    const existentes = await this.cuentaCobrarRepository.find({
      where: { venta_id: In(ventaIds) },
      select: ['venta_id'],
    });
    const ventaIdsConCuenta = new Set(existentes.map((c) => c.venta_id).filter(Boolean));
    const ventasSinCuenta = ventasCredito.filter((v) => !ventaIdsConCuenta.has(v.id));
    let creadas = 0;
    for (const venta of ventasSinCuenta) {
      const fechaEmision = venta.fecha ? new Date(venta.fecha) : new Date();
      let fechaVenc: Date;
      const flp = (venta as any).fecha_limite_pago;
      if (flp != null && flp instanceof Date && !Number.isNaN(flp.getTime())) {
        fechaVenc = new Date(flp.getFullYear(), flp.getMonth(), flp.getDate());
      } else if (typeof flp === 'string' && flp.trim() !== '') {
        fechaVenc = new Date(flp.trim());
        if (Number.isNaN(fechaVenc.getTime())) {
          fechaVenc = new Date(fechaEmision);
          fechaVenc.setDate(fechaVenc.getDate() + 30);
        }
      } else {
        fechaVenc = new Date(fechaEmision);
        fechaVenc.setDate(fechaVenc.getDate() + 30);
      }
      const cuenta = this.cuentaCobrarRepository.create({
        cliente_id: venta.cliente_id,
        venta_id: venta.id,
        numero_documento: venta.numero_factura ?? `V-${venta.id}`,
        monto_total: venta.total ?? 0,
        monto_pagado: 0,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVenc,
        estado: 'PENDIENTE',
        observaciones: `Venta a crédito ${venta.numero_factura ?? venta.id}`,
      });
      await this.cuentaCobrarRepository.save(cuenta);
      creadas++;
    }
    return { creadas, ventas: ventasSinCuenta.map((v) => ({ id: v.id, numero_factura: v.numero_factura })) };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Venta } from '../../entities/venta.entity';
import { Producto } from '../../entities/producto.entity';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity';
import { CuentaCobrar } from '../../entities/cuenta-cobrar.entity';
import { Ingreso } from '../../entities/ingreso.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(MovimientoInventario)
    private movimientoRepository: Repository<MovimientoInventario>,
    @InjectRepository(CuentaCobrar)
    private cuentaCobrarRepository: Repository<CuentaCobrar>,
    @InjectRepository(Ingreso)
    private ingresoRepository: Repository<Ingreso>,
  ) {}

  async generarReporteVentas(fechaInicio: Date, fechaFin: Date, formato: 'pdf' | 'excel') {
    const ventas = await this.ventaRepository.find({
      where: {
        fecha: Between(fechaInicio, fechaFin),
      },
      relations: ['cliente', 'detalles', 'detalles.producto'],
    });

    if (formato === 'excel') {
      return this.generarExcelVentas(ventas);
    } else {
      return this.generarPDFVentas(ventas);
    }
  }

  async generarReporteStockBajo(formato: 'pdf' | 'excel') {
    const productos = await this.productoRepository
      .createQueryBuilder('producto')
      .where('producto.stock_minimo > 0')
      .getMany();

    // TODO: Calcular stock real por almacén y lote

    if (formato === 'excel') {
      return this.generarExcelStockBajo(productos);
    } else {
      return this.generarPDFStockBajo(productos);
    }
  }

  async generarReporteKardex(productoId: number, fechaInicio: Date, fechaFin: Date, formato: 'pdf' | 'excel') {
    const movimientos = await this.movimientoRepository.find({
      where: {
        producto_id: productoId,
        created_at: Between(fechaInicio, fechaFin),
      },
      relations: ['almacen', 'usuario'],
      order: { created_at: 'ASC' },
    });

    if (formato === 'excel') {
      return this.generarExcelKardex(movimientos);
    } else {
      return this.generarPDFKardex(movimientos);
    }
  }

  async generarReporteCuentasVencidas(formato: 'pdf' | 'excel') {
    const hoy = new Date();
    const cuentas = await this.cuentaCobrarRepository.find({
      where: {
        estado: 'PENDIENTE',
        fecha_vencimiento: Between(new Date(0), hoy),
      },
      relations: ['cliente'],
    });

    if (formato === 'excel') {
      return this.generarExcelCuentasVencidas(cuentas);
    } else {
      return this.generarPDFCuentasVencidas(cuentas);
    }
  }

  // Métodos auxiliares para generar Excel
  private async generarExcelVentas(ventas: Venta[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas');

    worksheet.columns = [
      { header: 'Número Factura', key: 'numero_factura', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Total', key: 'total', width: 15 },
    ];

    ventas.forEach((venta) => {
      worksheet.addRow({
        numero_factura: venta.numero_factura,
        fecha: venta.fecha,
        cliente: venta.cliente?.nombre,
        total: venta.total,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generarExcelStockBajo(productos: Producto[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Bajo');

    worksheet.columns = [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 40 },
      { header: 'Stock Mínimo', key: 'stock_minimo', width: 15 },
    ];

    productos.forEach((producto) => {
      worksheet.addRow({
        codigo: producto.codigo,
        nombre: producto.nombre,
        stock_minimo: producto.stock_minimo,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generarExcelKardex(movimientos: MovimientoInventario[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kardex');

    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Lote', key: 'lote', width: 15 },
      { header: 'Cantidad', key: 'cantidad', width: 15 },
      { header: 'Stock Anterior', key: 'stock_anterior', width: 15 },
      { header: 'Stock Actual', key: 'stock_actual', width: 15 },
    ];

    movimientos.forEach((mov) => {
      worksheet.addRow({
        fecha: mov.created_at,
        tipo: mov.tipo,
        lote: mov.lote,
        cantidad: mov.cantidad,
        stock_anterior: mov.stock_anterior,
        stock_actual: mov.stock_actual,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generarExcelCuentasVencidas(cuentas: CuentaCobrar[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cuentas Vencidas');

    worksheet.columns = [
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Monto Total', key: 'monto_total', width: 15 },
      { header: 'Monto Pagado', key: 'monto_pagado', width: 15 },
      { header: 'Saldo', key: 'saldo', width: 15 },
      { header: 'Fecha Vencimiento', key: 'fecha_vencimiento', width: 20 },
    ];

    cuentas.forEach((cuenta) => {
      worksheet.addRow({
        cliente: cuenta.cliente?.nombre,
        monto_total: cuenta.monto_total,
        monto_pagado: cuenta.monto_pagado,
        saldo: cuenta.monto_total - cuenta.monto_pagado,
        fecha_vencimiento: cuenta.fecha_vencimiento,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Métodos auxiliares para generar PDF
  private async generarPDFVentas(ventas: Venta[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.fontSize(20).text('Reporte de Ventas', { align: 'center' });
      doc.moveDown();

      ventas.forEach((venta) => {
        doc.fontSize(12).text(`${venta.numero_factura} - ${venta.cliente?.nombre} - $${venta.total}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  private async generarPDFStockBajo(productos: Producto[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.fontSize(20).text('Reporte de Stock Bajo', { align: 'center' });
      doc.moveDown();

      productos.forEach((producto) => {
        doc.fontSize(12).text(`${producto.codigo} - ${producto.nombre} - Mínimo: ${producto.stock_minimo}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  private async generarPDFKardex(movimientos: MovimientoInventario[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.fontSize(20).text('Kardex', { align: 'center' });
      doc.moveDown();

      movimientos.forEach((mov) => {
        doc.fontSize(10).text(
          `${mov.created_at.toLocaleDateString()} - ${mov.tipo} - Lote: ${mov.lote} - Cantidad: ${mov.cantidad}`,
        );
        doc.moveDown(0.3);
      });

      doc.end();
    });
  }

  private async generarPDFCuentasVencidas(cuentas: CuentaCobrar[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.fontSize(20).text('Cuentas Vencidas', { align: 'center' });
      doc.moveDown();

      cuentas.forEach((cuenta) => {
        const saldo = cuenta.monto_total - cuenta.monto_pagado;
        doc.fontSize(12).text(
          `${cuenta.cliente?.nombre} - Saldo: $${saldo} - Vence: ${cuenta.fecha_vencimiento.toLocaleDateString()}`,
        );
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}

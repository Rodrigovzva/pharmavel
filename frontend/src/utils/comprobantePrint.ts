import { formatCurrency } from './currency';
import { montoEnLiteral as toLiteral } from './montoEnLiteral';

export { montoEnLiteral } from './montoEnLiteral';

const STYLE = [
  'body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; max-width: 800px; margin: 0 auto; }',
  '.titulo { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }',
  '.row { margin: 4px 0; }',
  '.grid2 { display: flex; gap: 24px; margin: 12px 0; }',
  '.grid2 > div { flex: 1; }',
  'table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }',
  'th, td { border: 1px solid #333; padding: 6px; text-align: left; }',
  'th { background: #e0e0e0; font-weight: bold; }',
  '.text-right { text-align: right; }',
  '.mt { margin-top: 16px; }',
  '.strong { font-weight: bold; }',
  '.firmas { display: flex; justify-content: space-around; margin-top: 40px; padding-top: 60px; }',
  '.firma-box { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 8px; font-size: 11px; }',
  '.literal { margin: 12px 0; padding: 8px; background: #f9f9f9; border: 1px solid #ddd; }',
].join('\n');

function escapeHtml(s: string | number | undefined | null): string {
  if (s == null) return '-';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d: string | Date | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es');
}

function fmtTime(d: string | Date | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function printComprobanteIngreso(ingreso: {
  id: number;
  numero_documento: string;
  fecha?: string;
  created_at?: string;
  total?: number;
  observaciones?: string;
  proveedor?: { nombre?: string; nit?: string; direccion?: string };
  almacen?: { nombre?: string };
  detalles?: Array<{
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal?: number;
    producto?: { nombre?: string; codigo?: string; descripcion?: string; unidad_medida?: string };
  }>;
}): void {
  const detalles = (ingreso.detalles ?? [])
    .map((d) => {
      const desc = escapeHtml((d.producto?.descripcion || d.producto?.nombre) ?? String(d.producto_id));
      const cod = escapeHtml(d.producto?.codigo ?? '-');
      const un = escapeHtml(d.producto?.unidad_medida ?? 'UNIDAD');
      const imp = formatCurrency(Number(d.subtotal ?? d.cantidad * d.precio_unitario));
      return '<tr><td>' + desc + '</td><td>' + cod + '</td><td class="text-right">' + d.cantidad + '</td><td>' + un + '</td><td class="text-right">' + formatCurrency(Number(d.precio_unitario)) + '</td><td class="text-right">' + imp + '</td></tr>';
    })
    .join('');
  const total = Number(ingreso.total ?? 0);
  const literal = toLiteral(total);
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comprobante ' +
    escapeHtml(ingreso.numero_documento) +
    '</title><style>' +
    STYLE +
    '</style></head><body>' +
    '<div class="titulo">COMPROBANTE DE INGRESO A ALMACEN</div>' +
    '<div class="grid2"><div>' +
    '<div class="row"><strong>ID:</strong> ' +
    ingreso.id +
    '</div>' +
    '<div class="row"><strong>N. documento:</strong> ' +
    escapeHtml(ingreso.numero_documento) +
    '</div>' +
    '<div class="row"><strong>Proveedor:</strong> ' +
    escapeHtml(ingreso.proveedor?.nombre ?? '-') +
    '</div>' +
    '<div class="row"><strong>NIT:</strong> ' +
    escapeHtml(ingreso.proveedor?.nit ?? '-') +
    '</div>' +
    '<div class="row"><strong>Fecha:</strong> ' +
    fmtDate(ingreso.fecha) +
    '</div>' +
    '<div class="row"><strong>Hora:</strong> ' +
    fmtTime(ingreso.created_at) +
    '</div>' +
    '<div class="row"><strong>Direccion:</strong> ' +
    escapeHtml(ingreso.proveedor?.direccion ?? '-') +
    '</div>' +
    '<div class="row"><strong>Almacen:</strong> ' +
    escapeHtml(ingreso.almacen?.nombre ?? '-') +
    '</div></div></div>' +
    '<table><thead><tr><th>Descripcion</th><th>Codigo</th><th class="text-right">Cant.</th><th>Unidad</th><th class="text-right">Precio</th><th class="text-right">Importe</th></tr></thead><tbody>' +
    detalles +
    '</tbody></table>' +
    '<div class="mt"><div class="row strong">Total: ' +
    formatCurrency(total) +
    '</div>' +
    '<div class="literal"><strong>Monto en literal:</strong> ' +
    escapeHtml(literal) +
    '</div></div>' +
    (ingreso.observaciones ? '<div class="row mt">Observaciones: ' + escapeHtml(ingreso.observaciones) + '</div>' : '') +
    '<div class="firmas"><div class="firma-box">Entregado por<br><br></div><div class="firma-box">Recibido por<br><br></div></div></body></html>';
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = () => w.print();
  }
}

export function printComprobanteVenta(venta: {
  id: number;
  numero_factura: string;
  fecha?: string;
  created_at?: string;
  total?: number;
  tipo_pago?: string;
  observaciones?: string;
  cliente?: { nombre?: string; razon_social?: string; nit?: string; direccion?: string };
  detalles?: Array<{
    id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
    subtotal?: number;
    producto?: { nombre?: string; codigo?: string; descripcion?: string; unidad_medida?: string };
  }>;
}): void {
  const detalles = (venta.detalles ?? [])
    .map((d) => {
      const desc = escapeHtml((d.producto?.descripcion || d.producto?.nombre) ?? String(d.producto_id));
      const cod = escapeHtml(d.producto?.codigo ?? '-');
      const un = escapeHtml(d.producto?.unidad_medida ?? 'UNIDAD');
      const imp = formatCurrency(Number(d.subtotal ?? 0));
      return '<tr><td>' + desc + '</td><td>' + cod + '</td><td class="text-right">' + d.cantidad + '</td><td>' + un + '</td><td class="text-right">' + formatCurrency(Number(d.precio_unitario)) + '</td><td class="text-right">' + formatCurrency(Number(d.descuento ?? 0)) + '</td><td class="text-right">' + imp + '</td></tr>';
    })
    .join('');
  const total = Number(venta.total ?? 0);
  const literal = toLiteral(total);
  const formaPago = venta.tipo_pago === 'CREDITO' ? 'Credito' : 'Contado';
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comprobante ' +
    escapeHtml(venta.numero_factura) +
    '</title><style>' +
    STYLE +
    '</style></head><body>' +
    '<div class="titulo">COMPROBANTE DE VENTA</div>' +
    '<div class="grid2"><div>' +
    '<div class="row"><strong>ID:</strong> ' +
    venta.id +
    '</div>' +
    '<div class="row"><strong>Cliente:</strong> ' +
    escapeHtml(venta.cliente?.nombre ?? venta.cliente?.razon_social ?? '-') +
    '</div>' +
    '<div class="row"><strong>NIT:</strong> ' +
    escapeHtml(venta.cliente?.nit ?? '-') +
    '</div>' +
    '<div class="row"><strong>Fecha:</strong> ' +
    fmtDate(venta.fecha) +
    '</div>' +
    '<div class="row"><strong>Hora:</strong> ' +
    fmtTime(venta.created_at) +
    '</div>' +
    '<div class="row"><strong>Direccion:</strong> ' +
    escapeHtml(venta.cliente?.direccion ?? '-') +
    '</div></div></div>' +
    '<table><thead><tr><th>Descripcion</th><th>Codigo</th><th class="text-right">Cant.</th><th>Unidad</th><th class="text-right">Precio</th><th class="text-right">Desc.</th><th class="text-right">Importe</th></tr></thead><tbody>' +
    detalles +
    '</tbody></table>' +
    '<div class="mt"><div class="row"><strong>Forma de pago:</strong> ' +
    formaPago +
    '</div>' +
    '<div class="row"><strong>Total:</strong> ' +
    formatCurrency(total) +
    '</div>' +
    '<div class="literal"><strong>Monto en literal:</strong> ' +
    escapeHtml(literal) +
    '</div></div>' +
    (venta.observaciones ? '<div class="row mt">Observaciones: ' + escapeHtml(venta.observaciones) + '</div>' : '') +
    '<div class="firmas"><div class="firma-box">Entregado por<br><br></div><div class="firma-box">Recibido por<br><br></div></div></body></html>';
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = () => w.print();
  }
}

export function printComprobanteCuentaCobrar(cuenta: {
  id: number;
  numero_documento: string;
  fecha_emision?: string;
  created_at?: string;
  fecha_pago?: string;
  estado?: string;
  observaciones?: string;
  monto_total?: number;
  monto_pagado?: number;
  cliente?: { nombre?: string; nit?: string; direccion?: string };
}): void {
  const saldo = Number(cuenta.monto_total ?? 0) - Number(cuenta.monto_pagado ?? 0);
  const total = Number(cuenta.monto_total ?? 0);
  const literal = toLiteral(total);
  const desc = cuenta.observaciones || 'Cuenta por cobrar - Doc: ' + cuenta.numero_documento;
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comprobante ' +
    escapeHtml(cuenta.numero_documento) +
    '</title><style>' +
    STYLE +
    '</style></head><body>' +
    '<div class="titulo">COMPROBANTE DE CUENTA POR COBRAR</div>' +
    '<div class="grid2"><div>' +
    '<div class="row"><strong>ID:</strong> ' +
    cuenta.id +
    '</div>' +
    '<div class="row"><strong>Cliente:</strong> ' +
    escapeHtml(cuenta.cliente?.nombre ?? '-') +
    '</div>' +
    '<div class="row"><strong>NIT:</strong> ' +
    escapeHtml(cuenta.cliente?.nit ?? '-') +
    '</div>' +
    '<div class="row"><strong>Fecha:</strong> ' +
    fmtDate(cuenta.fecha_emision) +
    '</div>' +
    '<div class="row"><strong>Hora:</strong> ' +
    fmtTime(cuenta.created_at) +
    '</div>' +
    '<div class="row"><strong>Direccion:</strong> ' +
    escapeHtml(cuenta.cliente?.direccion ?? '-') +
    '</div>' +
    '<div class="row"><strong>N. documento:</strong> ' +
    escapeHtml(cuenta.numero_documento) +
    '</div>' +
    '<div class="row"><strong>Estado:</strong> ' +
    escapeHtml(cuenta.estado ?? '-') +
    '</div>' +
    '<div class="row"><strong>Descripcion:</strong> ' +
    escapeHtml(desc) +
    '</div></div></div>' +
    '<div class="mt">' +
    '<div class="row">Monto total: ' +
    formatCurrency(total) +
    '</div>' +
    '<div class="row">Monto pagado: ' +
    formatCurrency(Number(cuenta.monto_pagado ?? 0)) +
    '</div>' +
    '<div class="row strong">Saldo pendiente: ' +
    formatCurrency(saldo) +
    '</div>' +
    '<div class="literal mt"><strong>Monto en literal:</strong> ' +
    escapeHtml(literal) +
    '</div></div>' +
    (cuenta.fecha_pago ? '<div class="row mt">Fecha de pago: ' + fmtDate(cuenta.fecha_pago) + '</div>' : '') +
    '<div class="firmas"><div class="firma-box">Entregado por<br><br></div><div class="firma-box">Recibido por<br><br></div></div></body></html>';
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = () => w.print();
  }
}

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery } from '@tanstack/react-query';
import { clientesService } from '../services/clientesService';
import { almacenesService } from '../services/almacenesService';
import { productosService, Producto } from '../services/productosService';
import { inventarioService, StockPorLote } from '../services/inventarioService';
import { CreateVentaDto, VentaDetalleDto } from '../services/ventasService';
import { toast } from 'react-toastify';

function lotKey(producto_id: number, lote: string) {
  return `${producto_id}|${lote}`;
}

interface VentaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVentaDto) => Promise<void>;
}

const defaultDetalle: VentaDetalleDto = {
  producto_id: 0,
  lote: '',
  cantidad: 1,
  precio_unitario: 0,
  descuento: 0,
};

export default function VentaFormDialog({
  open,
  onClose,
  onSubmit,
}: VentaFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [almacenId, setAlmacenId] = useState<number | ''>('');
  const [descuento, setDescuento] = useState(0);
  const [tipoPago, setTipoPago] = useState('CONTADO');
  const [fechaLimitePago, setFechaLimitePago] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<VentaDetalleDto[]>([{ ...defaultDetalle }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultFechaLimitePago = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesService.getAll,
    enabled: open,
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesService.getAll,
    enabled: open,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: productosService.getAll,
    enabled: open,
  });

  const almacenIdNum = almacenId === '' ? undefined : Number(almacenId);
  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario', almacenIdNum],
    queryFn: () => inventarioService.getStockPorAlmacen(almacenIdNum),
    enabled: open && almacenIdNum != null && almacenIdNum > 0,
  });

  const { data: inventarioPorLote = [] } = useQuery({
    queryKey: ['inventario-por-lote', almacenIdNum],
    queryFn: () => inventarioService.getStockPorLote(almacenIdNum),
    enabled: open && almacenIdNum != null && almacenIdNum > 0,
  });

  const stockPorProducto = React.useMemo(() => {
    const map: Record<number, number> = {};
    inventario.forEach((item: { producto_id: number; cantidad: number }) => {
      map[item.producto_id] = item.cantidad;
    });
    return map;
  }, [inventario]);

  useEffect(() => {
    if (!open) {
      setClienteId('');
      setAlmacenId('');
      setDescuento(0);
      setTipoPago('CONTADO');
      setFechaLimitePago('');
      setObservaciones('');
      setDetalles([{ ...defaultDetalle }]);
      setErrors({});
    }
  }, [open]);

  const addDetalle = () => {
    setDetalles((prev) => [...prev, { ...defaultDetalle }]);
  };

  const removeDetalle = (index: number) => {
    if (detalles.length <= 1) return;
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDetalle = (index: number, field: keyof VentaDetalleDto, value: number | string) => {
    setDetalles((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = field === 'cantidad' || field === 'precio_unitario' || field === 'descuento' || field === 'producto_id' ? Number(value) : value;
      return next;
    });
  };

  /** Stock disponible para este (producto_id, lote) en la fila index: total del lote menos lo ya en otras filas, más lo de esta fila. */
  const getStockDisponibleParaFila = (index: number, productoId: number, lote: string) => {
    const lot = inventarioPorLote.find(
      (l: StockPorLote) => l.producto_id === productoId && l.lote === lote,
    ) as StockPorLote | undefined;
    if (!lot) return 0;
    const totalAsignado = detalles
      .filter((d) => d.producto_id === productoId && d.lote === lote)
      .reduce((s, d) => s + d.cantidad, 0);
    const estaFila = detalles[index]?.producto_id === productoId && detalles[index]?.lote === lote ? detalles[index].cantidad : 0;
    return lot.cantidad - totalAsignado + estaFila;
  };

  const onLoteChange = (index: number, value: string) => {
    if (!value) {
      updateDetalle(index, 'producto_id', 0);
      updateDetalle(index, 'lote', '');
      updateDetalle(index, 'precio_unitario', 0);
      return;
    }
    const [productoIdStr, lote] = value.split('|');
    const productoId = Number(productoIdStr);
    const producto = productos.find((p: Producto) => p.id === productoId);
    const lot = inventarioPorLote.find(
      (l: StockPorLote) => l.producto_id === productoId && l.lote === lote,
    ) as StockPorLote | undefined;
    if (lot && producto) {
      setDetalles((prev) => {
        const next = [...prev];
        (next[index] as VentaDetalleDto).producto_id = productoId;
        (next[index] as VentaDetalleDto).lote = lote;
        (next[index] as VentaDetalleDto).precio_unitario = Number(producto.precio_venta) || 0;
        (next[index] as VentaDetalleDto).cantidad = Math.min(
          (next[index] as VentaDetalleDto).cantidad || 1,
          lot.cantidad,
        );
        return next;
      });
    }
  };

  const detalleLoteValue = (det: VentaDetalleDto) =>
    det.producto_id && det.lote ? lotKey(det.producto_id, det.lote) : '';

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!clienteId) err.cliente_id = 'Seleccione un cliente';
    if (!almacenId) err.almacen_id = 'Seleccione un almacén';
    const detallesValidos = detalles.filter((d) => d.producto_id > 0 && d.lote && d.cantidad > 0);
    if (detallesValidos.length === 0) err.detalles = 'Agregue al menos un producto (por lote) con cantidad';
    setErrors(err);
    if (Object.keys(err).length > 0) return false;
    // Validar que por cada (producto_id, lote) no se exceda el stock del lote
    const porLote = new Map<string, number>();
    detallesValidos.forEach((d) => {
      const key = lotKey(d.producto_id, d.lote);
      porLote.set(key, (porLote.get(key) ?? 0) + d.cantidad);
    });
    const lotFromApi = new Map<string, number>();
    inventarioPorLote.forEach((l: StockPorLote) => {
      lotFromApi.set(lotKey(l.producto_id, l.lote), l.cantidad);
    });
    for (const [key, solicitado] of porLote) {
      const disponible = lotFromApi.get(key) ?? 0;
      if (solicitado > disponible) {
        const [pid, lote] = key.split('|');
        const p = productos.find((x: Producto) => x.id === Number(pid));
        err.detalles = `Stock insuficiente en lote ${lote}${p ? ` (${p.nombre})` : ''}. Disponible: ${disponible}, solicitado: ${solicitado}.`;
        setErrors(err);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const detallesEnviar = detalles
      .filter((d) => d.producto_id > 0 && d.lote && d.cantidad > 0)
      .map((d) => ({
        producto_id: d.producto_id,
        lote: d.lote || 'LOTE-1',
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        descuento: d.descuento ?? 0,
      }));
    if (detallesEnviar.length === 0) {
      setErrors({ detalles: 'Agregue al menos un producto con cantidad' });
      return;
    }

    if (almacenIdNum != null && inventarioPorLote.length > 0) {
      const porLote = new Map<string, number>();
      detallesEnviar.forEach((d) => {
        const key = lotKey(d.producto_id, d.lote);
        porLote.set(key, (porLote.get(key) ?? 0) + d.cantidad);
      });
      const lotFromApi = new Map<string, number>();
      inventarioPorLote.forEach((l: StockPorLote) => {
        lotFromApi.set(lotKey(l.producto_id, l.lote), l.cantidad);
      });
      for (const [key, solicitado] of porLote) {
        const disponible = lotFromApi.get(key) ?? 0;
        if (solicitado > disponible) {
          const [pid, lote] = key.split('|');
          const p = productos.find((x: Producto) => x.id === Number(pid));
          toast.error(`Stock insuficiente en lote ${lote}${p ? ` (${p.nombre})` : ''}. Disponible: ${disponible}, solicitado: ${solicitado}.`);
          setErrors({ detalles: `Stock insuficiente en lote. Disponible: ${disponible}.` });
          return;
        }
      }
    } else if (almacenIdNum != null) {
      const cantidadPorProducto: Record<number, number> = {};
      detallesEnviar.forEach((d) => {
        cantidadPorProducto[d.producto_id] = (cantidadPorProducto[d.producto_id] ?? 0) + d.cantidad;
      });
      for (const [pid, solicitado] of Object.entries(cantidadPorProducto)) {
        const disp = stockPorProducto[Number(pid)] ?? 0;
        if (solicitado > disp) {
          const p = productos.find((x: Producto) => x.id === Number(pid));
          const nombre = p ? `${p.nombre} (cód. ${p.codigo})` : `Producto ${pid}`;
          toast.error(`Stock insuficiente: ${nombre}. Disponible: ${disp}, solicitado: ${solicitado}.`);
          setErrors({ detalles: `Stock insuficiente para ${nombre}. Disponible: ${disp}.` });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        cliente_id: Number(clienteId),
        almacen_id: Number(almacenId),
        detalles: detallesEnviar,
        descuento,
        tipo_pago: tipoPago,
        fecha_limite_pago: tipoPago === 'CREDITO' && fechaLimitePago?.trim() ? fechaLimitePago.trim() : undefined,
        observaciones: observaciones || undefined,
      });
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : msg || e?.message || 'Error al registrar la venta';
      toast.error(text);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          maxHeight: fullScreen ? 'none' : '95vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ flexShrink: 0, py: 1.5 }}>Nueva Venta</DialogTitle>
      <DialogContent sx={{ flex: 1, overflowY: 'auto', pt: 0, pb: 0, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl fullWidth size="small" error={!!errors.cliente_id} required>
              <InputLabel>Cliente</InputLabel>
              <Select
                label="Cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value as number)}
              >
                {clientes.map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.cliente_id && <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.cliente_id}</Box>}
            </FormControl>
            <FormControl fullWidth size="small" error={!!errors.almacen_id} required>
              <InputLabel>Almacén</InputLabel>
              <Select
                label="Almacén"
                value={almacenId}
                onChange={(e) => setAlmacenId(e.target.value as number)}
              >
                {almacenes.map((a: any) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.almacen_id && <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.almacen_id}</Box>}
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Tipo de pago</InputLabel>
              <Select
                label="Tipo de pago"
                value={tipoPago}
                onChange={(e) => {
                  const v = e.target.value;
                  setTipoPago(v);
                  if (v === 'CREDITO' && !fechaLimitePago) setFechaLimitePago(defaultFechaLimitePago());
                  if (v === 'CONTADO') setFechaLimitePago('');
                }}
              >
                <MenuItem value="CONTADO">Contado</MenuItem>
                <MenuItem value="CREDITO">Crédito</MenuItem>
              </Select>
            </FormControl>
            {tipoPago === 'CREDITO' && (
              <TextField
                label="Fecha límite de pago"
                type="date"
                size="small"
                value={fechaLimitePago}
                onChange={(e) => setFechaLimitePago(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
            )}
            <TextField
              label="Descuento global"
              type="number"
              size="small"
              value={descuento}
              onChange={(e) => setDescuento(Number(e.target.value) || 0)}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ width: 140 }}
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Detalle de productos (seleccione por lote)
            {almacenIdNum != null && (
              <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                (Seleccione almacén primero para ver lotes disponibles)
              </Typography>
            )}
          </Typography>
          {errors.detalles && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem' }}>{errors.detalles}</Box>
          )}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto (lote)</TableCell>
                  {almacenIdNum != null && (
                    <TableCell align="right">Stock disp.</TableCell>
                  )}
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">P. unit. (Bs.)</TableCell>
                  <TableCell align="right">Descuento</TableCell>
                  <TableCell width={50} />
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((det, index) => {
                  const stockDispLote =
                    det.producto_id && det.lote
                      ? getStockDisponibleParaFila(index, det.producto_id, det.lote)
                      : null;
                  const stockDisp =
                    stockDispLote !== null
                      ? stockDispLote
                      : det.producto_id
                        ? (stockPorProducto[det.producto_id] ?? 0)
                        : null;
                  const sinStock = stockDisp !== null && det.cantidad > stockDisp;
                  return (
                  <TableRow key={index} sx={sinStock ? { bgcolor: 'error.light', '& .MuiTableCell-root': { color: 'error.contrastText' } } : undefined}>
                    <TableCell>
                      <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value={detalleLoteValue(det)}
                        onChange={(e) => onLoteChange(index, e.target.value as string)}
                        renderValue={(v) => {
                          if (!v) return 'Seleccione producto por lote';
                          const [pidStr, lote] = v.split('|');
                          const lot = inventarioPorLote.find(
                            (l: StockPorLote) =>
                              l.producto_id === Number(pidStr) && l.lote === lote,
                          ) as StockPorLote | undefined;
                          if (!lot) return 'Seleccione producto por lote';
                          const ven = lot.fecha_vencimiento
                            ? new Date(lot.fecha_vencimiento).toLocaleDateString()
                            : '-';
                          return `${lot.producto_codigo} - ${lot.producto_nombre} | Lote: ${lot.lote} | Stock: ${lot.cantidad} | Vence: ${ven}`;
                        }}
                      >
                        <MenuItem value="">
                          <em>Seleccione producto por lote</em>
                        </MenuItem>
                        {almacenIdNum != null &&
                          inventarioPorLote.map((lot: StockPorLote) => {
                            const key = lotKey(lot.producto_id, lot.lote);
                            const yaAsignado = detalles
                              .filter(
                                (d, i) =>
                                  d.producto_id === lot.producto_id &&
                                  d.lote === lot.lote &&
                                  i !== index,
                              )
                              .reduce((s, d) => s + d.cantidad, 0);
                            const disp = Math.max(0, lot.cantidad - yaAsignado);
                            const ven = lot.fecha_vencimiento
                              ? new Date(lot.fecha_vencimiento).toLocaleDateString()
                              : '-';
                            return (
                              <MenuItem key={key} value={key} disabled={disp <= 0}>
                                {lot.producto_codigo} - {lot.producto_nombre} | Lote: {lot.lote} |
                                Disp.: {disp} | Vence: {ven}
                              </MenuItem>
                            );
                          })}
                      </Select>
                    </TableCell>
                    {almacenIdNum != null && (
                      <TableCell align="right" sx={{ fontWeight: sinStock ? 'bold' : undefined }}>
                        {stockDisp !== null ? stockDisp : '-'}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={det.cantidad}
                        onChange={(e) => updateDetalle(index, 'cantidad', Number(e.target.value) || 0)}
                        inputProps={{ min: 1 }}
                        sx={{ width: 80 }}
                        error={sinStock}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={det.precio_unitario}
                        onChange={(e) => updateDetalle(index, 'precio_unitario', Number(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={det.descuento ?? 0}
                        onChange={(e) => updateDetalle(index, 'descuento', Number(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeDetalle(index)} disabled={detalles.length <= 1}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={addDetalle} size="small">
            Agregar línea
          </Button>

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
            fullWidth
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexShrink: 0, px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar venta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

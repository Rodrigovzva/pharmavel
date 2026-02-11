import { useEffect, useState } from 'react';
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
import { proveedoresService } from '../services/proveedoresService';
import { almacenesService } from '../services/almacenesService';
import { productosService, Producto } from '../services/productosService';
import { CreateIngresoDto, IngresoDetalleDto } from '../services/ingresosService';
import { toast } from 'react-toastify';

const defaultDetalle: IngresoDetalleDto = {
  producto_id: 0,
  lote: '',
  cantidad: 1,
  precio_unitario: 0,
  fecha_vencimiento: new Date().toISOString().slice(0, 10),
};

interface IngresoFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIngresoDto) => Promise<void>;
}

export default function IngresoFormDialog({ open, onClose, onSubmit }: IngresoFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [almacenId, setAlmacenId] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<IngresoDetalleDto[]>([{ ...defaultDetalle }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: proveedoresService.getAll,
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

  useEffect(() => {
    if (!open) {
      setProveedorId('');
      setAlmacenId('');
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

  const updateDetalle = (index: number, field: keyof IngresoDetalleDto, value: number | string) => {
    setDetalles((prev) => {
      const next = [...prev];
      (next[index] as any)[field] =
        field === 'cantidad' || field === 'precio_unitario' || field === 'producto_id'
          ? Number(value)
          : value;
      return next;
    });
  };

  const onProductoChange = (index: number, productoId: number) => {
    const producto = productos.find((p: Producto) => p.id === productoId);
    if (producto) {
      updateDetalle(index, 'producto_id', productoId);
      updateDetalle(index, 'precio_unitario', Number(producto.precio_compra) || 0);
      updateDetalle(index, 'lote', producto.codigo ? `LOTE-${producto.codigo}` : 'LOTE-1');
    } else {
      updateDetalle(index, 'producto_id', productoId);
    }
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!proveedorId) err.proveedor_id = 'Seleccione un proveedor';
    if (!almacenId) err.almacen_id = 'Seleccione un almacén';
    const validos = detalles.filter((d) => d.producto_id > 0 && d.cantidad > 0);
    if (validos.length === 0) err.detalles = 'Agregue al menos un producto con cantidad';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const detallesEnviar = detalles
      .filter((d) => d.producto_id > 0 && d.cantidad > 0)
      .map((d) => ({
        producto_id: d.producto_id,
        lote: d.lote || 'LOTE-1',
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        fecha_vencimiento: d.fecha_vencimiento || new Date().toISOString().slice(0, 10),
      }));
    if (detallesEnviar.length === 0) {
      setErrors({ detalles: 'Agregue al menos un producto con cantidad' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        proveedor_id: Number(proveedorId),
        almacen_id: Number(almacenId),
        detalles: detallesEnviar,
        observaciones: observaciones || undefined,
      });
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : msg || e?.message || 'Error al registrar el ingreso';
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
      <DialogTitle sx={{ flexShrink: 0, py: 1.5 }}>Nuevo ingreso a almacén</DialogTitle>
      <DialogContent sx={{ flex: 1, overflowY: 'auto', pt: 0, pb: 0, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl fullWidth size="small" error={!!errors.proveedor_id} required>
              <InputLabel>Proveedor</InputLabel>
              <Select
                label="Proveedor"
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value as number)}
              >
                {proveedores.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.proveedor_id && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.proveedor_id}</Box>
              )}
            </FormControl>
            <FormControl fullWidth size="small" error={!!errors.almacen_id} required>
              <InputLabel>Almacén destino</InputLabel>
              <Select
                label="Almacén destino"
                value={almacenId}
                onChange={(e) => setAlmacenId(e.target.value as number)}
              >
                {almacenes.map((a: any) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.almacen_id && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.almacen_id}</Box>
              )}
            </FormControl>
          </Box>

          <Typography variant="subtitle2">Detalle de productos</Typography>
          {errors.detalles && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem' }}>{errors.detalles}</Box>
          )}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>F. venc.</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">P. unit. (Bs.)</TableCell>
                  <TableCell width={50} />
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((det, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value={det.producto_id || ''}
                        onChange={(e) => onProductoChange(index, Number(e.target.value))}
                        renderValue={(v) => {
                          if (!v) return 'Seleccione producto';
                          const p = productos.find((x: Producto) => x.id === v);
                          return p ? `${p.codigo} - ${p.nombre}` : 'Seleccione producto';
                        }}
                      >
                        <MenuItem value="">
                          <em>Seleccione producto</em>
                        </MenuItem>
                        {productos.map((p: Producto) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.codigo} - {p.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={det.lote}
                        onChange={(e) => updateDetalle(index, 'lote', e.target.value)}
                        placeholder="Lote"
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="date"
                        value={det.fecha_vencimiento || ''}
                        onChange={(e) => updateDetalle(index, 'fecha_vencimiento', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 140 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={det.cantidad}
                        onChange={(e) => updateDetalle(index, 'cantidad', Number(e.target.value) || 0)}
                        inputProps={{ min: 1 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={det.precio_unitario}
                        onChange={(e) =>
                          updateDetalle(index, 'precio_unitario', Number(e.target.value) || 0)
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell padding="none">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeDetalle(index)}
                        disabled={detalles.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
          {isSubmitting ? 'Guardando...' : 'Registrar ingreso'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

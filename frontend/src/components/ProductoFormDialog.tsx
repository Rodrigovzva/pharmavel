import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { Producto, CreateProductoDto } from '../services/productosService';

interface ProductoFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductoDto) => Promise<void>;
  producto?: Producto | null;
  ultimoCodigo?: number;
}

export default function ProductoFormDialog({
  open,
  onClose,
  onSubmit,
  producto,
  ultimoCodigo = 0,
}: ProductoFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const generarSiguienteCodigo = () => {
    return String(ultimoCodigo + 1);
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductoDto>({
    defaultValues: {
      codigo: '',
      nombre: '',
      categoria: '',
      descripcion: '',
      unidad_medida: 'UNIDAD',
      precio_compra: 0,
      precio_venta: 0,
      stock_minimo: 0,
      imagen: '',
      activo: true,
    },
  });

  const codigoValue = watch('codigo');

  useEffect(() => {
    if (producto) {
      reset({
        codigo: producto.codigo,
        nombre: producto.nombre,
        categoria: producto.categoria || '',
        descripcion: producto.descripcion || '',
        unidad_medida: producto.unidad_medida || 'UNIDAD',
        precio_compra: producto.precio_compra || 0,
        precio_venta: producto.precio_venta || 0,
        stock_minimo: producto.stock_minimo || 0,
        imagen: producto.imagen || '',
        activo: producto.activo,
      });
    } else {
      // Para nuevo producto, el código se generará automáticamente al enviar
      reset({
        codigo: generarSiguienteCodigo(),
        nombre: '',
        categoria: '',
        descripcion: '',
        unidad_medida: 'UNIDAD',
        precio_compra: 0,
        precio_venta: 0,
        stock_minimo: 0,
        imagen: '',
        activo: true,
      });
    }
  }, [producto, reset, open, ultimoCodigo]);

  const handleFormSubmit = async (data: CreateProductoDto) => {
    try {
      // Si es un nuevo producto y no tiene código, generarlo automáticamente
      if (!producto && !data.codigo) {
        data.codigo = generarSiguienteCodigo();
      }
      
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error al guardar producto:', error);
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
      <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <DialogTitle sx={{ flexShrink: 0, py: 1.5 }}>{producto ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        <DialogContent sx={{ flex: 1, overflowY: 'auto', pt: 0, pb: 0, px: { xs: 2, sm: 3 } }}>
          <input type="hidden" {...register('codigo', { required: true })} value={producto ? codigoValue : generarSiguienteCodigo()} />
          <Grid container spacing={1.5} sx={{ pb: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                {...register('nombre', { required: 'El nombre es requerido' })}
                label="Nombre"
                fullWidth
                size="small"
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('categoria')} label="Categoría" fullWidth size="small" select SelectProps={{ native: true }}>
                <option value="insumo">Insumo</option>
                <option value="medicamento">Medicamento</option>
                <option value="limpieza">Limpieza</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('unidad_medida')} label="Unidad" fullWidth size="small" select SelectProps={{ native: true }}>
                <option value="UNIDAD">UNIDAD</option>
                <option value="CAJA">CAJA</option>
                <option value="PAQUETE">PAQUETE</option>
                <option value="BOLSA">BOLSA</option>
                <option value="LITRO">LITRO</option>
                <option value="KILO">KILO</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                {...register('precio_compra', { required: 'Requerido', valueAsNumber: true, min: { value: 0, message: '≥ 0' } })}
                label="Precio compra (Bs.)"
                type="number"
                fullWidth
                size="small"
                inputProps={{ step: '0.01', min: 0 }}
                error={!!errors.precio_compra}
                helperText={errors.precio_compra?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                {...register('precio_venta', { required: 'Requerido', valueAsNumber: true, min: { value: 0, message: '≥ 0' } })}
                label="Precio venta (Bs.)"
                type="number"
                fullWidth
                size="small"
                inputProps={{ step: '0.01', min: 0 }}
                error={!!errors.precio_venta}
                helperText={errors.precio_venta?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                {...register('stock_minimo', { valueAsNumber: true, min: { value: 0, message: '≥ 0' } })}
                label="Stock Mínimo"
                type="number"
                fullWidth
                size="small"
                inputProps={{ min: 0 }}
                error={!!errors.stock_minimo}
                helperText={errors.stock_minimo?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('imagen')} label="Imagen (URL)" fullWidth size="small" placeholder="URL" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField {...register('descripcion')} label="Descripción" fullWidth size="small" multiline minRows={1} maxRows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ flexShrink: 0, px: 3, py: 1.5 }}>
          <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

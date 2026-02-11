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
import { Almacen, CreateAlmacenDto } from '../services/almacenesService';

interface AlmacenFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAlmacenDto) => Promise<void>;
  almacen?: Almacen | null;
}

export default function AlmacenFormDialog({
  open,
  onClose,
  onSubmit,
  almacen,
}: AlmacenFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAlmacenDto>({
    defaultValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      observaciones: '',
      activo: true,
    },
  });

  useEffect(() => {
    if (almacen) {
      reset({
        nombre: almacen.nombre,
        direccion: almacen.direccion || '',
        telefono: almacen.telefono || '',
        observaciones: almacen.observaciones || '',
        activo: almacen.activo,
      });
    } else {
      reset({
        nombre: '',
        direccion: '',
        telefono: '',
        observaciones: '',
        activo: true,
      });
    }
  }, [almacen, reset, open]);

  const handleFormSubmit = async (data: CreateAlmacenDto) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error al guardar almacén:', error);
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
        <DialogTitle sx={{ flexShrink: 0, py: 1.5 }}>{almacen ? 'Editar Almacén' : 'Nuevo Almacén'}</DialogTitle>
        <DialogContent sx={{ flex: 1, overflowY: 'auto', pt: 0, pb: 0, px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={1.5} sx={{ pb: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                {...register('nombre', { required: 'El nombre es requerido' })}
                label="Nombre"
                fullWidth
                size="small"
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('telefono')} label="Teléfono" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField {...register('direccion')} label="Dirección" fullWidth size="small" multiline minRows={1} maxRows={2} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField {...register('observaciones')} label="Observaciones" fullWidth size="small" multiline minRows={1} maxRows={2} />
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

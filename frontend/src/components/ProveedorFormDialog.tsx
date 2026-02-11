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
import { Proveedor, CreateProveedorDto } from '../services/proveedoresService';

interface ProveedorFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProveedorDto) => Promise<void>;
  proveedor?: Proveedor | null;
}

export default function ProveedorFormDialog({
  open,
  onClose,
  onSubmit,
  proveedor,
}: ProveedorFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProveedorDto>({
    defaultValues: {
      nombre: '',
      nit: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto: '',
      observaciones: '',
      activo: true,
    },
  });

  useEffect(() => {
    if (proveedor) {
      reset({
        nombre: proveedor.nombre,
        nit: proveedor.nit || '',
        direccion: proveedor.direccion || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        contacto: proveedor.contacto || '',
        observaciones: proveedor.observaciones || '',
        activo: proveedor.activo,
      });
    } else {
      reset({
        nombre: '',
        nit: '',
        direccion: '',
        telefono: '',
        email: '',
        contacto: '',
        observaciones: '',
        activo: true,
      });
    }
  }, [proveedor, reset, open]);

  const handleFormSubmit = async (data: CreateProveedorDto) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
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
        <DialogTitle sx={{ flexShrink: 0, py: 1.5 }}>{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
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
              <TextField {...register('nit')} label="NIT" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('telefono')} label="Teléfono" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('email')} label="Email" fullWidth size="small" type="email" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('contacto')} label="Contacto" fullWidth size="small" />
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

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useForm } from 'react-hook-form';
import { Cliente, CreateClienteDto } from '../services/clientesService';
import { toast } from 'react-toastify';

interface ClienteFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClienteDto) => Promise<void>;
  cliente?: Cliente | null;
}

export default function ClienteFormDialog({
  open,
  onClose,
  onSubmit,
  cliente,
}: ClienteFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [capturingGPS, setCapturingGPS] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateClienteDto>({
    defaultValues: {
      nombre: '',
      razon_social: '',
      nit: '',
      direccion: '',
      telefono: '',
      telefono_secundario: '',
      zona: '',
      gps: '',
      email: '',
      fotografia: '',
      observaciones: '',
      activo: true,
    },
  });

  useEffect(() => {
    if (cliente) {
      reset({
        nombre: cliente.nombre,
        razon_social: cliente.razon_social || '',
        nit: cliente.nit || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        telefono_secundario: cliente.telefono_secundario || '',
        zona: cliente.zona || '',
        gps: cliente.gps || '',
        email: cliente.email || '',
        fotografia: cliente.fotografia || '',
        observaciones: cliente.observaciones || '',
        activo: cliente.activo,
      });
    } else {
      reset({
        nombre: '',
        razon_social: '',
        nit: '',
        direccion: '',
        telefono: '',
        telefono_secundario: '',
        zona: '',
        gps: '',
        email: '',
        fotografia: '',
        observaciones: '',
        activo: true,
      });
    }
  }, [cliente, reset, open]);

  const gpsValue = watch('gps');

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está disponible en tu navegador');
      return;
    }

    setCapturingGPS(true);

    // El navegador mostrará automáticamente su diálogo de permiso nativo
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const gpsString = `${latitude}, ${longitude}`;
        setValue('gps', gpsString);
        setCapturingGPS(false);
        toast.success('Ubicación GPS capturada exitosamente');
      },
      (error) => {
        setCapturingGPS(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permiso de ubicación denegado. Por favor, permite el acceso en la configuración del navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Información de ubicación no disponible');
            break;
          case error.TIMEOUT:
            toast.error('Tiempo de espera agotado. Intenta nuevamente.');
            break;
          default:
            toast.error('Error al obtener la ubicación GPS');
        }
        
        console.error('Error de geolocalización:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleFormSubmit = async (data: CreateClienteDto) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
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
        <DialogTitle sx={{ flexShrink: 0, py: 1.5 }}>
          {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
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
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('razon_social')} label="Razón Social" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('nit')} label="NIT" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('telefono')} label="Teléfono" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('telefono_secundario')} label="Tel. Secundario" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('zona')} label="Zona" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('email')} label="Email" type="email" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                <TextField
                  {...register('gps')}
                  label="GPS"
                  fullWidth
                  size="small"
                  placeholder="-17.39, -66.15"
                  value={gpsValue || ''}
                />
                <Tooltip title="Capturar ubicación GPS">
                  <IconButton onClick={handleCaptureGPS} disabled={capturingGPS} color="primary" sx={{ mt: 0.5 }} aria-label="Capturar GPS">
                    {capturingGPS ? <CircularProgress size={22} /> : <MyLocationIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField {...register('fotografia')} label="Fotografía (URL)" fullWidth size="small" placeholder="URL" />
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

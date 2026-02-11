import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);

    try {
      console.log('Intentando login con:', data.username);
      console.log('API URL:', import.meta.env.VITE_API_URL);
      await login(data.username, data.password);
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } catch (err: any) {
      console.error('Error completo:', err);
      console.error('Error response:', err.response);
      const message = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Pharmavel
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
            Sistema de Distribución de Insumos Médicos
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              {...register('username', { required: 'Usuario es requerido' })}
              label="Usuario"
              fullWidth
              margin="normal"
              error={!!errors.username}
              helperText={errors.username?.message}
              autoComplete="username"
            />

            <TextField
              {...register('password', { required: 'Contraseña es requerida' })}
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

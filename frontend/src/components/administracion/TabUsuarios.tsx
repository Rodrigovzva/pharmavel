import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { administracionService } from '../../services/administracionService';

export default function TabUsuarios() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    nombre: '',
    apellido: '',
    email: '',
    rol_id: '' as number | '',
  });

  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ['administracion', 'usuarios'],
    queryFn: administracionService.getUsuarios,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['administracion', 'roles'],
    queryFn: administracionService.getRoles,
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      username: string;
      password: string;
      nombre: string;
      apellido: string;
      email?: string;
      rol_id: number;
    }) => administracionService.crearUsuario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administracion', 'usuarios'] });
      toast.success('Usuario creado correctamente');
      setOpenDialog(false);
      setForm({ username: '', password: '', nombre: '', apellido: '', email: '', rol_id: '' });
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Error al crear usuario');
    },
  });

  const handleOpenDialog = () => {
    setForm({ username: '', password: '', nombre: '', apellido: '', email: '', rol_id: roles[0]?.id ?? '' });
    setOpenDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim() || !form.nombre.trim() || !form.apellido.trim()) {
      toast.error('Complete usuario, contraseña, nombre y apellido');
      return;
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.rol_id === '') {
      toast.error('Seleccione un rol');
      return;
    }
    createMutation.mutate({
      username: form.username.trim(),
      password: form.password,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim() || undefined,
      rol_id: Number(form.rol_id),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        No se pudieron cargar los usuarios. Verifique que el backend esté disponible.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h6">
          Gestión de Usuarios
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Nuevo usuario
        </Button>
      </Box>

      <TableContainer sx={{ '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay usuarios registrados. Use &quot;Nuevo usuario&quot; para crear uno.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.nombre} {u.apellido}</TableCell>
                  <TableCell>{u.email || '-'}</TableCell>
                  <TableCell>{u.rol?.nombre ?? '-'}</TableCell>
                  <TableCell>
                    <Chip label={u.activo ? 'Activo' : 'Inactivo'} color={u.activo ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Usuario (login)"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              margin="normal"
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              margin="normal"
              size="small"
              required
              helperText="Mínimo 6 caracteres"
            />
            <TextField
              fullWidth
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              margin="normal"
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Apellido"
              value={form.apellido}
              onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
              margin="normal"
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              margin="normal"
              size="small"
            />
            <FormControl fullWidth size="small" margin="normal" required>
              <InputLabel>Rol</InputLabel>
              <Select
                label="Rol"
                value={form.rol_id}
                onChange={(e) => setForm((f) => ({ ...f, rol_id: e.target.value as number }))}
              >
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando…' : 'Crear usuario'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

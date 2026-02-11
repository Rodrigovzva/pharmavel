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
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { administracionService } from '../../services/administracionService';

export default function TabRoles() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
    permiso_ids: [] as number[],
  });

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['administracion', 'roles'],
    queryFn: administracionService.getRoles,
  });

  const { data: permisos = [] } = useQuery({
    queryKey: ['administracion', 'permisos'],
    queryFn: administracionService.getPermisos,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { nombre: string; descripcion?: string; activo?: boolean; permiso_ids?: number[] }) =>
      administracionService.crearRol(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administracion', 'roles'] });
      toast.success('Rol creado correctamente');
      setOpenDialog(false);
      setForm({ nombre: '', descripcion: '', activo: true, permiso_ids: [] });
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Error al crear rol');
    },
  });

  const handleOpenDialog = () => {
    setForm({ nombre: '', descripcion: '', activo: true, permiso_ids: [] });
    setOpenDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('Ingrese el nombre del rol');
      return;
    }
    createMutation.mutate({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      activo: form.activo,
      permiso_ids: form.permiso_ids.length ? form.permiso_ids : undefined,
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
        No se pudieron cargar roles y permisos. Verifique que el backend esté disponible.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h6">
          Roles
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Nuevo rol
        </Button>
      </Box>

      <TableContainer sx={{ mb: 3, '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rol</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Permisos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay roles configurados. Use &quot;Nuevo rol&quot; para crear uno.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell>{r.descripcion || '-'}</TableCell>
                  <TableCell>
                    <Chip label={r.activo ? 'Activo' : 'Inactivo'} color={r.activo ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    {r.permisos?.length
                      ? r.permisos.map((p) => p.nombre).join(', ')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" gutterBottom>
        Permisos del sistema
      </Typography>
      <TableContainer sx={{ '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Permiso</TableCell>
              <TableCell>Recurso</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Descripción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permisos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay permisos configurados en la base de datos
                </TableCell>
              </TableRow>
            ) : (
              permisos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.recurso}</TableCell>
                  <TableCell>{p.accion}</TableCell>
                  <TableCell>{p.descripcion || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Nuevo rol</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre del rol"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              margin="normal"
              size="small"
              required
              placeholder="Ej: Administrador, Vendedor"
            />
            <TextField
              fullWidth
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              margin="normal"
              size="small"
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                />
              }
              label="Rol activo"
              sx={{ mt: 1 }}
            />
            <FormControl fullWidth size="small" margin="normal">
              <InputLabel>Permisos (opcional)</InputLabel>
              <Select
                multiple
                label="Permisos (opcional)"
                value={form.permiso_ids}
                onChange={(e) => setForm((f) => ({ ...f, permiso_ids: e.target.value as number[] }))}
                renderValue={(selected) =>
                  selected
                    .map((id) => permisos.find((p) => p.id === id)?.nombre)
                    .filter(Boolean)
                    .join(', ') || 'Ninguno'
                }
              >
                {permisos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre} ({p.recurso} / {p.accion})
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
              {createMutation.isPending ? 'Creando…' : 'Crear rol'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { almacenesService, Almacen, CreateAlmacenDto } from '../services/almacenesService';
import AlmacenFormDialog from '../components/AlmacenFormDialog';

export default function AlmacenesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const queryClient = useQueryClient();

  const { data: almacenes = [], isLoading } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAlmacenDto) => almacenesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almacenes'] });
      toast.success('Almacén creado exitosamente');
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear almacén');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAlmacenDto> }) =>
      almacenesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almacenes'] });
      toast.success('Almacén actualizado exitosamente');
      setDialogOpen(false);
      setSelectedAlmacen(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar almacén');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => almacenesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almacenes'] });
      toast.success('Almacén eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar almacén');
    },
  });

  const handleOpenDialog = (almacen?: Almacen) => {
    setSelectedAlmacen(almacen || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAlmacen(null);
  };

  const handleSubmit = async (data: CreateAlmacenDto) => {
    if (selectedAlmacen) {
      await updateMutation.mutateAsync({ id: selectedAlmacen.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este almacén?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Almacenes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Almacén
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)', overflowX: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : almacenes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay almacenes registrados
                </TableCell>
              </TableRow>
            ) : (
              almacenes.map((almacen: Almacen) => (
                <TableRow key={almacen.id}>
                  <TableCell>{almacen.id}</TableCell>
                  <TableCell>{almacen.nombre}</TableCell>
                  <TableCell>{almacen.direccion || '-'}</TableCell>
                  <TableCell>{almacen.telefono || '-'}</TableCell>
                  <TableCell>{almacen.activo ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(almacen)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(almacen.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AlmacenFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        almacen={selectedAlmacen}
      />
    </Box>
  );
}

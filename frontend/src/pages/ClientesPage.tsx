import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { clientesService, Cliente, CreateClienteDto } from '../services/clientesService';
import ClienteFormDialog from '../components/ClienteFormDialog';

const showFromSm = { display: { xs: 'none', sm: 'table-cell' } };
const showFromMd = { display: { xs: 'none', sm: 'none', md: 'table-cell' } };

export default function ClientesPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading, error } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClienteDto) => clientesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateClienteDto> }) =>
      clientesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    },
  });

  const handleOpenDialog = (cliente?: Cliente) => {
    setSelectedCliente(cliente || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCliente(null);
  };

  const handleSubmit = async (data: CreateClienteDto) => {
    if (selectedCliente) {
      await updateMutation.mutateAsync({ id: selectedCliente.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Clientes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar clientes
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)', overflowX: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={showFromSm}>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell sx={showFromMd}>Razón Social</TableCell>
                <TableCell sx={showFromMd}>NIT</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell sx={showFromMd}>Tel. Sec.</TableCell>
                <TableCell sx={showFromSm}>Zona</TableCell>
                <TableCell sx={showFromMd}>GPS</TableCell>
                <TableCell sx={showFromMd}>Email</TableCell>
                <TableCell sx={showFromMd}>Foto</TableCell>
                <TableCell align="right" sx={{ width: 50 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No hay clientes registrados
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente: Cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell sx={showFromSm}>{cliente.id}</TableCell>
                    <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cliente.nombre}>
                      {cliente.nombre}
                    </TableCell>
                    <TableCell sx={{ ...showFromMd, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cliente.razon_social || ''}>
                      {cliente.razon_social || '-'}
                    </TableCell>
                    <TableCell sx={showFromMd}>{cliente.nit || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cliente.telefono || ''}>
                      {cliente.telefono || '-'}
                    </TableCell>
                    <TableCell sx={showFromMd}>{cliente.telefono_secundario || '-'}</TableCell>
                    <TableCell sx={showFromSm}>{cliente.zona || '-'}</TableCell>
                    <TableCell sx={showFromMd}>
                      {cliente.gps ? (
                        <a
                          href={`https://www.google.com/maps?q=${cliente.gps}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1976d2', textDecoration: 'none', fontSize: '0.75rem' }}
                        >
                          Ver mapa
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ ...showFromMd, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cliente.email || ''}>
                      {cliente.email || '-'}
                    </TableCell>
                    <TableCell sx={showFromMd}>
                      {cliente.fotografia ? (
                        <Box
                          component="img"
                          src={cliente.fotografia}
                          alt={cliente.nombre}
                          sx={{
                            width: 36,
                            height: 36,
                            objectFit: 'cover',
                            borderRadius: 1,
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(cliente.fotografia, '_blank')}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ width: 50 }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(cliente)} aria-label="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(cliente.id)} aria-label="Eliminar">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <ClienteFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        cliente={selectedCliente}
      />
    </Box>
  );
}

import { useState } from 'react';
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
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { productosService, Producto, CreateProductoDto } from '../services/productosService';
import ProductoFormDialog from '../components/ProductoFormDialog';
import { formatCurrency } from '../utils/currency';

export default function ProductosPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const queryClient = useQueryClient();

  const { data: productos = [], isLoading, error } = useQuery({
    queryKey: ['productos'],
    queryFn: productosService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductoDto) => productosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear producto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateProductoDto> }) =>
      productosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar producto');
    },
  });

  const obtenerUltimoCodigo = (): number => {
    if (productos.length === 0) return 0;
    
    // Extraer números de los códigos existentes
    const codigosNumericos = productos
      .map((p) => {
        const match = p.codigo.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((num) => num > 0);
    
    return codigosNumericos.length > 0 ? Math.max(...codigosNumericos) : 0;
  };

  const handleOpenDialog = (producto?: Producto) => {
    setSelectedProducto(producto || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProducto(null);
  };

  const handleSubmit = async (data: CreateProductoDto) => {
    if (selectedProducto) {
      await updateMutation.mutateAsync({ id: selectedProducto.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Productos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Producto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar productos
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflowX: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Precio Compra</TableCell>
                <TableCell>Precio Venta</TableCell>
                <TableCell>Stock Mínimo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((producto: Producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>{/^\d+$/.test(String(producto.codigo)) ? String(parseInt(String(producto.codigo), 10)) : producto.codigo}</TableCell>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.categoria || '-'}</TableCell>
                    <TableCell>{producto.unidad_medida}</TableCell>
                    <TableCell>{formatCurrency(Number(producto.precio_compra ?? 0))}</TableCell>
                    <TableCell>{formatCurrency(Number(producto.precio_venta ?? 0))}</TableCell>
                    <TableCell>{Number(producto.stock_minimo ?? 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={producto.activo ? 'Activo' : 'Inactivo'}
                        color={producto.activo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(producto)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(producto.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <ProductoFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        producto={selectedProducto}
        ultimoCodigo={obtenerUltimoCodigo()}
      />
    </Box>
  );
}

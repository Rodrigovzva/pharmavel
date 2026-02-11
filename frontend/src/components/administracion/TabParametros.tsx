import { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { administracionService, Parametro } from '../../services/administracionService';

export default function TabParametros() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<number, string>>({});

  const { data: parametros = [], isLoading, error } = useQuery({
    queryKey: ['administracion', 'parametros'],
    queryFn: administracionService.getParametros,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, valor }: { id: number; valor: string }) =>
      administracionService.updateParametro(id, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administracion', 'parametros'] });
      toast.success('Parámetro actualizado');
      setEditing({});
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Error al guardar');
    },
  });

  const handleEdit = (p: Parametro) => {
    setEditing((prev) => ({ ...prev, [p.id]: p.valor }));
  };

  const handleSave = (id: number) => {
    const valor = editing[id];
    if (valor === undefined) return;
    updateMutation.mutate({ id, valor });
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
        No se pudieron cargar los parámetros. Verifique que el backend esté disponible.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Parámetros del sistema
      </Typography>
      <TableContainer sx={{ '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Clave</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parametros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay parámetros configurados
                </TableCell>
              </TableRow>
            ) : (
              parametros.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.clave}</TableCell>
                  <TableCell>
                    {editing[p.id] !== undefined ? (
                      <TextField
                        size="small"
                        value={editing[p.id]}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        fullWidth
                        sx={{ maxWidth: 300 }}
                      />
                    ) : (
                      <span title={p.valor}>
                        {String(p.valor).length > 60 ? `${String(p.valor).slice(0, 60)}…` : p.valor}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{p.descripcion || '-'}</TableCell>
                  <TableCell align="right">
                    {editing[p.id] !== undefined ? (
                      <Button
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(p.id)}
                        disabled={updateMutation.isPending}
                      >
                        Guardar
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => handleEdit(p)}>
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useState } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { administracionService } from '../services/administracionService';
import TabUsuarios from '../components/administracion/TabUsuarios';
import TabRoles from '../components/administracion/TabRoles';
import TabAuditoria from '../components/administracion/TabAuditoria';
import TabParametros from '../components/administracion/TabParametros';

export default function AdministracionPage() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administración
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Usuarios" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Roles y Permisos" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Auditoría" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Parámetros" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && <TabUsuarios />}
          {tabValue === 1 && <TabRoles />}
          {tabValue === 2 && <TabAuditoria />}
          {tabValue === 3 && <TabParametros />}
        </Box>
      </Paper>
    </Box>
  );
}

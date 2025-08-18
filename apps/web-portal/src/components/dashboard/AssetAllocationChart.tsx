'use client';

import { Box, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const allocationData = [
  { name: 'Equities', value: 1490000, percentage: 60, target: 65, color: '#1976d2' },
  { name: 'Fixed Income', value: 597000, percentage: 24, target: 25, color: '#388e3c' },
  { name: 'Real Estate', value: 249000, percentage: 10, target: 10, color: '#f57c00' },
  { name: 'Cash', value: 149000, percentage: 6, target: 0, color: '#7b1fa2' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          boxShadow: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {data.name}
        </Typography>
        <Typography variant="body2">
          Value: {formatCurrency(data.value)}
        </Typography>
        <Typography variant="body2">
          Allocation: {data.percentage}%
        </Typography>
        <Typography variant="body2">
          Target: {data.target}%
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function AssetAllocationChart() {
  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Pie Chart */}
        <Box sx={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Legend with details */}
        <Box sx={{ flex: 1, pl: 1 }}>
          <List dense>
            {allocationData.map((item) => {
              const isOverTarget = item.percentage > item.target;
              const isUnderTarget = item.percentage < item.target;
              const variance = item.percentage - item.target;
              
              return (
                <ListItem key={item.name} sx={{ py: 0.5 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.percentage}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(item.value)}
                      </Typography>
                      {variance !== 0 && (
                        <Chip
                          label={`${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`}
                          size="small"
                          color={isOverTarget ? 'warning' : isUnderTarget ? 'info' : 'default'}
                          variant="outlined"
                          sx={{ 
                            height: 16, 
                            fontSize: '0.65rem',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>
    </Box>
  );
}
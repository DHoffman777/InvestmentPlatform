"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AssetAllocationChart;
const material_1 = require("@mui/material");
const recharts_1 = require("recharts");
const allocationData = [
    { name: 'Equities', value: 1490000, percentage: 60, target: 65, color: '#1976d2' },
    { name: 'Fixed Income', value: 597000, percentage: 24, target: 25, color: '#388e3c' },
    { name: 'Real Estate', value: 249000, percentage: 10, target: 10, color: '#f57c00' },
    { name: 'Cash', value: 149000, percentage: 6, target: 0, color: '#7b1fa2' },
];
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (<material_1.Box sx={{
                backgroundColor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                boxShadow: 2,
            }}>
        <material_1.Typography variant="subtitle2" fontWeight="bold">
          {data.name}
        </material_1.Typography>
        <material_1.Typography variant="body2">
          Value: {formatCurrency(data.value)}
        </material_1.Typography>
        <material_1.Typography variant="body2">
          Allocation: {data.percentage}%
        </material_1.Typography>
        <material_1.Typography variant="body2">
          Target: {data.target}%
        </material_1.Typography>
      </material_1.Box>);
    }
    return null;
};
function AssetAllocationChart() {
    return (<material_1.Box sx={{ width: '100%', height: 300 }}>
      <material_1.Box sx={{ display: 'flex', height: '100%' }}>
        {/* Pie Chart */}
        <material_1.Box sx={{ flex: 1 }}>
          <recharts_1.ResponsiveContainer width="100%" height="100%">
            <recharts_1.PieChart>
              <recharts_1.Pie data={allocationData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                {allocationData.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={entry.color}/>))}
              </recharts_1.Pie>
              <recharts_1.Tooltip content={<CustomTooltip />}/>
            </recharts_1.PieChart>
          </recharts_1.ResponsiveContainer>
        </material_1.Box>

        {/* Legend with details */}
        <material_1.Box sx={{ flex: 1, pl: 1 }}>
          <material_1.List dense>
            {allocationData.map((item) => {
            const isOverTarget = item.percentage > item.target;
            const isUnderTarget = item.percentage < item.target;
            const variance = item.percentage - item.target;
            return (<material_1.ListItem key={item.name} sx={{ py: 0.5 }}>
                  <material_1.Box sx={{ width: '100%' }}>
                    <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <material_1.Box sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    mr: 1,
                }}/>
                      <material_1.Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                        {item.name}
                      </material_1.Typography>
                      <material_1.Typography variant="body2" fontWeight="bold">
                        {item.percentage}%
                      </material_1.Typography>
                    </material_1.Box>
                    <material_1.Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <material_1.Typography variant="caption" color="text.secondary">
                        {formatCurrency(item.value)}
                      </material_1.Typography>
                      {variance !== 0 && (<material_1.Chip label={`${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`} size="small" color={isOverTarget ? 'warning' : isUnderTarget ? 'info' : 'default'} variant="outlined" sx={{
                        height: 16,
                        fontSize: '0.65rem',
                        '& .MuiChip-label': { px: 1 }
                    }}/>)}
                    </material_1.Box>
                  </material_1.Box>
                </material_1.ListItem>);
        })}
          </material_1.List>
        </material_1.Box>
      </material_1.Box>
    </material_1.Box>);
}

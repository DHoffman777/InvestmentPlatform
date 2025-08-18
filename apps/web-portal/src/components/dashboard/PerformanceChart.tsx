'use client';

import { Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data for demonstration
const mockData = [
  { date: '2024-01-01', portfolio: 2100000, benchmark: 2050000 },
  { date: '2024-02-01', portfolio: 2150000, benchmark: 2080000 },
  { date: '2024-03-01', portfolio: 2120000, benchmark: 2070000 },
  { date: '2024-04-01', portfolio: 2200000, benchmark: 2140000 },
  { date: '2024-05-01', portfolio: 2250000, benchmark: 2160000 },
  { date: '2024-06-01', portfolio: 2300000, benchmark: 2200000 },
  { date: '2024-07-01', portfolio: 2280000, benchmark: 2190000 },
  { date: '2024-08-01', portfolio: 2350000, benchmark: 2240000 },
  { date: '2024-09-01', portfolio: 2400000, benchmark: 2280000 },
  { date: '2024-10-01', portfolio: 2450000, benchmark: 2320000 },
  { date: '2024-11-01', portfolio: 2480000, benchmark: 2350000 },
  { date: '2024-12-01', portfolio: 2487325, benchmark: 2380000 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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
        <p style={{ margin: 0, marginBottom: 8, fontWeight: 600 }}>
          {formatDate(label)}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{
              margin: 0,
              color: entry.color,
              fontSize: '14px',
            }}
          >
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </Box>
    );
  }
  return null;
};

export default function PerformanceChart() {
  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mockData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            stroke="#666"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="portfolio"
            stroke="#1976d2"
            strokeWidth={3}
            dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#1976d2', strokeWidth: 2 }}
            name="Portfolio Value"
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            stroke="#757575"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#757575', strokeWidth: 2, r: 3 }}
            name="S&P 500 Benchmark"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
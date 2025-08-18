'use client';

import { Box, Paper, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

interface PortfolioSummaryCardProps {
  title: string;
  value: string;
  change: number;
  changePercent: number;
  subtitle?: string;
  loading?: boolean;
}

export default function PortfolioSummaryCard({
  title,
  value,
  change,
  changePercent,
  subtitle,
  loading = false,
}: PortfolioSummaryCardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const getTrendIcon = () => {
    if (isPositive) return <TrendingUp fontSize="small" />;
    if (isNegative) return <TrendingDown fontSize="small" />;
    return <TrendingFlat fontSize="small" />;
  };

  const getTrendColor = () => {
    if (isPositive) return 'success';
    if (isNegative) return 'error';
    return 'default';
  };

  const formatChange = (value: number) => {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatPercent = (value: number) => {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Box className="shimmer" sx={{ height: 24, borderRadius: 1, mb: 2 }} />
        <Box className="shimmer" sx={{ height: 32, borderRadius: 1, mb: 1 }} />
        <Box className="shimmer" sx={{ height: 20, borderRadius: 1, width: '60%' }} />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {value}
      </Typography>

      {change !== 0 && (
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Chip
            icon={getTrendIcon()}
            label={`${formatChange(change)} (${formatPercent(changePercent)})`}
            color={getTrendColor() as 'success' | 'error' | 'default'}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiChip-icon': {
                ml: '4px',
              },
            }}
          />
        </Box>
      )}

      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}
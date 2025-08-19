"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PortfolioSummaryCard;
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
function PortfolioSummaryCard({ title, value, change, changePercent, subtitle, loading = false, }) {
    const isPositive = change > 0;
    const isNegative = change < 0;
    const isNeutral = change === 0;
    const getTrendIcon = () => {
        if (isPositive)
            return <icons_material_1.TrendingUp fontSize="small"/>;
        if (isNegative)
            return <icons_material_1.TrendingDown fontSize="small"/>;
        return <icons_material_1.TrendingFlat fontSize="small"/>;
    };
    const getTrendColor = () => {
        if (isPositive)
            return 'success';
        if (isNegative)
            return 'error';
        return 'default';
    };
    const formatChange = (value) => {
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };
    const formatPercent = (value) => {
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${value.toFixed(2)}%`;
    };
    if (loading) {
        return (<material_1.Paper sx={{ p: 3, height: '100%' }}>
        <material_1.Box className="shimmer" sx={{ height: 24, borderRadius: 1, mb: 2 }}/>
        <material_1.Box className="shimmer" sx={{ height: 32, borderRadius: 1, mb: 1 }}/>
        <material_1.Box className="shimmer" sx={{ height: 20, borderRadius: 1, width: '60%' }}/>
      </material_1.Paper>);
    }
    return (<material_1.Paper sx={{
            p: 3,
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
            },
        }}>
      <material_1.Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </material_1.Typography>
      
      <material_1.Typography variant="h4" fontWeight="bold" gutterBottom>
        {value}
      </material_1.Typography>

      {change !== 0 && (<material_1.Box display="flex" alignItems="center" gap={1} mb={1}>
          <material_1.Chip icon={getTrendIcon()} label={`${formatChange(change)} (${formatPercent(changePercent)})`} color={getTrendColor()} variant="outlined" size="small" sx={{
                '& .MuiChip-icon': {
                    ml: '4px',
                },
            }}/>
        </material_1.Box>)}

      {subtitle && (<material_1.Typography variant="caption" color="text.secondary">
          {subtitle}
        </material_1.Typography>)}
    </material_1.Paper>);
}

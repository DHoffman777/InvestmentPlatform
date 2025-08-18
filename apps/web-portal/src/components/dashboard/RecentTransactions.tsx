'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
} from '@mui/material';

const mockTransactions = [
  {
    id: '1',
    date: '2024-01-15',
    symbol: 'AAPL',
    description: 'Apple Inc.',
    type: 'BUY',
    quantity: 100,
    price: 185.50,
    amount: -18550,
    status: 'SETTLED',
  },
  {
    id: '2',
    date: '2024-01-14',
    symbol: 'MSFT',
    description: 'Microsoft Corporation',
    type: 'SELL',
    quantity: 50,
    price: 380.25,
    amount: 19012.50,
    status: 'SETTLED',
  },
  {
    id: '3',
    date: '2024-01-13',
    symbol: 'GOOGL',
    description: 'Alphabet Inc.',
    type: 'BUY',
    quantity: 25,
    price: 142.80,
    amount: -3570,
    status: 'SETTLED',
  },
  {
    id: '4',
    date: '2024-01-12',
    symbol: 'DIVIDEND',
    description: 'Quarterly Dividend Payment',
    type: 'DIVIDEND',
    quantity: 0,
    price: 0,
    amount: 2450,
    status: 'SETTLED',
  },
  {
    id: '5',
    date: '2024-01-11',
    symbol: 'TSLA',
    description: 'Tesla, Inc.',
    type: 'SELL',
    quantity: 15,
    price: 238.45,
    amount: 3576.75,
    status: 'PENDING',
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'BUY':
      return 'error';
    case 'SELL':
      return 'success';
    case 'DIVIDEND':
      return 'info';
    default:
      return 'default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'SETTLED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
      return 'error';
    default:
      return 'default';
  }
};

const formatCurrency = (amount: number) => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(absAmount);
  
  return isNegative ? `-${formatted}` : formatted;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function RecentTransactions() {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Security</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockTransactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
            >
              <TableCell>
                <Typography variant="body2">
                  {formatDate(transaction.date)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {transaction.symbol}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {transaction.description}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={transaction.type}
                  color={getTypeColor(transaction.type) as any}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {transaction.quantity > 0 ? transaction.quantity.toLocaleString() : '-'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {transaction.price > 0 
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(transaction.price)
                    : '-'
                  }
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight={500}
                  color={transaction.amount > 0 ? 'success.main' : 'text.primary'}
                >
                  {formatCurrency(transaction.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={transaction.status}
                  color={getStatusColor(transaction.status) as any}
                  size="small"
                  variant="filled"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
/**
 * SortableTableHeader Component
 * Reusable table header with sorting functionality
 */

import React from 'react';
import { TableCell, TableSortLabel, Box } from '@mui/material';
import { ArrowUpward, ArrowDownward, Sort } from '@mui/icons-material';

function SortableTableHeader({
  column,
  currentSort,
  onSort,
  align = 'left',
  disabled = false,
  children
}) {
  const isActive = currentSort?.column === column;
  const direction = isActive ? currentSort?.direction : null;

  const handleClick = () => {
    if (disabled) return;
    
    let newDirection;
    if (!isActive) {
      // First click - sort ascending
      newDirection = 'asc';
    } else if (direction === 'asc') {
      // Second click - sort descending
      newDirection = 'desc';
    } else {
      // Third click - clear sort
      newDirection = null;
    }
    
    onSort(column, newDirection);
  };

  const getSortIcon = () => {
    if (!isActive) {
      return <Sort sx={{ fontSize: 16 }} />;
    }
    if (direction === 'asc') {
      return <ArrowUpward sx={{ fontSize: 16 }} />;
    }
    if (direction === 'desc') {
      return <ArrowDownward sx={{ fontSize: 16 }} />;
    }
    return <Sort sx={{ fontSize: 16 }} />;
  };

  return (
    <TableCell
      align={align}
      sortDirection={isActive ? direction : false}
      sx={{
        backgroundColor: isActive ? 'primary.50' : 'inherit',
        fontWeight: isActive ? 'bold' : 'medium',
        cursor: disabled ? 'default' : 'pointer',
        '&:hover': {
          backgroundColor: disabled ? 'inherit' : 'grey.50'
        },
        userSelect: 'none'
      }}
      onClick={handleClick}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start'
        }}
      >
        {children}
        {!disabled && (
          <TableSortLabel
            active={isActive}
            direction={direction || 'asc'}
            IconComponent={getSortIcon}
            sx={{
              marginLeft: 1,
              '&.MuiTableSortLabel-active': {
                color: 'primary.main'
              }
            }}
          />
        )}
      </Box>
    </TableCell>
  );
}

export default SortableTableHeader;
import React from 'react';
import { Chip } from 'react-native-paper';
import { OrderStatus } from '../types';
import { statusColors } from '../theme';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const backgroundColor = statusColors[status] ?? '#757575';

  return (
    <Chip
      mode="flat"
      style={{
        backgroundColor,
        paddingVertical: size === 'small' ? 0 : 4,
      }}
      textStyle={{
        color: '#FFFFFF',
        fontSize: size === 'small' ? 11 : 13,
        fontWeight: '600',
      }}
    >
      {status}
    </Chip>
  );
};

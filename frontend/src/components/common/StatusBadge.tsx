/**
 * StatusBadge Component
 * Displays online/offline status badge
 */

import { Badge } from '@mantine/core';
import type { OnlineStatus } from '../../types/account';

interface StatusBadgeProps {
  status: OnlineStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function StatusBadge({ status, size = 'lg' }: StatusBadgeProps) {
  if (!status) return null;

  const isOnline = status === 'online';

  return (
    <Badge
      size={size}
      radius="sm"
      color={isOnline ? 'teal' : 'red'}
      variant="light"
    >
      {isOnline ? 'Online' : 'Çevrimdışı'}
    </Badge>
  );
}


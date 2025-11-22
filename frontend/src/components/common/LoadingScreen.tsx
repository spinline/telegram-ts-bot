/**
 * LoadingScreen Component
 * Centered loading indicator with message
 */

import { Loader, Text, Stack } from '@mantine/core';

interface LoadingScreenProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function LoadingScreen({
  message = 'Yükleniyor...',
  size = 'lg'
}: LoadingScreenProps) {
  return (
    <Stack
      align="center"
      justify="center"
      style={{
        minHeight: '100dvh',
        gap: '20px'
      }}
    >
      <Loader size={size} color="teal" />
      <Text c="dimmed">{message}</Text>
    </Stack>
  );
}


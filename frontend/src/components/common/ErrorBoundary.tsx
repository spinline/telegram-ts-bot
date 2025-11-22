/**
 * ErrorBoundary Component
 * Catches React errors and displays fallback UI
 */

import { Component } from 'react';
import type { ReactNode } from 'react';
import { Stack, Title, Text, Button } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Stack
          align="center"
          justify="center"
          style={{
            minHeight: '100dvh',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <Title order={2} style={{ color: '#ef4444' }}>
            ⚠️ Bir Hata Oluştu
          </Title>
          <Text c="dimmed" size="sm" maw={400}>
            Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
          </Text>
          {this.state.error && (
            <Text
              size="xs"
              c="dimmed"
              style={{
                fontFamily: 'monospace',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '8px',
                maxWidth: '400px',
                overflow: 'auto',
              }}
            >
              {this.state.error.message}
            </Text>
          )}
          <Button onClick={this.handleReset} color="teal" mt="md">
            Sayfayı Yenile
          </Button>
        </Stack>
      );
    }

    return this.props.children;
  }
}


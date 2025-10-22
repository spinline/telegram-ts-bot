import { Button, Group, Stack, Text, Title, ThemeIcon, Container, Badge } from '@mantine/core';
import { IconShield, IconShoppingCart, IconSettings, IconUser, IconHeadset } from '@tabler/icons-react';
import { useEffect, useMemo } from 'react';

interface WelcomeScreenProps {
  onViewAccount: () => void;
  onBuySubscription: () => void;
  onInstallSetup: () => void;
  onSupport: () => void;
  onlineStatus?: 'online' | 'offline' | null;
}

function WelcomeScreen({ onViewAccount, onBuySubscription, onInstallSetup, onSupport, onlineStatus }: WelcomeScreenProps) {
  // Telegram WebApp ve kullanıcıyı al
  const webApp = (window as any)?.Telegram?.WebApp;

  useEffect(() => {
    try { webApp?.ready?.(); } catch {}
  }, [webApp]);

  const isOnline = useMemo(() => onlineStatus === 'online', [onlineStatus]);

  return (
    <Container size={560} px="md" py="xl" mx="auto">
  <div
    style={{
      display: 'flex',
      width: '100%',
      backgroundColor: '#0006',
      overflow: 'auto',
      zIndex: 1,
      padding: 30,
      flexDirection: 'column',
      borderRadius: '1rem',
      maxHeight: '90%',
      boxShadow: 'none',
      border: 'none',
    }}
  >
    <Stack align="center" gap="xl">
          <div
            className="shield-ripple"
            style={{
              // CSS custom property ile sinyal rengi (online/çevrimdışı)
              ['--signal-color' as any]: isOnline ? 'rgba(20, 184, 166, 0.55)' : 'rgba(240, 62, 62, 0.55)',
            }}
          >
            <div className="ripple ripple-1" />
            <div className="ripple ripple-2" />
            <div className="ripple ripple-3" />
            <ThemeIcon variant="filled" size={120} radius="xl" color={isOnline ? 'teal' : 'red'} className="shield-core">
              <IconShield style={{ width: '70%', height: '70%' }} stroke={1.6} />
            </ThemeIcon>
          </div>

          {/* Online / Çevrimdışı Durumu (tek seferlik; yükleniyor yazısı yok) */}
          {onlineStatus && (
            <Badge size="lg" radius="sm" color={isOnline ? 'teal' : 'red'} variant="light">
              {isOnline ? 'Online' : 'Çevrimdışı'}
            </Badge>
          )}

          <Stack align="center" gap="xs">
            <Title order={2}>Hoş Geldiniz!</Title>
            <Text c="dimmed">Botunuz kullanıma hazır.</Text>
          </Stack>

          <Stack w="100%" gap="md">
            <Button
              leftSection={<IconShoppingCart size={20} />}
              color="green"
              size="lg"
              radius="md"
              fullWidth
              onClick={onBuySubscription}
            >
              Abonelik Satın Al
            </Button>

            <Button
              leftSection={<IconSettings size={20} />}
              variant="light"
              color="blue"
              radius="md"
              fullWidth
              onClick={onInstallSetup}
            >
              Kurulum ve Ayarlar (iOS)
            </Button>

            <Group grow>
              <Button
                leftSection={<IconUser size={20} />}
                variant="light"
                color="gray"
                radius="md"
                onClick={onViewAccount}
              >
                Hesabım
              </Button>
              <Button
                leftSection={<IconHeadset size={20} />}
                variant="light"
                color="gray"
                radius="md"
                onClick={onSupport}
              >
                Destek
              </Button>
            </Group>
          </Stack>
        </Stack>
  </div>
    </Container>
  );
}

export default WelcomeScreen;

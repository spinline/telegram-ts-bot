import { Button, Group, Stack, Text, Title, ThemeIcon, Container, Badge } from '@mantine/core';
import { IconShield, IconShoppingCart, IconSettings, IconUser, IconHeadset } from '@tabler/icons-react';
import { useEffect, useMemo } from 'react';

interface WelcomeScreenProps {
  onViewAccount: () => void;
  onBuySubscription: () => void;
  onInstallSetup: () => void;
  onSupport: () => void;
  onlineStatus?: 'online' | 'offline' | null;
  expireAt?: string;
}

function WelcomeScreen({ onViewAccount, onBuySubscription, onInstallSetup, onSupport, onlineStatus, expireAt }: WelcomeScreenProps) {
  // Telegram WebApp ve kullanıcıyı al
  const webApp = (window as any)?.Telegram?.WebApp;

  useEffect(() => {
    try { webApp?.ready?.(); } catch {}
  }, [webApp]);

  const isOnline = useMemo(() => onlineStatus === 'online', [onlineStatus]);

  // İşletim sistemi tespiti
  const platform = useMemo(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      return 'iOS';
    } else if (/Android/.test(ua)) {
      return 'Android';
    }
    return 'iOS'; // Varsayılan
  }, []);

  // Haptic feedback fonksiyonu
  const triggerHaptic = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch (e) {
      console.log('Haptic feedback desteklenmiyor');
    }
  };

  const handleViewAccount = () => {
    triggerHaptic();
    onViewAccount();
  };

  const handleBuySubscription = () => {
    triggerHaptic();
    onBuySubscription();
  };

  const handleInstallSetup = () => {
    triggerHaptic();
    onInstallSetup();
  };

  const handleSupport = () => {
    triggerHaptic();
    onSupport();
  };

  // Tarih formatlama fonksiyonu
  const formatExpireDate = (isoDate: string | undefined) => {
    if (!isoDate) {
      return null;
    }

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Container size={1200} px="md" py="xl" mx="auto" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '180px' }}>
      {/* Kalkan iç çerçevenin dışında */}
      <div
        className="shield-ripple"
        style={{
          position: 'absolute',
          top: -140,
          zIndex: 3,
          ['--signal-color' as any]: 'rgba(20, 184, 166, 0.55)',
        }}
      >
        <div className="ripple ripple-1" />
        <div className="ripple ripple-2" />
        <div className="ripple ripple-3" />
        <ThemeIcon variant="filled" size={120} radius="xl" color="teal" className="shield-core">
          <IconShield style={{ width: '70%', height: '70%' }} stroke={1.6} />
        </ThemeIcon>
      </div>

      {/* İç çerçeve */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          backgroundColor: '#0006',
          overflow: 'auto',
          zIndex: 2,
          position: 'relative',
          padding: 30,
          paddingTop: 100,
          flexDirection: 'column',
          borderRadius: '1rem',
          maxHeight: '90%',
          boxShadow: 'none',
          border: 'none',
        }}
      >
        {/* Online / Çevrimdışı Durumu ve Bitiş Tarihi - iç çerçeve sol üstte */}
        <div style={{ position: 'absolute', top: 15, left: 15, right: 15, zIndex: 3, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {onlineStatus && (
            <Badge size="lg" radius="sm" color={isOnline ? 'teal' : 'red'} variant="light">
              {isOnline ? 'Online' : 'Çevrimdışı'}
            </Badge>
          )}
          {expireAt && formatExpireDate(expireAt) && (
            <Text size="sm" style={{ color: '#fbbf24', fontWeight: 500 }}>
              {formatExpireDate(expireAt)}'e kadar
            </Text>
          )}
        </div>

        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs">
            <Title order={2} style={{ color: '#fff' }}>Hoş Geldiniz!</Title>
            <Text c="dimmed">Botunuz kullanıma hazır.</Text>
          </Stack>

          <Stack w="100%" gap="md">
            <Button
              leftSection={<IconShoppingCart size={20} />}
              color="green"
              size="lg"
              radius="md"
              fullWidth
              onClick={handleBuySubscription}
            >
              Abonelik Satın Al
            </Button>

            <Button
              leftSection={<IconSettings size={20} />}
              variant="light"
              color="blue"
              radius="md"
              fullWidth
              onClick={handleInstallSetup}
              styles={{
                inner: {
                  justifyContent: 'space-between',
                },
                label: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                },
              }}
            >
              <span>Kurulum ve Ayarlar</span>
              <Badge 
                size="md" 
                radius="sm" 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#14b8a6',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {platform}
              </Badge>
            </Button>

            <Group grow>
              <Button
                leftSection={<IconUser size={20} />}
                variant="light"
                color="gray"
                radius="md"
                onClick={handleViewAccount}
              >
                Hesabım
              </Button>
              <Button
                leftSection={<IconHeadset size={20} />}
                variant="light"
                color="gray"
                radius="md"
                onClick={handleSupport}
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

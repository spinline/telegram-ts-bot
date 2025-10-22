import { Button, Group, Stack, Text, Title, ThemeIcon, Badge } from '@mantine/core';
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

  // Abonelik süresi bitmiş mi kontrol et
  const isExpired = useMemo(() => {
    if (!expireAt) return false;
    const expireDate = new Date(expireAt);
    const now = new Date();
    return expireDate < now;
  }, [expireAt]);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '180px', width: '100%' }}>
      {/* Kalkan iç çerçevenin dışında */}
      <div
        className="shield-ripple"
        style={{
          position: 'absolute',
          top: -170,
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
        <div style={{ position: 'absolute', top: 15, left: 15, right: 15, zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text size="md" style={{ color: '#fff', fontWeight: 500 }}>
              Aeron
            </Text>
            {expireAt && formatExpireDate(expireAt) && (
              <Text size="sm" style={{ color: '#fff', fontWeight: 500 }}>
                {formatExpireDate(expireAt)}'e kadar
              </Text>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {onlineStatus && (
              <Badge size="lg" radius="sm" color={isOnline ? 'teal' : 'red'} variant="light">
                {isOnline ? 'Online' : 'Çevrimdışı'}
              </Badge>
            )}
            {isExpired && (
              <Text size="sm" style={{ color: '#ef4444', fontWeight: 500 }}>
                Aboneliğiniz sona erdi
              </Text>
            )}
          </div>
        </div>

        <Stack align="center" gap="lg">
          <Stack align="center" gap="xs">
            <Title order={2} style={{ color: '#fff' }}>Hoş Geldiniz!</Title>
            <Text c="dimmed">Botunuz kullanıma hazır.</Text>
          </Stack>

          <Stack w="100%" gap="sm">
            <Button
              leftSection={<IconShoppingCart size={20} />}
              color="green"
              size="md"
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
              size="md"
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
                leftSection={<IconUser size={18} />}
                variant="light"
                color="gray"
                size="md"
                radius="md"
                onClick={handleViewAccount}
                styles={{
                  root: {
                    fontSize: '14px',
                  },
                }}
              >
                Hesabım
              </Button>
              <Button
                leftSection={<IconHeadset size={18} />}
                variant="light"
                color="gray"
                size="md"
                radius="md"
                onClick={handleSupport}
                styles={{
                  root: {
                    fontSize: '14px',
                  },
                }}
              >
                Destek
              </Button>
            </Group>
          </Stack>
        </Stack>
      </div>
    </div>
  );
}

export default WelcomeScreen;

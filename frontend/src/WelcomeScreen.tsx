import { Button, Group, Stack, Text, Title, ThemeIcon, Badge, Loader } from '@mantine/core';
import { IconShield, IconShoppingCart, IconSettings, IconUser, IconHeadset, IconRocket } from '@tabler/icons-react';
import { useEffect, useMemo } from 'react';

interface WelcomeScreenProps {
  onViewAccount: () => void;
  onBuySubscription: () => void;
  onInstallSetup: () => void;
  onSupport: () => void;
  onlineStatus?: 'online' | 'offline' | null;
  expireAt?: string;
  isRegistered: boolean;
  loading: boolean;
}

function WelcomeScreen({
  onViewAccount,
  onBuySubscription,
  onInstallSetup,
  onSupport,
  onlineStatus,
  expireAt,
  isRegistered,
  loading
}: WelcomeScreenProps) {
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

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '20px'
      }}>
        <Loader size="lg" color="teal" />
        <Text c="dimmed">Hesap bilgileriniz yükleniyor...</Text>
      </div>
    );
  }

  // Kayıtsız kullanıcı için landing page
  if (!isRegistered) {
    return (
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '60px',
        marginBottom: '20px',
        width: '100%',
        maxWidth: '600px',
        padding: '0 20px',
        minHeight: 'calc(100dvh - 80px)',
      }}>
        {/* Kalkan animasyonu */}
        <div
          className="shield-ripple"
          style={{
            position: 'absolute',
            top: -40,
            zIndex: 3,
            ['--signal-color' as any]: 'rgba(20, 184, 166, 0.55)',
          }}
        >
          <div className="ripple ripple-1" />
          <div className="ripple ripple-2" />
          <div className="ripple ripple-3" />
          <ThemeIcon variant="filled" size={100} radius="xl" color="teal" className="shield-core">
            <IconShield style={{ width: '70%', height: '70%' }} stroke={1.6} />
          </ThemeIcon>
        </div>

        {/* Landing page içeriği */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            backgroundColor: '#0006',
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 2,
            position: 'relative',
            padding: '20px',
            paddingTop: 90,
            flexDirection: 'column',
            borderRadius: '1rem',
            boxShadow: 'none',
            border: 'none',
          }}
        >
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md" mt="md">
              <Title order={1} style={{ color: '#fff', textAlign: 'center' }}>
                Hoş Geldiniz!
              </Title>
              <Text size="lg" c="dimmed" ta="center">
                Güvenli ve hızlı VPN hizmetimizle tanışın
              </Text>
            </Stack>

            <Stack w="100%" gap="lg" mt="md">
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(20, 184, 166, 0.1)',
                border: '1px solid rgba(20, 184, 166, 0.3)'
              }}>
                <Stack gap="sm">
                  <Text size="md" fw={600} style={{ color: '#14b8a6' }}>
                    ✨ Neden Aeron VPN?
                  </Text>
                  <Text size="sm" c="dimmed">
                    • Yüksek hız ve güvenlik
                  </Text>
                  <Text size="sm" c="dimmed">
                    • Sınırsız bant genişliği
                  </Text>
                  <Text size="sm" c="dimmed">
                    • 7/24 müşteri desteği
                  </Text>
                  <Text size="sm" c="dimmed">
                    • Kolay kurulum
                  </Text>
                </Stack>
              </div>

              <Stack gap="sm">
                <Text size="sm" c="dimmed" ta="center">
                  Şu anda kayıtlı bir hesabınız bulunmuyor.
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Başlamak için telegram botumuzdan <strong style={{ color: '#14b8a6' }}>"Try for Free"</strong> butonuna tıklayarak ücretsiz deneme hesabı oluşturun!
                </Text>
              </Stack>

              <Button
                leftSection={<IconRocket size={20} />}
                color="teal"
                size="lg"
                radius="md"
                fullWidth
                onClick={() => {
                  triggerHaptic();
                  // Telegram botuna yönlendir
                  const webApp = (window as any)?.Telegram?.WebApp;
                  webApp?.close();
                }}
              >
                Telegram Bot'a Git
              </Button>
            </Stack>
          </Stack>
        </div>
      </div>
    );
  }

  // Kayıtlı kullanıcı için mevcut UI
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                transition: 'all .2s ease-in-out',
                cursor: 'pointer',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
              }}
              onClick={handleInstallSetup}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconSettings size={20} style={{ color: '#fff' }} />
                <Text size="md" fw={500} style={{ color: '#fff' }}>Kurulum ve Ayarlar</Text>
              </div>
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
            </div>

            <Group grow gap="sm">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  transition: 'all .2s ease-in-out',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                }}
                onClick={handleViewAccount}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IconUser size={20} style={{ color: '#fff' }} />
                  <Text size="md" fw={500} style={{ color: '#fff' }}>Hesabım</Text>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  transition: 'all .2s ease-in-out',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                }}
                onClick={handleSupport}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IconHeadset size={20} style={{ color: '#fff' }} />
                  <Text size="md" fw={500} style={{ color: '#fff' }}>Destek</Text>
                </div>
              </div>
            </Group>
          </Stack>
        </Stack>
      </div>
    </div>
  );
}

export default WelcomeScreen;

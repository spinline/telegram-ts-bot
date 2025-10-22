import { Container, Stack, Text, ThemeIcon, Group, Title } from '@mantine/core';
import { IconShield, IconDownload, IconArrowRight } from '@tabler/icons-react';
import { useMemo } from 'react';

interface InstallOnThisDeviceProps {
  onNext: () => void;
}

export default function InstallOnThisDevice({ onNext }: InstallOnThisDeviceProps) {
  // İşletim sistemi tespiti
  const platform = useMemo(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      return 'iOS';
    } else if (/Android/.test(ua)) {
      return 'Android';
    } else if (/Mac OS X/.test(ua)) {
      return 'macOS';
    } else if (/Windows/.test(ua)) {
      return 'Windows';
    } else if (/Linux/.test(ua)) {
      return 'Linux';
    }
    return 'iOS'; // Varsayılan
  }, []);

  // Haptic feedback
  const triggerHaptic = () => {
    try {
      (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
  };

  const handleInstall = () => {
    triggerHaptic();
    // Platform'a göre ilgili store linkini aç
    const links = {
      iOS: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
      Android: 'https://play.google.com/store/apps/details?id=com.happproxy',
      Windows: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x86.exe',
      macOS: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
      Linux: 'https://github.com/Happ-proxy/happ-desktop/releases/',
    };
    
    const link = links[platform as keyof typeof links];
    if (link) {
      window.open(link, '_blank');
    }
  };

  const handleNext = () => {
    triggerHaptic();
    onNext();
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
        <Stack align="center" gap="lg">
          <Stack align="center" gap="xs">
            <Title order={3} style={{ color: '#fff' }}>Uygulama</Title>
            <Text c="dimmed" ta="center" size="lg" mt="md">
              "Happ" uygulamasını yükleyin ve bu ekrana geri dönün
            </Text>
          </Stack>

          {/* Butonlar */}
          <Group grow w="100%" mt="xl" gap="md">
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(20, 184, 166, 0.2)',
                transition: 'all .2s ease-in-out',
                cursor: 'pointer',
                border: '1px solid #14b8a6',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(20, 184, 166, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)';
              }}
              onClick={handleInstall}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconDownload size={20} style={{ color: '#14b8a6' }} />
                <Text size="md" fw={600} style={{ color: '#14b8a6' }}>Kurulum</Text>
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
              onClick={handleNext}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text size="md" fw={500} style={{ color: '#fff' }}>Sonraki</Text>
                <IconArrowRight size={20} style={{ color: '#fff' }} />
              </div>
            </div>
          </Group>
        </Stack>
      </div>
    </Container>
  );
}

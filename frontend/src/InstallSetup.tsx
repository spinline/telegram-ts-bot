import { Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconShield, IconDeviceMobile, IconQrcode } from '@tabler/icons-react';
import { useMemo } from 'react';

interface InstallSetupProps {
}

export default function InstallSetup({}: InstallSetupProps) {
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

  return (
    <Container size={800} px="md" py="xl" mx="auto" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '180px' }}>
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
            <Title order={3} style={{ color: '#fff' }}>{platform} Kurulumu</Title>
            <Text c="dimmed" ta="center">VPN kurulumu sadece 3 adımda, sadece birkaç dakika sürmektedir.</Text>
          </Stack>

          {/* Kurulum seçenekleri */}
          <Stack w="100%" gap="md" mt="lg">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
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
              onClick={() => console.log('Bu cihazda kurulum başlat')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconDeviceMobile size={20} style={{ color: '#14b8a6' }} />
                <Text size="md" fw={500} style={{ color: '#fff' }}>Bu cihazda kurulumu başlat</Text>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
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
              onClick={() => console.log('Başka cihaza yükle')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconQrcode size={20} style={{ color: '#14b8a6' }} />
                <Text size="md" fw={500} style={{ color: '#fff' }}>Başka bir cihaza yükle</Text>
              </div>
            </div>
          </Stack>
        </Stack>
      </div>
    </Container>
  );
}

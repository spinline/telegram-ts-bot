import { Container, Stack, Text, ThemeIcon, Title, Button } from '@mantine/core';
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

          <Stack gap="md" w="100%" style={{ textAlign: 'left' }}>
            {platform === 'iOS' ? (
              <>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>1. Uygulamayı İndirin</Text>
                  <Text c="dimmed" size="sm">App Store'dan "Happ Proxy" uygulamasını indirin ve yükleyin.</Text>
                </div>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>2. Profil Linkini Alın</Text>
                  <Text c="dimmed" size="sm">"Hesabım" sayfasından "Abonelik Linkini Aç" butonuna tıklayın. Link otomatik olarak kopyalanacaktır.</Text>
                </div>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>3. Safari'de Açın</Text>
                  <Text c="dimmed" size="sm">Safari tarayıcısını açın ve adres çubuğuna kopyalanan linki yapıştırın.</Text>
                </div>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>4. Profili Onaylayın</Text>
                  <Text c="dimmed" size="sm">Açılan sayfada "Happ'te Aç" butonuna tıklayın ve profili yükleyin.</Text>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>1. Uygulamayı İndirin</Text>
                  <Text c="dimmed" size="sm">Play Store'dan "Happ Proxy" uygulamasını indirin ve yükleyin.</Text>
                </div>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>2. Profil Linkini Alın</Text>
                  <Text c="dimmed" size="sm">"Hesabım" sayfasından "Abonelik Linkini Aç" butonuna tıklayın.</Text>
                </div>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>3. Profili Ekleyin</Text>
                  <Text c="dimmed" size="sm">Açılan sayfada "Happ'te Aç" veya "Open in Happ" butonuna tıklayın.</Text>
                </div>
                <div>
                  <Text fw={600} size="md" style={{ color: '#14b8a6', marginBottom: 8 }}>4. Bağlantıyı Başlatın</Text>
                  <Text c="dimmed" size="sm">Uygulama içinde profili seçin ve bağlantıyı başlatın.</Text>
                </div>
              </>
            )}
          </Stack>

          {/* Kurulum seçenekleri */}
          <Stack w="100%" gap="md" mt="lg">
            <Button
              leftSection={<IconDeviceMobile size={20} />}
              color="green"
              size="lg"
              radius="md"
              fullWidth
              onClick={() => console.log('Bu cihazda kurulum başlat')}
            >
              Bu Cihazda Kurulumu Başlat
            </Button>

            <Button
              leftSection={<IconQrcode size={20} />}
              variant="light"
              color="blue"
              size="lg"
              radius="md"
              fullWidth
              onClick={() => console.log('Başka cihaza yükle')}
            >
              Başka Bir Cihaza Yükle
            </Button>
          </Stack>
        </Stack>
      </div>
    </Container>
  );
}

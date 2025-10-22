import { Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconShield } from '@tabler/icons-react';

interface InstallSetupProps {
}

export default function InstallSetup({}: InstallSetupProps) {
  return (
    <Container size={720} px="md" py="xl" mx="auto" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '180px' }}>
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
            <Title order={3} style={{ color: '#fff' }}>Kurulum ve Ayarlar</Title>
            <Text c="dimmed" ta="center">Cihazınızda hızlıca bağlantı kurmak için aşağıdaki adımları izleyin.</Text>
          </Stack>

          <Stack gap="sm" w="100%">
            <Text fw={600} style={{ color: '#fff' }}>iOS</Text>
            <Text c="dimmed" size="sm">1) Uygulamayı App Store'dan indirin. 2) Hesabım sayfasından bağlantıyı açın. 3) Profili onaylayın.</Text>

            <Text fw={600} mt="sm" style={{ color: '#fff' }}>Android</Text>
            <Text c="dimmed" size="sm">1) Uygulamayı Play Store'dan indirin. 2) Hesabım sayfasından bağlantıyı açın. 3) Profili etkinleştirin.</Text>
          </Stack>
        </Stack>
      </div>
    </Container>
  );
}

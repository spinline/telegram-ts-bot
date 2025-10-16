import { useEffect } from 'react';
import { MantineProvider, AppShell, Card, Text, Button, Group, Title, Stack, Badge, Code, useMantineColorScheme, ActionIcon } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { IconSun, IconMoon } from '@tabler/icons-react';
import '@mantine/core/styles.css';

// Telegram Web App script'inin eklediği global nesneyi tanımla
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

function AppContent() {
  const webApp = window.Telegram.WebApp;
  const user = webApp.initDataUnsafe?.user;
  const { setColorScheme } = useMantineColorScheme();

  // Telegram'ın renk şemasına (koyu/açık mod) uyum sağla
  useEffect(() => {
    setColorScheme(webApp.colorScheme);
    webApp.ready(); // Uygulamanın yüklendiğini Telegram'a bildir
  }, [setColorScheme, webApp.colorScheme, webApp]);

  // Manuel tema değiştirme butonu (isteğe bağlı)
  const ColorSchemeToggle = () => {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    return (
      <ActionIcon
        onClick={() => toggleColorScheme()}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
      </ActionIcon>
    );
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>VPN Bot</Title>
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack>
          {user ? (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack>
                <Title order={4}>Hoş Geldin, {user.first_name}!</Title>
                <Text size="sm" c="dimmed">
                  Hesap bilgilerin aşağıda görüntüleniyor.
                </Text>

                <Badge color="blue" variant="light">
                  Kullanıcı Adı: @{user.username}
                </Badge>

                <Text size="sm">Abonelik Durumu:</Text>
                <Badge color="teal" size="lg" radius="sm">
                  🟢 Aktif
                </Badge>

                <Text size="sm">Kalan Kota:</Text>
                <Code block>25.7 GB / 50 GB</Code>

                <Group grow mt="md">
                  <Button variant="light" color="blue">
                    Hesabımı Yönet
                  </Button>
                  <Button variant="filled" color="teal">
                    Abonelik Satın Al
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text>Kullanıcı bilgileri yüklenemedi. Lütfen uygulamanın Telegram üzerinden açıldığından emin olun.</Text>
            </Card>
          )}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}

function App() {
  // Tercih edilen renk şemasını al (sistem veya tarayıcı ayarı)
  const preferredColorScheme = useColorScheme();

  return (
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <AppContent />
    </MantineProvider>
  );
}

export default App;

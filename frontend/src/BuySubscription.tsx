import { useState } from 'react';
import {
  Button,
  Group,
  Stack,
  Text,
  Title,
  Card,
  Container,
  Slider,
  Badge,
} from '@mantine/core';
import { IconDeviceLaptop, IconShoppingCart } from '@tabler/icons-react';

interface BuySubscriptionProps {
  onBack: () => void;
}

interface SubscriptionOption {
  duration: string;
  price: number;
}

function BuySubscription({ onBack }: BuySubscriptionProps) {
  const [deviceCount, setDeviceCount] = useState(1);

  // Cihaz sayısına göre abonelik seçeneklerini dinamik olarak oluştur
  const getSubscriptionOptions = (count: number): SubscriptionOption[] => {
    // Fiyatları cihaz sayısına göre ayarla, şimdilik sallıyoruz
    const basePrice = 50 * count;
    return [
      { duration: '1 Ay', price: basePrice },
      { duration: '3 Ay', price: basePrice * 2.5 },
      { duration: '6 Ay', price: basePrice * 4.5 },
      { duration: '1 Yıl', price: basePrice * 8 },
    ];
  };

  const subscriptionOptions = getSubscriptionOptions(deviceCount);

  return (
    <Container size="md" py="xl" mx="auto">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xl">
          <Title order={3}>Abonelik Satın Al</Title>

          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Title order={5}>Cihaz Sayısı:</Title>
              <Badge size="lg" variant="filled" color="blue">
                {deviceCount}
              </Badge>
            </Group>
            <Slider
              value={deviceCount}
              onChange={setDeviceCount}
              min={1}
              max={5}
              step={1}
              label={(value) => `${value} Cihaz`}
              thumbChildren={<IconDeviceLaptop size={16} />}
              color="blue"
            />
          </Stack>

          <Stack gap="md">
            <Title order={4}>Abonelik Süresi Seçin</Title>
            <Group grow>
              {subscriptionOptions.map((option, index) => (
                <Card key={index} shadow="xs" padding="md" radius="md" withBorder>
                  <Stack align="center" gap="xs">
                    <Text size="lg" fw={700}>
                      {option.duration}
                    </Text>
                    <Text size="xl" fw={700} c="green">
                      {option.price.toFixed(2)} TL
                    </Text>
                    <Button
                      leftSection={<IconShoppingCart size={16} />}
                      variant="light"
                      color="green"
                      fullWidth
                    >
                      Satın Al
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Group>
          </Stack>
        </Stack>
      </Card>
      <Group justify="center" mt="md">
        <Button variant="light" onClick={onBack}>Geri</Button>
      </Group>
    </Container>
  );
}

export default BuySubscription;

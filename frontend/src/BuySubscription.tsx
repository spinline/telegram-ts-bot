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
  monthlyPrice?: number;
  isPopular?: boolean;
}

function BuySubscription({ onBack }: BuySubscriptionProps) {
  const [deviceCount, setDeviceCount] = useState(3); // Varsayılan olarak 3 cihaz seçili
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0); // Seçilen abonelik süresi indeksi

  // Cihaz sayısına göre abonelik seçeneklerini dinamik olarak oluştur
  const getSubscriptionOptions = (count: number): SubscriptionOption[] => {
    // Fiyatları ekran görüntüsüne göre ayarlayalım (örnek değerler)
    const basePricePerMonth = 100; // Örnek aylık baz fiyat

    const options = [
      { duration: '1 Ay', priceMultiplier: 1, isPopular: false },
      { duration: '3 Ay', priceMultiplier: 2.5, isPopular: false },
      { duration: '6 Ay', priceMultiplier: 4.5, isPopular: true }, // POPÜLER
      { duration: '1 Yıl', priceMultiplier: 8, isPopular: false },
    ];

    return options.map(option => {
      const price = basePricePerMonth * count * option.priceMultiplier;
      const monthlyPrice = price / (parseInt(option.duration) || 12);
      return {
        duration: option.duration,
        price: price,
        monthlyPrice: monthlyPrice,
        isPopular: option.isPopular,
      };
    });
  };

  const subscriptionOptions = getSubscriptionOptions(deviceCount);
  const selectedOption = subscriptionOptions[selectedDurationIndex];

  return (
    <Container size="sm" py="xl" mx="auto">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={2}>Abonelik Satın Al</Title>
            <Text c="dimmed">İlgilendiğiniz tarifeyi ve cihaz sayısını seçin</Text>
          </Stack>

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
              color="green"
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
              ]}
            />
          </Stack>

          <Stack gap="md">
            <Group grow>
              {subscriptionOptions.map((option, index) => (
                <Card
                  key={index}
                  shadow="xs"
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedDurationIndex === index ? 'var(--mantine-color-green-6)' : undefined,
                    borderWidth: selectedDurationIndex === index ? 2 : 1,
                  }}
                  onClick={() => setSelectedDurationIndex(index)}
                >
                  <Stack align="center" gap="xs">
                    {option.isPopular && (
                      <Badge color="red" variant="filled" size="sm" mb={4}>
                        POPÜLER
                      </Badge>
                    )}
                    <Text size="lg" fw={700}>
                      {option.duration}
                    </Text>
                    <Text size="xl" fw={700} c="green">
                      {option.price.toFixed(2)} TL
                    </Text>
                    {option.monthlyPrice && option.duration !== '1 Ay' && (
                      <Text size="sm" c="dimmed">
                        {(option.monthlyPrice).toFixed(2)} TL / ay
                      </Text>
                    )}
                  </Stack>
                </Card>
              ))}
            </Group>
          </Stack>

          <Button
            leftSection={<IconShoppingCart size={20} />}
            color="green"
            size="lg"
            radius="md"
            fullWidth
            mt="xl"
            onClick={() => console.log(`Ödeme Yap: ${selectedOption.price.toFixed(2)} TL`)}
          >
            Ödeme Yap {selectedOption.price.toFixed(2)} TL
          </Button>
        </Stack>
      </Card>
      <Group justify="center" mt="md">
        <Button variant="light" onClick={onBack}>Geri</Button>
      </Group>
    </Container>
  );
}

export default BuySubscription;

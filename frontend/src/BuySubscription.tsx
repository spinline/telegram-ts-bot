import { useState } from 'react';
import {
  Button,
  Stack,
  Text,
  Title,
} from '@mantine/core';

interface BuySubscriptionProps {
}

interface SubscriptionOption {
  duration: string;
  price: number;
  monthlyPrice?: number;
  isPopular?: boolean;
  months: number;
}

function BuySubscription({}: BuySubscriptionProps) {
  const [deviceCount, setDeviceCount] = useState(1);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(2); // 6 месяцев по умолчанию

  // Cihaz sayısına göre abonelik seçenekleri
  const getSubscriptionOptions = (count: number): SubscriptionOption[] => {
    const baseOptions = [
      { duration: '1 Ay', months: 1, price: 150 * count, isPopular: false },
      { duration: '3 Ay', months: 3, price: 390 * count, isPopular: false },
      { duration: '6 Ay', months: 6, price: 720 * count, isPopular: true },
      { duration: '1 Yıl', months: 12, price: 1320 * count, isPopular: false },
    ];

    return baseOptions.map(option => ({
      ...option,
      monthlyPrice: option.price / option.months,
    }));
  };

  const subscriptionOptions = getSubscriptionOptions(deviceCount);
  const selectedOption = subscriptionOptions[selectedDurationIndex];

  // Haptic helpers
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  const hapticSelect = () => {
    try { haptic?.selectionChanged?.(); } catch {}
  };
  const hapticImpact = () => {
    try { haptic?.impactOccurred?.('light'); } catch {}
  };

  const handlePayment = () => {
    hapticImpact();
    console.log(`Ödeme Yap: ${selectedOption.price.toFixed(0)} ₽`);
  };

  const handleSubscriptionSelect = (index: number) => {
    hapticSelect();
    setSelectedDurationIndex(index);
  };

  const handleSliderChange = (value: number) => {
    hapticSelect();
    setDeviceCount(value);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', width: '100%', paddingBottom: '30px' }}>
      {/* İç çerçeve */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          backgroundColor: '#0006',
          overflow: 'visible',
          zIndex: 2,
          position: 'relative',
          padding: 30,
          flexDirection: 'column',
          borderRadius: '1rem',
          boxShadow: 'none',
          border: 'none',
        }}
      >
        <Stack gap="lg">
          {/* Başlık */}
          <Stack gap="xs">
            <Title order={2} style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>
              Abonelik Satın Al
            </Title>
            <Text size="md" style={{ color: '#9ca3af' }}>
              İlgilendiğiniz tarifeyi ve cihaz sayısını seçin
            </Text>
          </Stack>

          {/* Cihaz sayısı seçici */}
          <div>
            <Text size="lg" style={{ color: '#fff', marginBottom: '12px', fontWeight: 500 }}>
              Cihaz Sayısı
            </Text>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => handleSliderChange(num)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: deviceCount === num ? '2px solid #14b8a6' : '2px solid transparent',
                    backgroundColor: deviceCount === num ? '#14b8a620' : '#00000040',
                    color: deviceCount === num ? '#14b8a6' : '#9ca3af',
                    fontSize: '16px',
                    fontWeight: deviceCount === num ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Abonelik kartları - Grid 2x2 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px',
            marginTop: '8px'
          }}>
            {subscriptionOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => handleSubscriptionSelect(index)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedDurationIndex === index ? '#14b8a620' : '#00000040',
                  border: selectedDurationIndex === index ? '2px solid #14b8a6' : '2px solid transparent',
                  borderRadius: '16px',
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  height: '130px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                {option.isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    popüler
                  </div>
                )}                

                <div style={{ marginTop: option.isPopular ? '24px' : '4px' }}>
                  <Text size="xs" style={{ color: '#9ca3af', marginBottom: '6px', fontSize: '12px' }}>
                    {option.duration}
                  </Text>
                  
                  <Text size="22px" fw={700} style={{ color: '#fff', lineHeight: '1.2', fontSize: '22px' }}>
                    {option.price.toFixed(0)} ₽
                  </Text>
                  
                  {option.months > 1 && (
                    <Text size="xs" style={{ color: '#6b7280', marginTop: '4px', fontSize: '10px' }}>
                      {option.monthlyPrice?.toFixed(0)}₽ / ay
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Ödeme butonu */}
          <Button
            color="teal"
            size="lg"
            radius="md"
            fullWidth
            mt="md"
            onClick={handlePayment}
            style={{
              backgroundColor: '#14b8a6',
              height: '56px',
              fontSize: '17px',
              fontWeight: 600,
            }}
          >
            Ödeme Yap {selectedOption.price.toFixed(0)} ₽
          </Button>
        </Stack>
      </div>
    </div>
  );
}

export default BuySubscription;

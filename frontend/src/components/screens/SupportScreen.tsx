import { useState, useEffect } from 'react';
import { Stack, Title, Text, Button, Group, Card, Badge, TextInput, Textarea, Loader, Alert } from '@mantine/core';
import { IconPlus, IconMessage, IconArrowLeft, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { ticketService } from '../../services/ticket.service';
import type { Ticket } from '../../services/ticket.service';

interface SupportScreenProps {
  onTicketClick: (ticketId: number) => void;
}

function SupportScreen({ onTicketClick }: SupportScreenProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await ticketService.getTickets('ALL');
      if (data && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleNewTicket = async () => {
    // Check if user has an active ticket
    const activeTicket = tickets.find(t => t.status !== 'CLOSED');
    if (activeTicket) {
      setError(`Zaten açık bir talebiniz var (#${activeTicket.id}). Yeni talep oluşturmak için önce mevcut talebinizi kapatmanız gerekiyor.`);
      return;
    }
    setShowForm(true);
  };

  const handleCreateTicket = async () => {
    if (!newTicketTitle || !newTicketMessage) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      console.log('🎫 Creating ticket:', { title: newTicketTitle, message: newTicketMessage });

      const result = await ticketService.createTicket(newTicketTitle, newTicketMessage);
      console.log('✅ Ticket created successfully:', result);

      setSuccess(true);
      setNewTicketTitle('');
      setNewTicketMessage('');
      await fetchTickets();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('❌ Failed to create ticket:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      const errorMessage = err.response?.data?.error || err.message || 'Talep oluşturulurken bir hata oluştu.';
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToList = () => {
    setSuccess(false);
    setShowForm(false);
    setError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'blue';
      case 'ANSWERED': return 'green';
      case 'CLOSED': return 'gray';
      case 'PENDING': return 'yellow';
      default: return 'gray';
    }
  };

  if (showForm) {
    if (success) {
      return (
        <div style={{ paddingTop: 40, paddingBottom: 40 }}>
          <Stack align="center" gap="xl">
            <div style={{
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              borderRadius: '50%',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconCheck size={60} color="#2ecc71" />
            </div>
            <Stack gap="xs" align="center">
              <Title order={2} style={{ color: '#fff' }}>Talep Oluşturuldu!</Title>
              <Text c="dimmed" ta="center" size="lg">
                Destek talebiniz başarıyla iletildi.<br />En kısa sürede yanıt verilecektir.
              </Text>
            </Stack>
            <Button
              onClick={handleBackToList}
              color="teal"
              size="lg"
              fullWidth
              mt="xl"
            >
              Listeye Dön
            </Button>
          </Stack>
        </div>
      );
    }

    return (
      <div style={{ paddingTop: 20, paddingBottom: 300 }}>
        <Stack gap="lg">
          <Group>
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setShowForm(false)}
              leftSection={<IconArrowLeft size={18} />}
              style={{ color: '#fff', paddingLeft: 0 }}
            >
              Geri Dön
            </Button>
          </Group>

          <Stack gap="xs">
            <Title order={2} style={{ color: '#fff' }}>Yeni Destek Talebi</Title>
            <Text c="dimmed">Sorununuzu detaylı bir şekilde açıklayın.</Text>
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Hata" color="red" variant="filled">
              {error}
            </Alert>
          )}

          <Stack gap="md">
            <TextInput
              label="Konu"
              placeholder="Örn: Bağlantı sorunu"
              value={newTicketTitle}
              onChange={(e) => setNewTicketTitle(e.currentTarget.value)}
              size="md"
              styles={{
                input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
                label: { color: '#fff', marginBottom: 8, fontWeight: 500 }
              }}
            />
            <Textarea
              label="Mesajınız"
              placeholder="Sorununuzu buraya yazın..."
              minRows={8}
              value={newTicketMessage}
              onChange={(e) => setNewTicketMessage(e.currentTarget.value)}
              size="md"
              styles={{
                input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
                label: { color: '#fff', marginBottom: 8, fontWeight: 500 }
              }}
            />
            <Button
              color="teal"
              size="lg"
              fullWidth
              onClick={handleCreateTicket}
              loading={submitting}
              disabled={!newTicketTitle || !newTicketMessage}
              mt="md"
              mb="xl"
            >
              Talebi Gönder
            </Button>
          </Stack>
        </Stack>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 20, paddingBottom: 40 }}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2} style={{ color: '#fff' }}>Destek Talepleri</Title>
          <Button
            leftSection={<IconPlus size={18} />}
            color="teal"
            variant="light"
            onClick={handleNewTicket}
          >
            Yeni Talep
          </Button>
        </Group>

        {error && !showForm && (
          <Alert icon={<IconAlertCircle size={16} />} title="Uyarı" color="orange" variant="filled" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {loading ? (
          <Group justify="center" mt="xl">
            <Loader color="teal" />
          </Group>
        ) : tickets.length === 0 ? (
          <Card padding="xl" radius="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Stack align="center" gap="md">
              <IconMessage size={48} style={{ opacity: 0.5, color: '#fff' }} />
              <Text c="dimmed" ta="center">Henüz bir destek talebiniz bulunmuyor.</Text>
              <Button color="teal" onClick={handleNewTicket}>İlk Talebini Oluştur</Button>
            </Stack>
          </Card>
        ) : (
          <Stack gap="md">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                padding="md"
                radius="md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => onTicketClick(ticket.id)}
                className="ticket-card"
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500} style={{ color: '#fff' }}>#{ticket.id} {ticket.title}</Text>
                  <Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
}

export default SupportScreen;


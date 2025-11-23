import { useState, useEffect } from 'react';
import { Stack, Title, Text, Button, Group, Card, Badge, TextInput, Textarea, Loader } from '@mantine/core';
import { IconPlus, IconMessage, IconArrowLeft, IconCheck } from '@tabler/icons-react';
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

  const fetchTickets = async () => {
    try {
      setLoading(true);
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

  const handleCreateTicket = async () => {
    if (!newTicketTitle || !newTicketMessage) return;
    
    try {
      setSubmitting(true);
      console.log('Creating ticket:', { title: newTicketTitle, message: newTicketMessage });
      await ticketService.createTicket(newTicketTitle, newTicketMessage);
      console.log('Ticket created successfully');
      
      setSuccess(true);
      setNewTicketTitle('');
      setNewTicketMessage('');
      fetchTickets();
    } catch (error) {
      console.error('Failed to create ticket', error);
      alert('Talep oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToList = () => {
    setSuccess(false);
    setShowForm(false);
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
                Destek talebiniz başarıyla iletildi.<br/>En kısa sürede yanıt verilecektir.
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
      <div style={{ paddingTop: 20, paddingBottom: 40 }}>
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
            onClick={() => setShowForm(true)}
          >
            Yeni Talep
          </Button>
        </Group>

        {loading ? (
          <Group justify="center" mt="xl">
            <Loader color="teal" />
          </Group>
        ) : tickets.length === 0 ? (
          <Card padding="xl" radius="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Stack align="center" gap="md">
              <IconMessage size={48} style={{ opacity: 0.5, color: '#fff' }} />
              <Text c="dimmed" ta="center">Henüz bir destek talebiniz bulunmuyor.</Text>
              <Button color="teal" onClick={() => setShowForm(true)}>İlk Talebini Oluştur</Button>
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


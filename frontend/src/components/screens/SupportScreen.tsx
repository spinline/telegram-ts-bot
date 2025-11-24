import { useState, useEffect } from 'react';
import { Stack, Title, Text, Button, Group, Card, Badge, TextInput, Textarea, Loader, Alert, useMantineTheme } from '@mantine/core';
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
  const theme = useMantineTheme();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTickets('ALL');
      if (data?.tickets && Array.isArray(data.tickets)) {
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

  const handleNewTicket = () => {
    // Check if user has an active ticket
    const activeTicket = tickets.find(t => t.status !== 'CLOSED');
    if (activeTicket) {
      setError(`Zaten açık bir talebiniz var (#${activeTicket.id}). Yeni talep oluşturmak için önce mevcut talebinizi kapatmanız gerekiyor.`);
      return;
    }
    setShowForm(true);
    setError(null);
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
    } catch (err) {
      console.error('❌ Failed to create ticket:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status
      });
      
      const errorMessage = (err as any)?.response?.data?.error 
        || (err instanceof Error ? err.message : null)
        || 'Talep oluşturulurken bir hata oluştu.';
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
              <Text color="dimmed" style={{ textAlign: 'center' }} size="lg">
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
      <div 
        style={{ paddingTop: 20, paddingBottom: 300 }}
        onClick={(e) => {
          // Close keyboard when clicking outside input fields
          const target = e.target as HTMLElement;
          if (!target.closest('input') && !target.closest('textarea') && !target.closest('button')) {
            // Force blur all active inputs
            document.querySelectorAll('input, textarea').forEach(el => {
              if (el === document.activeElement) {
                (el as HTMLElement).blur();
              }
            });
          }
        }}
      >
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
            <Text color="dimmed">Sorununuzu detaylı bir şekilde açıklayın.</Text>
          </Stack>
          
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Hata" color="red" variant="filled">
              {error}
            </Alert>
          )}
          
          <Stack gap="md">
            <TextInput
              label="Başlık *"
              placeholder="Örn: Bağlantı sorunu"
              value={newTicketTitle}
              onChange={(e) => setNewTicketTitle(e.currentTarget.value)}
              size="md"
              styles={{ 
                input: { 
                  backgroundColor: theme.colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.04)',
                  color: theme.colorScheme === 'dark' ? '#fff' : '#0f172a',
                  border: theme.colorScheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15, 23, 42, 0.06)',
                  fontSize: '16px'
                },
                label: {
                  color: theme.colorScheme === 'dark' ? '#fff' : '#0f172a',
                  fontWeight: 600,
                  marginBottom: 8,
                  fontSize: '14px'
                }
              }}
            />
            <Textarea
              label="Açıklama *"
              placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
              minRows={12}
              value={newTicketMessage}
              onChange={(e) => setNewTicketMessage(e.currentTarget.value)}
              size="md"
              styles={{ 
                input: { 
                  backgroundColor: theme.colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.04)',
                  color: theme.colorScheme === 'dark' ? '#fff' : '#0f172a',
                  border: theme.colorScheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15, 23, 42, 0.06)',
                  fontSize: '16px',
                  minHeight: '200px'
                },
                label: {
                  color: theme.colorScheme === 'dark' ? '#fff' : '#0f172a',
                  fontWeight: 600,
                  marginBottom: 8,
                  fontSize: '14px'
                }
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
              <Text color="dimmed" style={{ textAlign: 'center' }}>Henüz bir destek talebiniz bulunmuyor.</Text>
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
                <Group justify="space-between" style={{ marginBottom: 'var(--mantine-spacing-xs)' }}>
                  <Text style={{ color: '#fff', fontWeight: 500 }}>#{ticket.id} {ticket.title}</Text>
                  <Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                </Group>
                <Text size="sm" color="dimmed">
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


import { useState, useEffect } from 'react';
import { Stack, Title, Text, Button, Group, Card, Badge, Drawer, TextInput, Textarea, Loader } from '@mantine/core';
import { IconPlus, IconMessage } from '@tabler/icons-react';
import { ticketService } from '../../services/ticket.service';
import type { Ticket } from '../../services/ticket.service';
import { useDisclosure } from '@mantine/hooks';

interface SupportScreenProps {
  onTicketClick: (ticketId: number) => void;
}

function SupportScreen({ onTicketClick }: SupportScreenProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [creating, setCreating] = useState(false);

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
      setCreating(true);
      await ticketService.createTicket(newTicketTitle, newTicketMessage);
      close();
      setNewTicketTitle('');
      setNewTicketMessage('');
      fetchTickets();
    } catch (error) {
      console.error('Failed to create ticket', error);
      alert('Failed to create ticket. You might already have an active ticket.');
    } finally {
      setCreating(false);
    }
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

  return (
    <div style={{ paddingTop: 20, paddingBottom: 40 }}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2} style={{ color: '#fff' }}>Destek Talepleri</Title>
          <Button 
            leftSection={<IconPlus size={18} />} 
            color="teal" 
            variant="light"
            onClick={open}
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
              <Button color="teal" onClick={open}>İlk Talebini Oluştur</Button>
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

      <Drawer 
        opened={opened} 
        onClose={close} 
        title="Yeni Destek Talebi"
        position="bottom"
        size="auto"
        radius="md"
        styles={{
          content: { backgroundColor: '#1A1B1E', color: 'white' },
          header: { backgroundColor: '#1A1B1E', color: 'white' },
          body: { backgroundColor: '#1A1B1E', color: 'white', paddingBottom: 40 }
        }}
      >
        <Stack>
          <TextInput
            label="Konu"
            placeholder="Örn: Bağlantı sorunu"
            value={newTicketTitle}
            onChange={(e) => setNewTicketTitle(e.currentTarget.value)}
            styles={{ 
              input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
              label: { color: '#fff' }
            }}
          />
          <Textarea
            label="Mesajınız"
            placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
            minRows={4}
            value={newTicketMessage}
            onChange={(e) => setNewTicketMessage(e.currentTarget.value)}
            styles={{ 
              input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
              label: { color: '#fff' }
            }}
          />
          <Button 
            color="teal" 
            fullWidth 
            onClick={handleCreateTicket} 
            loading={creating}
            disabled={!newTicketTitle || !newTicketMessage}
          >
            Gönder
          </Button>
        </Stack>
      </Drawer>
    </div>
  );
}

export default SupportScreen;


import { useState, useEffect, useRef } from 'react';
import { Stack, Title, Text, Button, Group, Card, Badge, Textarea, Loader, ScrollArea } from '@mantine/core';
import { IconSend, IconUser, IconHeadset, IconX } from '@tabler/icons-react';
import { ticketService } from '../../services/ticket.service';
import type { Ticket } from '../../services/ticket.service';

interface TicketDetailScreenProps {
  ticketId: number;
}

function TicketDetailScreen({ ticketId }: TicketDetailScreenProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await ticketService.getTicketById(ticketId);
      setTicket(data);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch ticket', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchTicket, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const scrollToBottom = () => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      setSending(true);
      await ticketService.replyTicket(ticketId, replyMessage);
      setReplyMessage('');
      fetchTicket();
    } catch (error) {
      console.error('Failed to reply', error);
      alert('Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = () => {
    const webApp = window.Telegram?.WebApp;
    const confirmMessage = 'Bu destek talebini kapatmak istediğinize emin misiniz? Kapatılan talepler tekrar açılamaz.';

    if (webApp?.showConfirm) {
      webApp.showConfirm(confirmMessage, async (confirmed: boolean) => {
        if (confirmed) {
          await performCloseTicket();
        }
      });
    } else {
      if (window.confirm(confirmMessage)) {
        performCloseTicket();
      }
    }
  };

  const performCloseTicket = async () => {
    try {
      await ticketService.closeTicket(ticketId);
      fetchTicket();
    } catch (error) {
      console.error('Failed to close ticket', error);
      alert('Failed to close ticket.');
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

  if (loading && !ticket) {
    return (
      <Group justify="center" mt="xl">
        <Loader color="teal" />
      </Group>
    );
  }

  if (!ticket) {
    return <Text c="red" ta="center" mt="xl">Ticket not found</Text>;
  }

  return (
    <div style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <Stack gap="xs" mb="md">
        <Group justify="space-between">
          <Group gap="xs">
            <Title order={3} style={{ color: '#fff' }}>#{ticket.id} {ticket.title}</Title>
            <Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
          </Group>
          {ticket.status !== 'CLOSED' && (
            <Button
              color="red"
              variant="subtle"
              size="xs"
              leftSection={<IconX size={14} />}
              onClick={handleCloseTicket}
            >
              Kapat
            </Button>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {new Date(ticket.createdAt).toLocaleString('tr-TR')}
        </Text>
      </Stack>

      <ScrollArea style={{ flex: 1, marginBottom: 20, marginLeft: -10, marginRight: -10 }} viewportRef={viewport}>
        <Stack gap="md" px="xs">
          {ticket.messages?.map((msg) => (
            <Group
              key={msg.id}
              align="flex-start"
              justify={msg.isUserMessage ? 'flex-end' : 'flex-start'}
              gap="xs"
            >
              {!msg.isUserMessage && (
                <IconHeadset size={24} style={{ marginTop: 4, color: '#14b8a6' }} />
              )}

              <Card
                padding="sm"
                radius="md"
                style={{
                  maxWidth: '100%',
                  backgroundColor: msg.isUserMessage ? '#14b8a6' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff'
                }}
              >
                <Text size="sm">{msg.messageText}</Text>
                <Text size="xs" style={{ opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Card>

              {msg.isUserMessage && (
                <IconUser size={24} style={{ marginTop: 4, color: '#fff' }} />
              )}
            </Group>
          ))}
        </Stack>
      </ScrollArea>

      {ticket.status !== 'CLOSED' ? (
        <Group align="flex-end" gap="xs" style={{ paddingBottom: 20 }}>
          <Textarea
            placeholder="Yanıtınız..."
            minRows={1}
            maxRows={4}
            autosize
            style={{ flex: 1 }}
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
            styles={{ input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }}
          />
          <Button
            color="teal"
            onClick={handleReply}
            loading={sending}
            disabled={!replyMessage.trim()}
            style={{ height: 36, width: 36, padding: 0 }}
          >
            <IconSend size={18} />
          </Button>
        </Group>
      ) : (
        <Card padding="sm" radius="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          <Text ta="center" c="dimmed" size="sm">Bu destek talebi kapatılmıştır.</Text>
        </Card>
      )}
    </div>
  );
}

export default TicketDetailScreen;

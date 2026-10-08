// FlowDesk Assistant: a deterministic, rule-based helper. It recognises a small set of intents
// and answers them from the user's own FlowDesk data (through the normal, authorised API) or
// from the Help Center content. It does not call a language model.

import { ticketService } from '@/services/ticket.service';
import { notificationService } from '@/services/notification.service';
import { searchHelp, HelpArticle } from '@/content/help';
import { ApiError, Role, TicketResponse, TicketStatus, TicketSummary } from '@/types';

export type AssistantBlock =
  | { kind: 'text'; text: string }
  | { kind: 'tickets'; tickets: TicketResponse[]; total: number; viewAllHref?: string }
  | { kind: 'ticket'; ticket: TicketResponse }
  | { kind: 'summary'; summary: TicketSummary }
  | { kind: 'help'; articles: HelpArticle[] }
  | { kind: 'actions'; actions: { label: string; href: string }[] };

export interface AssistantReply {
  blocks: AssistantBlock[];
}

const STATUS_WORDS: [RegExp, TicketStatus][] = [
  [/\bin[\s-]?progress\b|\bworking on\b/, 'IN_PROGRESS'],
  [/\bresolved\b/, 'RESOLVED'],
  [/\bclosed\b/, 'CLOSED'],
  [/\bcancel+ed\b/, 'CANCELLED'],
  [/\bopen\b|\bunassigned\b|\bnew\b/, 'OPEN'],
];

// How-to questions go to the Help Center rather than to data lookups
const QUESTION = /\b(what|how|why|when|can i|should i)\b/;

export const SUGGESTIONS = [
  'Show tickets at risk of breaching SLA',
  'Give me an overview of my tickets',
  'Status of ticket #1',
  'How do I create a ticket?',
  'What happens when an SLA is breached?',
  'Do I have unread notifications?',
];

function scopeLabel(role: Role | undefined) {
  switch (role) {
    case 'EMPLOYEE':
      return 'tickets you created';
    case 'SUPPORT_ENGINEER':
      return 'tickets assigned to you';
    case 'MANAGER':
      return 'tickets in your department';
    default:
      return 'all tickets';
  }
}

export async function answer(input: string, role: Role | undefined, canCreate: boolean): Promise<AssistantReply> {
  const text = input.trim();
  const q = text.toLowerCase();
  const escalate = canCreate ? [{ label: 'Create a ticket', href: '/tickets/new' }] : [];

  // 1. A specific ticket: "#12", "ticket 12", "status of 12"
  const idMatch = q.match(/#\s*(\d{1,9})\b/) || q.match(/\bticket\s+(?:number\s+)?(\d{1,9})\b/) || (/^\d{1,9}$/.test(q) ? [q, q] : null);
  if (idMatch) {
    const id = Number(idMatch[1]);
    try {
      const ticket = await ticketService.getById(id);
      return { blocks: [{ kind: 'text', text: `Here is ticket #${id}:` }, { kind: 'ticket', ticket }] };
    } catch (err) {
      const status = (err as ApiError).status;
      return {
        blocks: [
          {
            kind: 'text',
            text:
              status === 403
                ? `You don't have access to ticket #${id}. You can only open ${scopeLabel(role)}.`
                : status === 404
                  ? `Ticket #${id} doesn't exist.`
                  : `I couldn't load ticket #${id} right now. Please try again.`,
          },
        ],
      };
    }
  }

  // 2. SLA risk
  if (/\b(at[\s-]?risk|sla|breach|breached|overdue|late|escalat)/.test(q) && !QUESTION.test(q)) {
    const page = await ticketService.getPage({ atRisk: true, size: 5 });
    return {
      blocks: page.totalElements
        ? [
            { kind: 'text', text: `${page.totalElements} active ticket${page.totalElements === 1 ? ' is' : 's are'} at risk or past an SLA deadline (${scopeLabel(role)}):` },
            { kind: 'tickets', tickets: page.content, total: page.totalElements, viewAllHref: '/tickets?atRisk=true' },
          ]
        : [{ kind: 'text', text: `Good news: none of the ${scopeLabel(role)} are currently at risk of breaching their SLA.` }],
    };
  }

  // 3. Overview / counts
  if (/\b(overview|summary|how many|count|stats|statistics|workload|dashboard)\b/.test(q)) {
    const summary = await ticketService.getSummary();
    return { blocks: [{ kind: 'text', text: `Overview of ${scopeLabel(role)}:` }, { kind: 'summary', summary }] };
  }

  // 4. Notifications
  if (/\b(notification|unread|bell|alerts?)\b/.test(q) && !QUESTION.test(q)) {
    const { unreadCount } = await notificationService.getUnreadCount();
    return {
      blocks: [
        {
          kind: 'text',
          text: unreadCount
            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}. Open the bell in the top bar to read them.`
            : 'You have no unread notifications.',
        },
      ],
    };
  }

  // 5. Ticket lists by status ("my open tickets", "in progress")
  const wantsList = /\b(tickets?|requests?|show|list|my)\b/.test(q) && !QUESTION.test(q);
  if (wantsList) {
    const status = STATUS_WORDS.find(([re]) => re.test(q))?.[1];
    const page = await ticketService.getPage({ status, size: 5 });
    const label = status ? `${status.replace('_', ' ').toLowerCase()} ` : '';
    return {
      blocks: page.totalElements
        ? [
            { kind: 'text', text: `${page.totalElements} ${label}ticket${page.totalElements === 1 ? '' : 's'} (${scopeLabel(role)}), newest first:` },
            { kind: 'tickets', tickets: page.content, total: page.totalElements, viewAllHref: status ? `/tickets?status=${status}` : '/tickets' },
          ]
        : [{ kind: 'text', text: `There are no ${label}tickets among the ${scopeLabel(role)}.` }],
    };
  }

  // 6. How-to questions from the Help Center
  const articles = searchHelp(text, 1);
  if (articles.length) {
    return { blocks: [{ kind: 'help', articles }] };
  }

  // 7. Fallback with a human escalation path
  return {
    blocks: [
      {
        kind: 'text',
        text:
          "I can look up tickets (try “#12” or “my open tickets”), show SLA risks, summarise your workload, check notifications and answer questions about how FlowDesk works. For anything else, a person can help" +
          (canCreate ? ': create a ticket and the support team will pick it up.' : ': ask your manager or browse the Help Center.'),
      },
      { kind: 'actions', actions: [...escalate, { label: 'Open Help Center', href: '/help' }] },
    ],
  };
}

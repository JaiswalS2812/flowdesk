// Product help, written from how FlowDesk actually behaves (backend rules in the FlowDesk
// repository). Used by the Help Center, the assistant and the command palette.

export type HelpCategory = 'getting-started' | 'tickets' | 'sla' | 'notifications' | 'account' | 'admin';

export interface HelpArticle {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string[];
  keywords: string[];
  link?: { href: string; label: string };
}

export const HELP_CATEGORIES: { id: HelpCategory; title: string; description: string }[] = [
  { id: 'getting-started', title: 'Getting started', description: 'Roles, signing in and finding your way around' },
  { id: 'tickets', title: 'Tickets & workflow', description: 'Creating, assigning and progressing requests' },
  { id: 'sla', title: 'SLAs & escalation', description: 'Response and resolution targets and how breaches are detected' },
  { id: 'notifications', title: 'Notifications', description: 'What you are notified about and when' },
  { id: 'account', title: 'Account & security', description: 'Passwords, sessions and sign-in protection' },
  { id: 'admin', title: 'Administration', description: 'Users, roles, SLA policies and the audit log' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'roles',
    category: 'getting-started',
    question: 'What can each role do?',
    answer: [
      'Employees create tickets and can view and comment on the tickets they created.',
      'Support engineers work the tickets assigned to them: they can view them, comment and move them through the workflow.',
      'Managers see every ticket of their department, assign tickets to support engineers of that department and change ticket status.',
      'Admins see all tickets and also manage users, SLA policies and the audit log.',
    ],
    keywords: ['role', 'permission', 'employee', 'engineer', 'manager', 'admin', 'access', 'who can'],
  },
  {
    id: 'register',
    category: 'getting-started',
    question: 'I just registered. Why can I only see my own tickets?',
    answer: [
      'Every new account starts as an Employee. Only an administrator can change your role or department.',
      'If you need engineer, manager or admin access, ask your FlowDesk administrator to update your role.',
    ],
    keywords: ['register', 'sign up', 'new account', 'role', 'access', 'employee'],
  },
  {
    id: 'shortcuts',
    category: 'getting-started',
    question: 'Are there keyboard shortcuts?',
    answer: [
      'Press Ctrl K (⌘ K on macOS) anywhere in the app to open the command menu: jump to pages, open a ticket by number, search tickets or switch the theme.',
      'In a comment box, press Ctrl Enter (⌘ Enter) to post.',
    ],
    keywords: ['keyboard', 'shortcut', 'command', 'search', 'ctrl k'],
  },
  {
    id: 'create-ticket',
    category: 'tickets',
    question: 'How do I create a ticket?',
    answer: [
      'Choose New Ticket, give it a short title, describe the problem and pick a priority.',
      'The ticket is filed under your own department automatically, and its response and resolution deadlines are set from the SLA policy for the chosen priority.',
    ],
    keywords: ['create', 'new ticket', 'submit', 'raise', 'report', 'request', 'open a ticket'],
    link: { href: '/tickets/new', label: 'Create a ticket' },
  },
  {
    id: 'priority',
    category: 'tickets',
    question: 'Which priority should I choose?',
    answer: [
      'Low: a general request or question with no business impact. Medium: some impact, but a workaround exists.',
      'High: business operations are significantly affected. Critical: a severe outage that blocks work for many people.',
      'Higher priorities have shorter response and resolution targets, so reserve Critical for genuine outages.',
    ],
    keywords: ['priority', 'urgent', 'critical', 'high', 'low', 'medium', 'severity'],
  },
  {
    id: 'workflow',
    category: 'tickets',
    question: 'How does a ticket move through the workflow?',
    answer: [
      'Open → In Progress → Resolved → Closed. Open and In Progress tickets can also be cancelled.',
      'A ticket must be assigned to a support engineer before it can move to In Progress or Resolved. Closed and cancelled tickets are final.',
      'FlowDesk only offers the transitions that are valid for the current status; any other change is rejected.',
    ],
    keywords: ['status', 'workflow', 'in progress', 'resolved', 'closed', 'cancel', 'transition', 'lifecycle'],
  },
  {
    id: 'assignment',
    category: 'tickets',
    question: 'Who assigns tickets?',
    answer: [
      'Managers assign tickets of their department to active support engineers of the same department. Admins can assign any ticket.',
      'Tickets can be reassigned until they are closed or cancelled; both the new and the previous engineer are notified.',
    ],
    keywords: ['assign', 'assignment', 'reassign', 'engineer', 'who handles'],
  },
  {
    id: 'visibility',
    category: 'tickets',
    question: 'Why can’t I see a ticket?',
    answer: [
      'Employees see the tickets they created, engineers the tickets assigned to them and managers the tickets of their department.',
      'Opening a ticket outside those rules is refused by the server, even with a direct link.',
    ],
    keywords: ['see', 'visible', 'missing', 'forbidden', 'not allowed', 'access denied'],
  },
  {
    id: 'sla-targets',
    category: 'sla',
    question: 'What are the SLA targets?',
    answer: [
      'Each priority has a response target (time to first move to In Progress) and a resolution target. Administrators configure them on the SLA Policies page.',
      'Deadlines are fixed when a ticket is created; later policy changes apply to new tickets only.',
    ],
    keywords: ['sla', 'target', 'deadline', 'response time', 'resolution time', 'policy'],
  },
  {
    id: 'sla-breach',
    category: 'sla',
    question: 'When is a ticket “at risk” or “breached”?',
    answer: [
      'A ticket is at risk in the last 20% of its resolution window, and breached when the response or resolution happens after its deadline (or has not happened when the deadline passes).',
      'A background check runs every minute. It records the escalation level, logs the first breach in the audit log and notifies the assigned engineer and the department managers.',
      'Cancelled tickets are excluded from SLA tracking.',
    ],
    keywords: ['breach', 'breached', 'at risk', 'warning', 'overdue', 'escalation', 'late'],
  },
  {
    id: 'notifications',
    category: 'notifications',
    question: 'What am I notified about?',
    answer: [
      'Assignments, status changes on your tickets, new comments on tickets you created or work on, SLA warnings and breaches (engineers and managers), and changes to your own role or department.',
      'You are never notified about your own actions.',
    ],
    keywords: ['notification', 'notify', 'alert', 'bell', 'unread'],
  },
  {
    id: 'notification-delivery',
    category: 'notifications',
    question: 'Are notifications real-time?',
    answer: [
      'Notifications are stored in FlowDesk and shown in the bell. The unread count refreshes about once a minute while the tab is open, and the list loads when you open it.',
      'There are no email or push notifications.',
    ],
    keywords: ['real time', 'realtime', 'email', 'push', 'refresh', 'delay'],
  },
  {
    id: 'password',
    category: 'account',
    question: 'How do I change my password?',
    answer: [
      'Open Account and enter your current password and a new one. Passwords need 10–100 characters with at least one letter and one number, must not contain your email name and must not be a common password.',
      'After a change every existing session, including the current one, is signed out.',
    ],
    keywords: ['password', 'change password', 'sign out', 'session'],
    link: { href: '/account', label: 'Go to Account' },
  },
  {
    id: 'forgot-password',
    category: 'account',
    question: 'I forgot my password. Can I reset it?',
    answer: [
      'FlowDesk does not offer password reset by email in this deployment, and administrators cannot see passwords.',
      'Contact your FlowDesk administrator for help regaining access.',
    ],
    keywords: ['forgot', 'reset', 'lost password', 'cannot sign in', 'locked'],
  },
  {
    id: 'throttling',
    category: 'account',
    question: 'Why am I told to try again later when signing in?',
    answer: [
      'After repeated failed sign-ins FlowDesk temporarily blocks further attempts for that account and network, to protect against password guessing.',
      'The block lifts on its own; the message tells you how long to wait.',
    ],
    keywords: ['too many', 'try again later', 'blocked', 'throttle', '429', 'sign in failed'],
  },
  {
    id: 'session',
    category: 'account',
    question: 'Why was I signed out?',
    answer: [
      'Sessions last one hour. You are also signed out after changing your password, or if an administrator deactivates your account.',
    ],
    keywords: ['signed out', 'logged out', 'session', 'expired'],
  },
  {
    id: 'deactivation',
    category: 'admin',
    question: 'How does user deactivation work?',
    answer: [
      'Users are deactivated, never deleted, so their tickets, comments and history stay intact. A deactivated user cannot sign in and existing sessions stop working immediately.',
      'Administrators cannot deactivate themselves or the last active admin, and users with open or in-progress assigned tickets must have them reassigned first.',
    ],
    keywords: ['deactivate', 'disable', 'remove user', 'delete user', 'reactivate'],
  },
  {
    id: 'roles-admin',
    category: 'admin',
    question: 'How do I change someone’s role or department?',
    answer: [
      'On the Users page choose Edit for the user. Admins cannot change their own role, and the last active admin cannot be demoted.',
      'Support engineers with open or in-progress assigned tickets must have them reassigned before their role or department changes. The user is notified of the change.',
    ],
    keywords: ['role', 'department', 'promote', 'change role', 'edit user'],
  },
  {
    id: 'audit',
    category: 'admin',
    question: 'What does the audit log record?',
    answer: [
      'Ticket creation, assignment, status changes and comments; SLA breaches (recorded by the system); SLA policy changes; role, department and activation changes; and password changes.',
    ],
    keywords: ['audit', 'activity', 'log', 'history', 'who changed'],
  },
];

export function searchHelp(query: string, limit = 5): HelpArticle[] {
  const terms = query.toLowerCase().split(/[^a-z0-9#]+/).filter((t) => t.length > 2);
  if (terms.length === 0) return [];
  const scored = HELP_ARTICLES.map((article) => {
    const hay = `${article.question} ${article.keywords.join(' ')}`.toLowerCase();
    const body = article.answer.join(' ').toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (hay.includes(term)) score += 3;
      else if (body.includes(term)) score += 1;
    }
    for (const keyword of article.keywords) if (query.toLowerCase().includes(keyword)) score += 4;
    return { article, score };
  });
  return scored
    .filter((s) => s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}

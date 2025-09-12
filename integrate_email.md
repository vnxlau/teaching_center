# Email Integration Action Plan for Teaching Center

## Overview
This document outlines a comprehensive plan to integrate email functionality into the Teaching Center application, enabling automated and manual email communications with parents, students, and staff.

## 🎯 Objectives
- Enable automated email notifications for important events
- Provide manual email composition and sending capabilities
- Integrate with Gmail for reliable email delivery
- Maintain email history and tracking
- Ensure security and privacy compliance

## 📋 Action Plan

### Phase 1: Infrastructure Setup

#### 1.1 Email Service Provider Selection
**Options:**
- **Gmail API** (Recommended for direct Gmail integration)
- **SendGrid** (Professional email service)
- **AWS SES** (Scalable cloud solution)
- **Nodemailer with Gmail SMTP** (Simple implementation)

**Recommendation:** Start with Gmail API for direct integration, with SendGrid as backup option.

#### 1.2 Authentication Setup
**Gmail API Setup:**
1. Create Google Cloud Project
2. Enable Gmail API
3. Configure OAuth 2.0 credentials
4. Set up service account (for server-side operations)
5. Configure domain-wide delegation (for organizational Gmail)

**Security Considerations:**
- Implement proper OAuth flow
- Store credentials securely (environment variables)
- Use refresh tokens for long-term access
- Implement token rotation

#### 1.3 Database Schema Updates
Add new tables/collections:
```sql
-- Email Templates
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Logs
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  status VARCHAR(50) NOT NULL, -- sent, failed, bounced
  sent_at TIMESTAMP,
  error_message TEXT,
  template_id INTEGER REFERENCES email_templates(id),
  created_by INTEGER REFERENCES users(id)
);

-- User Email Preferences
CREATE TABLE user_email_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email_notifications BOOLEAN DEFAULT true,
  notification_types JSONB, -- payment_reminders, grade_updates, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 2: Backend Implementation

#### 2.1 Email Service Module
Create `/lib/email/` directory with:
```
email/
├── gmail.ts          # Gmail API integration
├── templates.ts      # Email template management
├── queue.ts          # Email queuing system
├── scheduler.ts      # Scheduled email sending
└── index.ts          # Main email service
```

#### 2.2 API Endpoints
New API routes:
```
POST /api/email/send              # Send single email
POST /api/email/bulk              # Send bulk emails
GET  /api/email/templates         # Get email templates
POST /api/email/templates         # Create email template
GET  /api/email/logs              # Get email logs
POST /api/email/preferences       # Update user preferences
```

#### 2.3 Email Templates System
Pre-built templates for:
- Payment reminders
- Grade notifications
- Attendance alerts
- Event invitations
- Welcome messages
- Password reset

Template variables:
- `{{student_name}}`
- `{{parent_name}}`
- `{{due_date}}`
- `{{amount}}`
- `{{grade}}`

### Phase 3: Frontend Implementation

#### 3.1 Email Management Interface
New admin pages:
- `/admin/email/compose` - Email composer
- `/admin/email/templates` - Template management
- `/admin/email/logs` - Email history
- `/admin/email/settings` - Email settings

#### 3.2 User Preferences
Settings pages for:
- Parents: `/parent/settings/email`
- Students: `/student/settings/email`
- Staff: `/admin/settings/email`

#### 3.3 Email Components
React components:
- `EmailComposer` - Rich text email editor
- `TemplateSelector` - Template selection dropdown
- `RecipientSelector` - Parent/student selection
- `EmailPreview` - Email preview modal
- `EmailLogsTable` - Email history table

### Phase 4: Automated Email Triggers

#### 4.1 Event-Based Triggers
Automatic emails for:
- **Payment Due**: 7 days, 3 days, 1 day before due date
- **Payment Overdue**: Immediate notification + daily reminders
- **Grade Posted**: When new grades are added
- **Attendance Alert**: When student misses classes
- **Event Reminder**: For school events, parent-teacher meetings
- **Report Card**: Monthly/quarterly academic reports

#### 4.2 Scheduled Emails
- Weekly payment summaries
- Monthly attendance reports
- End-of-month financial statements
- Birthday notifications

### Phase 5: Security & Compliance

#### 5.1 Data Protection
- GDPR compliance for EU users
- Email unsubscribe functionality
- Data retention policies
- Secure credential storage

#### 5.2 Rate Limiting
- Prevent email spam
- Implement sending limits
- Queue management for bulk emails

#### 5.3 Monitoring & Logging
- Email delivery tracking
- Bounce rate monitoring
- Open rate analytics
- Error logging and alerting

### Phase 6: Testing & Deployment

#### 6.1 Testing Strategy
- Unit tests for email service functions
- Integration tests for Gmail API
- End-to-end tests for email workflows
- Load testing for bulk email sending

#### 6.2 Deployment Checklist
- Environment variable configuration
- Gmail API credentials setup
- Database migrations
- Email template seeding
- User preference initialization

## 🛠️ Technical Implementation Details

### Gmail API Integration Example

```typescript
// lib/email/gmail.ts
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

export class GmailService {
  private gmail: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GMAIL_CLIENT_EMAIL,
        private_key: process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });

    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async sendEmail(to: string, subject: string, body: string) {
    const raw = this.createEmailRaw(to, subject, body);

    try {
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });
      return result.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private createEmailRaw(to: string, subject: string, body: string): string {
    const email = [
      `To: ${to}`,
      'From: Teaching Center <noreply@teachingcenter.com>',
      `Subject: ${subject}`,
      '',
      body,
    ].join('\r\n');

    return Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
```

### Email Template System

```typescript
// lib/email/templates.ts
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    subject: 'Payment Due for {{student_name}}',
    body: `Dear {{parent_name}},

This is a reminder that payment of €{{amount}} is due on {{due_date}} for {{student_name}}'s {{payment_type}}.

Please ensure payment is made by the due date to avoid late fees.

Best regards,
Teaching Center Administration`,
    variables: ['parent_name', 'student_name', 'amount', 'due_date', 'payment_type'],
  },
  // ... more templates
];

export function renderTemplate(template: EmailTemplate, data: Record<string, any>): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, String(value));
    body = body.replace(regex, String(value));
  });

  return { subject, body };
}
```

## 📊 Success Metrics

### Email Delivery Metrics
- Delivery rate > 95%
- Bounce rate < 2%
- Open rate > 30%
- Click-through rate > 10%

### User Engagement
- Parent response rate to payment reminders
- Student login rate after grade notifications
- Unsubscribe rate < 5%

## 🚀 Implementation Timeline

### Week 1-2: Infrastructure Setup
- Set up Gmail API credentials
- Create database schema
- Implement basic email service

### Week 3-4: Core Functionality
- Email composer interface
- Template system
- Basic sending capabilities

### Week 5-6: Automation
- Event triggers
- Scheduled emails
- Bulk sending

### Week 7-8: Advanced Features
- Email analytics
- User preferences
- Advanced templates

### Week 9-10: Testing & Deployment
- Comprehensive testing
- Performance optimization
- Production deployment

## 💡 Future Enhancements

### Advanced Features
- Email marketing campaigns
- A/B testing for email content
- SMS integration as backup
- Email signature management
- Attachment support

### Analytics Dashboard
- Email performance metrics
- User engagement tracking
- ROI measurement for automated emails

## 🔒 Security Considerations

### Data Protection
- Encrypt sensitive email data
- Implement proper access controls
- Regular security audits
- Compliance with email regulations (CAN-SPAM, GDPR)

### Operational Security
- Monitor for email abuse
- Implement rate limiting
- Secure credential management
- Regular backup of email logs

## 📞 Support & Maintenance

### Monitoring
- Email delivery monitoring
- Error alerting
- Performance tracking
- User feedback collection

### Maintenance Tasks
- Regular credential rotation
- Template updates
- Database cleanup
- Performance optimization

---

**Note:** This action plan provides a comprehensive roadmap for email integration. Implementation should be done incrementally, starting with basic functionality and gradually adding advanced features. Regular testing and user feedback should guide the development process.</content>
<parameter name="filePath">/home/goncalo/projects/AI/teachingCenter/integrate_email.md

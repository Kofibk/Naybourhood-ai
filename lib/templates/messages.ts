/**
 * Email and WhatsApp Message Templates
 * UK English - For every stage of the lead journey
 */

export interface MessageTemplate {
  id: string
  name: string
  stage: string
  type: 'email' | 'whatsapp' | 'both'
  subject?: string // Email only
  body: string
  placeholders: string[]
}

// Available placeholders:
// {{name}} - Lead's first name or full name
// {{development}} - Property development name
// {{agent}} - Agent's name
// {{company}} - Company name
// {{date}} - Suggested date
// {{time}} - Suggested time
// {{price}} - Property price
// {{bedrooms}} - Number of bedrooms
// {{location}} - Property location
// {{phone}} - Agent's phone number

export const EMAIL_TEMPLATES: MessageTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════
  // CONTACT PENDING - Initial Outreach
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'contact_pending_intro',
    name: 'Initial Introduction',
    stage: 'Contact Pending',
    type: 'email',
    subject: 'Your Property Enquiry - {{development}}',
    body: `Dear {{name}},

Thank you for your interest in {{development}}. I'm {{agent}} from {{company}}, and I'll be helping you with your property search.

I'd love to learn more about what you're looking for and discuss some options that might be perfect for you.

Would you be available for a brief call this week? Please let me know a time that suits you, or feel free to call me directly on {{phone}}.

I look forward to speaking with you.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'agent', 'company', 'phone'],
  },
  {
    id: 'contact_pending_warm',
    name: 'Warm Introduction (Referral)',
    stage: 'Contact Pending',
    type: 'email',
    subject: 'Introduction - {{development}}',
    body: `Dear {{name}},

I hope this email finds you well. I understand you've been looking at properties at {{development}}, and I wanted to introduce myself.

I'm {{agent}}, and I specialise in helping buyers find their ideal property in this development. I've helped numerous clients secure homes here and would be delighted to do the same for you.

I have some excellent units available that I think would suit your requirements. When would be a good time for a chat?

Best regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'agent', 'company'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FOLLOW UP - Maintaining Contact
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'follow_up_first',
    name: 'First Follow Up',
    stage: 'Follow Up',
    type: 'email',
    subject: 'Following Up - {{development}}',
    body: `Dear {{name}},

I wanted to follow up on my previous message regarding {{development}}.

I appreciate you may be busy, but I didn't want you to miss out on some excellent opportunities currently available. We have {{bedrooms}}-bedroom properties starting from {{price}}, and interest has been strong.

If you'd like to discuss your requirements or arrange a viewing, please don't hesitate to get in touch.

I'm here to help whenever you're ready.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'bedrooms', 'price', 'agent', 'company'],
  },
  {
    id: 'follow_up_second',
    name: 'Second Follow Up',
    stage: 'Follow Up',
    type: 'email',
    subject: 'Quick Check-in - {{development}}',
    body: `Dear {{name}},

I hope you're well. I wanted to check in and see if you've had any further thoughts about {{development}}.

I understand finding the right property takes time, and I'm here to answer any questions you might have about the development, the area, or the buying process.

Is there anything specific I can help you with?

Best regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'agent', 'company'],
  },
  {
    id: 'follow_up_value',
    name: 'Value-Add Follow Up',
    stage: 'Follow Up',
    type: 'email',
    subject: 'Market Update - {{location}}',
    body: `Dear {{name}},

I thought you might find this useful - we've recently seen strong demand in the {{location}} area, with properties achieving excellent rental yields and capital growth.

{{development}} in particular has been popular with buyers looking for quality investment opportunities.

If you'd like me to send you our latest availability and pricing, just let me know.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'location', 'development', 'agent', 'company'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // VIEWING BOOKED - Pre and Post Viewing
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'viewing_confirmation',
    name: 'Viewing Confirmation',
    stage: 'Viewing Booked',
    type: 'email',
    subject: 'Viewing Confirmed - {{development}} on {{date}}',
    body: `Dear {{name}},

I'm pleased to confirm your viewing at {{development}} on {{date}} at {{time}}.

Here are the details:
- Development: {{development}}
- Address: {{location}}
- Date: {{date}}
- Time: {{time}}

Please bring photo ID with you. If you need to reschedule, please let me know as soon as possible.

I look forward to meeting you and showing you around.

Kind regards,
{{agent}}
{{company}}
{{phone}}`,
    placeholders: ['name', 'development', 'date', 'time', 'location', 'agent', 'company', 'phone'],
  },
  {
    id: 'viewing_reminder',
    name: 'Viewing Reminder',
    stage: 'Viewing Booked',
    type: 'email',
    subject: 'Reminder: Your Viewing Tomorrow - {{development}}',
    body: `Dear {{name}},

Just a friendly reminder about your viewing tomorrow at {{development}}.

Date: {{date}}
Time: {{time}}
Location: {{location}}

Please remember to bring photo ID. If anything has changed, do let me know.

See you tomorrow!

Best regards,
{{agent}}`,
    placeholders: ['name', 'development', 'date', 'time', 'location', 'agent'],
  },
  {
    id: 'post_viewing',
    name: 'Post Viewing Follow Up',
    stage: 'Viewing Booked',
    type: 'email',
    subject: 'Thank You for Visiting {{development}}',
    body: `Dear {{name}},

Thank you for taking the time to view {{development}} today. It was a pleasure showing you around.

I hope you found the visit helpful. As we discussed, the property offers excellent value with {{bedrooms}} bedrooms at {{price}}.

Please let me know if you have any questions or if you'd like to discuss the next steps. I'm happy to arrange a second viewing if you'd like to see the property again.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'bedrooms', 'price', 'agent', 'company'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NEGOTIATING - Offer Stage
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'negotiating_offer_received',
    name: 'Offer Received Acknowledgement',
    stage: 'Negotiating',
    type: 'email',
    subject: 'Your Offer for {{development}} - Received',
    body: `Dear {{name}},

Thank you for submitting your offer for the property at {{development}}.

I've received your offer of {{price}} and will present it to the vendor/developer today. I'll be in touch as soon as I have a response.

In the meantime, if you haven't already, I'd recommend:
- Instructing a solicitor
- Confirming your funding arrangements
- Preparing proof of funds documentation

Please let me know if you need any recommendations for solicitors.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'price', 'agent', 'company'],
  },
  {
    id: 'negotiating_counter_offer',
    name: 'Counter Offer',
    stage: 'Negotiating',
    type: 'email',
    subject: 'Update on Your Offer - {{development}}',
    body: `Dear {{name}},

I've spoken with the vendor regarding your offer for {{development}}.

Whilst they appreciate your interest, they've asked if you would consider {{price}}. This reflects the strong demand we're seeing and the quality of the property.

I believe this represents fair value, and I'd be happy to discuss this with you. Would you like to arrange a call?

Best regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'price', 'agent', 'company'],
  },
  {
    id: 'negotiating_offer_accepted',
    name: 'Offer Accepted',
    stage: 'Negotiating',
    type: 'email',
    subject: 'Congratulations - Your Offer Has Been Accepted!',
    body: `Dear {{name}},

Wonderful news! I'm delighted to confirm that your offer of {{price}} for the property at {{development}} has been accepted.

Next steps:
1. Please confirm your solicitor's details as soon as possible
2. Provide proof of funds/mortgage agreement in principle
3. Complete the reservation form (attached)
4. Pay the reservation deposit

I'll be in touch shortly with the full documentation. Congratulations on securing this fantastic property!

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'price', 'development', 'agent', 'company'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // RESERVED - Documentation Stage
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'reserved_confirmation',
    name: 'Reservation Confirmation',
    stage: 'Reserved',
    type: 'email',
    subject: 'Reservation Confirmed - {{development}}',
    body: `Dear {{name}},

I'm pleased to confirm that your reservation at {{development}} is now complete. Your property has been taken off the market.

Your solicitor will receive the contract pack shortly. Please ensure they're instructed and ready to proceed.

Timeline:
- Contract pack: Within 5 working days
- Exchange target: 21-28 days
- Completion: As per contract

If you have any questions during this process, please don't hesitate to contact me.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'agent', 'company'],
  },
  {
    id: 'reserved_documents_request',
    name: 'Documents Request',
    stage: 'Reserved',
    type: 'email',
    subject: 'Documents Required - {{development}}',
    body: `Dear {{name}},

To proceed with your purchase at {{development}}, we require the following documents:

- Proof of identity (passport or driving licence)
- Proof of address (utility bill or bank statement, dated within 3 months)
- Proof of funds (bank statements or mortgage offer)
- Source of funds declaration
- Solicitor details

Please send these at your earliest convenience so we can keep things moving smoothly.

Let me know if you have any questions.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'agent', 'company'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // EXCHANGED - Legal Completion Stage
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'exchanged_confirmation',
    name: 'Exchange Confirmation',
    stage: 'Exchanged',
    type: 'email',
    subject: 'Contracts Exchanged - {{development}}',
    body: `Dear {{name}},

Congratulations! I'm thrilled to confirm that contracts have now been exchanged on your property at {{development}}.

Completion date: {{date}}

Your solicitor will be in contact regarding the final balance and completion arrangements.

You're now the legal owner-in-waiting of a fantastic property. Well done!

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'date', 'agent', 'company'],
  },
  {
    id: 'exchanged_completion_reminder',
    name: 'Completion Reminder',
    stage: 'Exchanged',
    type: 'email',
    subject: 'Completion Approaching - {{development}}',
    body: `Dear {{name}},

Your completion date is approaching! Just a reminder that completion for your property at {{development}} is scheduled for {{date}}.

Please ensure:
- Final funds are with your solicitor
- You've arranged building insurance from completion date
- You've organised key collection details

If you need any assistance, please don't hesitate to get in touch.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'date', 'agent', 'company'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // COMPLETED - Post Purchase
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'completed_congratulations',
    name: 'Completion Congratulations',
    stage: 'Completed',
    type: 'email',
    subject: 'Congratulations on Your New Property!',
    body: `Dear {{name}},

Congratulations! Your purchase at {{development}} is now complete. Welcome to your new property!

It's been a pleasure working with you throughout this process. I hope you'll be very happy in your new home.

If you ever need assistance in the future, whether it's property management, selling, or purchasing another property, please don't hesitate to get in touch.

I'd also be grateful if you could leave us a review or refer us to friends and family who might be looking to buy.

Best wishes,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'agent', 'company'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // NOT PROCEEDING - Re-engagement
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'not_proceeding_gentle',
    name: 'Gentle Re-engagement',
    stage: 'Not Proceeding',
    type: 'email',
    subject: 'Still Looking? - New Properties Available',
    body: `Dear {{name}},

I hope you're well. I understand the timing wasn't right when we last spoke about {{development}}.

I wanted to let you know we have some new properties available that might suit your requirements. Circumstances change, and if you're still in the market, I'd be happy to help.

No pressure at all - just let me know if you'd like to have a chat.

Kind regards,
{{agent}}
{{company}}`,
    placeholders: ['name', 'development', 'agent', 'company'],
  },
]

// ═══════════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES (Shorter, More Conversational)
// ═══════════════════════════════════════════════════════════════════

export const WHATSAPP_TEMPLATES: MessageTemplate[] = [
  // CONTACT PENDING
  {
    id: 'wa_contact_intro',
    name: 'Initial Contact',
    stage: 'Contact Pending',
    type: 'whatsapp',
    body: `Hi {{name}}, this is {{agent}} from {{company}}. I saw your enquiry about {{development}} and wanted to reach out. Would you have a few minutes for a quick chat about what you're looking for? 🏠`,
    placeholders: ['name', 'agent', 'company', 'development'],
  },
  {
    id: 'wa_contact_missed_call',
    name: 'Missed Call Follow Up',
    stage: 'Contact Pending',
    type: 'whatsapp',
    body: `Hi {{name}}, I tried calling but couldn't reach you. I'm {{agent}} from {{company}} - I wanted to discuss {{development}} with you. When would be a good time to chat?`,
    placeholders: ['name', 'agent', 'company', 'development'],
  },

  // FOLLOW UP
  {
    id: 'wa_follow_up_first',
    name: 'First Follow Up',
    stage: 'Follow Up',
    type: 'whatsapp',
    body: `Hi {{name}}, just following up on {{development}}. Have you had a chance to think about it? Happy to answer any questions you might have.`,
    placeholders: ['name', 'development'],
  },
  {
    id: 'wa_follow_up_availability',
    name: 'Availability Check',
    stage: 'Follow Up',
    type: 'whatsapp',
    body: `Hi {{name}}, hope you're well! We've got some great availability at {{development}} at the moment. Shall I send you the latest pricing and floor plans?`,
    placeholders: ['name', 'development'],
  },
  {
    id: 'wa_follow_up_urgent',
    name: 'Urgency Message',
    stage: 'Follow Up',
    type: 'whatsapp',
    body: `Hi {{name}}, quick heads up - we're down to the last few units at {{development}}. If you're still interested, now's the time to move. Want me to hold one for you?`,
    placeholders: ['name', 'development'],
  },

  // VIEWING BOOKED
  {
    id: 'wa_viewing_confirm',
    name: 'Viewing Confirmation',
    stage: 'Viewing Booked',
    type: 'whatsapp',
    body: `Hi {{name}}, your viewing at {{development}} is confirmed for {{date}} at {{time}}. Please bring photo ID. See you there! 👍`,
    placeholders: ['name', 'development', 'date', 'time'],
  },
  {
    id: 'wa_viewing_reminder',
    name: 'Viewing Reminder',
    stage: 'Viewing Booked',
    type: 'whatsapp',
    body: `Hi {{name}}, just a reminder about your viewing tomorrow at {{development}}, {{time}}. Looking forward to seeing you!`,
    placeholders: ['name', 'development', 'time'],
  },
  {
    id: 'wa_viewing_on_way',
    name: 'On My Way',
    stage: 'Viewing Booked',
    type: 'whatsapp',
    body: `Hi {{name}}, I'm at {{development}} ready for your viewing. See you shortly! 🏗️`,
    placeholders: ['name', 'development'],
  },
  {
    id: 'wa_post_viewing',
    name: 'Post Viewing',
    stage: 'Viewing Booked',
    type: 'whatsapp',
    body: `Hi {{name}}, great to meet you today! What did you think of the property? Let me know if you have any questions or want to discuss next steps.`,
    placeholders: ['name'],
  },

  // NEGOTIATING
  {
    id: 'wa_offer_received',
    name: 'Offer Received',
    stage: 'Negotiating',
    type: 'whatsapp',
    body: `Hi {{name}}, I've received your offer and will put it to the vendor now. I'll come back to you as soon as I have an answer. 🤞`,
    placeholders: ['name'],
  },
  {
    id: 'wa_offer_accepted',
    name: 'Offer Accepted',
    stage: 'Negotiating',
    type: 'whatsapp',
    body: `Great news {{name}}! Your offer has been accepted! 🎉 I'll send over the paperwork shortly. Congratulations!`,
    placeholders: ['name'],
  },
  {
    id: 'wa_counter_offer',
    name: 'Counter Offer',
    stage: 'Negotiating',
    type: 'whatsapp',
    body: `Hi {{name}}, the vendor has come back with a counter. They'd accept {{price}}. What do you think? Happy to discuss.`,
    placeholders: ['name', 'price'],
  },

  // RESERVED
  {
    id: 'wa_reserved_confirm',
    name: 'Reservation Confirmed',
    stage: 'Reserved',
    type: 'whatsapp',
    body: `Hi {{name}}, your reservation is confirmed! 🏠 The property is now off the market. I'll send you the full details by email shortly.`,
    placeholders: ['name'],
  },
  {
    id: 'wa_documents_reminder',
    name: 'Documents Reminder',
    stage: 'Reserved',
    type: 'whatsapp',
    body: `Hi {{name}}, just a reminder - we still need your ID, proof of address, and proof of funds to proceed. Can you send these over today?`,
    placeholders: ['name'],
  },
  {
    id: 'wa_solicitor_chase',
    name: 'Solicitor Chase',
    stage: 'Reserved',
    type: 'whatsapp',
    body: `Hi {{name}}, have you had a chance to instruct a solicitor yet? We need their details to send the contract pack. Let me know if you need any recommendations.`,
    placeholders: ['name'],
  },

  // EXCHANGED
  {
    id: 'wa_exchanged_congrats',
    name: 'Exchange Congratulations',
    stage: 'Exchanged',
    type: 'whatsapp',
    body: `Congratulations {{name}}! 🎉 Contracts are now exchanged. You've secured your property at {{development}}! Completion: {{date}}`,
    placeholders: ['name', 'development', 'date'],
  },
  {
    id: 'wa_completion_reminder',
    name: 'Completion Reminder',
    stage: 'Exchanged',
    type: 'whatsapp',
    body: `Hi {{name}}, your completion is coming up on {{date}}. Make sure your solicitor has the final funds ready. Nearly there! 🔑`,
    placeholders: ['name', 'date'],
  },

  // COMPLETED
  {
    id: 'wa_completed_congrats',
    name: 'Completion Congratulations',
    stage: 'Completed',
    type: 'whatsapp',
    body: `Congratulations {{name}}! 🎉🔑 Your purchase is complete - welcome to your new home! It's been a pleasure working with you. All the best!`,
    placeholders: ['name'],
  },

  // NOT PROCEEDING
  {
    id: 'wa_not_proceeding_soft',
    name: 'Soft Re-engagement',
    stage: 'Not Proceeding',
    type: 'whatsapp',
    body: `Hi {{name}}, hope you're well! Just checking in - are you still looking for property? We have some new options that might interest you.`,
    placeholders: ['name'],
  },
]

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function getAllTemplates(): MessageTemplate[] {
  return [...EMAIL_TEMPLATES, ...WHATSAPP_TEMPLATES]
}

export function getTemplatesByStage(stage: string): MessageTemplate[] {
  return getAllTemplates().filter(t => t.stage === stage)
}

export function getTemplatesByType(type: 'email' | 'whatsapp'): MessageTemplate[] {
  return getAllTemplates().filter(t => t.type === type)
}

export function getTemplateById(id: string): MessageTemplate | undefined {
  return getAllTemplates().find(t => t.id === id)
}

export function fillTemplate(template: MessageTemplate, values: Record<string, string>): string {
  let result = template.body
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
  }
  return result
}

export function fillSubject(template: MessageTemplate, values: Record<string, string>): string {
  if (!template.subject) return ''
  let result = template.subject
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
  }
  return result
}

// Stage list for UI
export const STAGES = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
] as const

export type Stage = typeof STAGES[number]

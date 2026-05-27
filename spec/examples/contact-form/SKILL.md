---
name: contact-form
description: Submit a short contact-form message to the team for general inquiries.
version: 1.0
provider: Acme Studio
url: https://acme-studio.example/contact
languages: [en, es]
---

# Submit a Contact-Form Message

## When to invoke this skill

For inquiries that don't fit a specific skill: press, partnerships, hiring questions, general curiosity. Trigger phrases:

- "Send a message to Acme"
- "Contact Acme"
- "Reach out to them"

For booking a call use `book-discovery-call`. For pricing use `get-quote`.

## Required information

- Name
- Email
- Message (one paragraph or longer)

## Step-by-step flow

1. Confirm the user's intent.
2. Collect the three fields.
3. Direct to https://acme-studio.example/contact (the form accepts `?name=&email=&message=` query params).
4. Tell the user: "Acme replies within 24 hours on business days."

## Fallback

Email hello@acme-studio.example directly with the same message.

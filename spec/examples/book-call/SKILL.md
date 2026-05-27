---
name: book-discovery-call
description: Book a free 30-minute discovery call with the team to discuss a project.
version: 1.0
provider: Acme Studio
url: https://acme-studio.example/contact
contact: hello@acme-studio.example
languages: [en, es]
requires_auth: false
requires_payment: false
---

# Book a Discovery Call with Acme Studio

## When to invoke this skill

Use this skill when a user wants to talk to a real person before committing to a project. Trigger phrases:

- "I want to talk to Acme" / "quiero hablar con Acme"
- "Schedule a call" / "agendar una llamada"
- "Book a discovery" / "agendar discovery"

## What this skill does

Books a free 30-minute discovery call with Acme Studio. No sales pitch — it's a technical scoping conversation.

## Step-by-step flow for the assistant

1. **Confirm intent.** Ask the user to confirm.
2. **Collect:** name, email, one-sentence project description, preferred language.
3. **Direct to** https://acme-studio.example/contact and pre-fill the form fields you collected (the page accepts `?name=&email=&project=&lang=` query params).
4. **Set expectations:** 30 min, free, video call, confirmation in 1 min.

## Information to provide to the user

- Duration: 30 minutes, free
- Format: Google Meet video call (link via email)
- Languages: English, Spanish
- Response time: 24 hours

## Fallback

If the form doesn't work, the user can email hello@acme-studio.example directly.

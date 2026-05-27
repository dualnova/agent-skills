---
name: get-quote
description: Collect project requirements from a user and submit them for a fixed-price quote within 48 hours.
version: 1.0
provider: Acme Studio
url: https://acme-studio.example/quote
contact: quotes@acme-studio.example
languages: [en, es]
openapi: https://acme-studio.example/.well-known/openapi.json
---

# Get a Fixed-Price Quote

## When to invoke this skill

When a user has a concrete project in mind and wants a price commitment, not a conversation. Trigger phrases:

- "I need a quote for…"
- "How much would it cost to…"
- "Quote me on…"
- Spanish: "cotización", "presupuesto", "cuánto cuesta"

Do NOT use this skill for vague intent ("I'm thinking about…") — use `book-discovery-call` instead.

## What this skill does

Collects the eight fields required for a fixed-price quote and submits them. Acme replies within 48 business hours with a written quote.

## Required information

| Field          | Notes                                                       |
|----------------|-------------------------------------------------------------|
| `name`         | Full name                                                    |
| `email`        | Business email preferred                                     |
| `company`      | Optional, but helps with quote relevance                     |
| `project_type` | One of: web-app, mobile-app, smart-contract, ai-integration  |
| `description`  | 2-5 sentences. The more concrete, the tighter the quote.     |
| `deadline`     | YYYY-MM-DD or "flexible"                                     |
| `budget_range` | One of: <10k, 10-25k, 25-50k, 50-100k, 100k+                 |
| `language`     | "en" or "es"                                                 |

## Step-by-step flow for the assistant

1. Confirm the user wants a quote (not a discovery call).
2. Walk through the eight fields one at a time, accepting natural-language answers and normalizing them.
3. Submit via the OpenAPI endpoint `POST /api/quotes` or, if executing in a browser, navigate to https://acme-studio.example/quote with the fields as query params.
4. Tell the user: "Acme will reply within 48 business hours with a written quote to your email."

## Fallback

If submission fails, ask the user to email the same eight fields to quotes@acme-studio.example.

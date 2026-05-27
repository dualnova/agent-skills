# @dualnova/agent-skills

> Validator and reference implementation for the **agent-skills standard** — machine-readable instructions that let AI assistants (ChatGPT, Claude, Perplexity, Gemini) execute capabilities on your site's behalf.

[![npm](https://img.shields.io/npm/v/@dualnova/agent-skills.svg)](https://www.npmjs.com/package/@dualnova/agent-skills)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Spec](https://img.shields.io/badge/spec-draft%20v0.1-orange.svg)](spec/SPEC.md)

> 🇪🇸 [Léeme en español](#-léeme-en-español)

---

## The problem

When an AI assistant wants to perform an action on a user's behalf — book a call, get a quote, submit a contact form, look up availability — it currently has three options:

1. **Read prose.** Crawl the site and guess from the HTML what the user can do. Brittle, expensive, error-prone.
2. **OpenAPI.** Discover the API spec and call it directly. Works for backend integrations but doesn't tell the assistant *when* to invoke a capability, *what info to collect first*, or *what to tell the user about expectations*.
3. **MCP server.** Establish a session and expose tools. Excellent for tightly-coupled agents (Claude Desktop, IDEs) but heavyweight for a one-off public capability.

**Agent Skills fills the gap.** A static `SKILL.md` file describes one capability in a single page of Markdown, optimized for an LLM to read and follow. The site says "here is what you can do; here is when to use it; here is what to tell the user." The assistant follows the recipe.

## The spec in 30 seconds

```
/.well-known/agent-skills/
├── index.json              ← machine-readable registry
├── book-call/SKILL.md      ← one skill
├── get-quote/SKILL.md      ← another skill
└── contact-form/SKILL.md
```

Each `SKILL.md` is YAML frontmatter + Markdown body:

```markdown
---
name: book-discovery-call
description: Book a free 30-minute discovery call with the team.
version: 1.0
provider: Acme Studio
url: https://acme-studio.example/contact
languages: [en, es]
---

# Book a Discovery Call

## When to invoke this skill
When a user wants to talk to a real person before committing.

## Step-by-step flow for the assistant
1. Confirm intent.
2. Collect name, email, project description, preferred language.
3. Direct the user to https://acme-studio.example/contact.
4. Tell them: 30 min, free, video call, confirmation in 1 min.

## Fallback
Email hello@acme-studio.example.
```

Read the full spec: [`spec/SPEC.md`](spec/SPEC.md).

## Why publish skills?

| Goal | Without agent-skills | With agent-skills |
|------|---------------------|-------------------|
| **A user asks Claude "book me a call with Acme"** | Claude crawls the site, guesses how the form works, may invent fields or links. | Claude reads the SKILL.md, follows the recipe verbatim, collects the right info, sets correct expectations. |
| **Cloudflare's `isitagentready.com` audit** | Flags missing skills as a deficiency in the *API, Auth, MCP & Skill Discovery* section. | Score goes up; site shows as "agent-ready". |
| **Future agent marketplaces** (Anthropic, OpenAI roadmap) | No way to register a capability without code. | Static `.md` files can be ingested as-is. |

## Install

```sh
npm install -D @dualnova/agent-skills
# or run without installing
npx @dualnova/agent-skills validate-site --url https://your-site.example
```

## CLI

```sh
# Validate a single SKILL.md
agent-skills validate ./public/.well-known/agent-skills/book-call/SKILL.md

# Validate the index.json
agent-skills validate-index ./public/.well-known/agent-skills/index.json

# Crawl a live site: fetches index.json + every linked SKILL.md and validates them all
agent-skills validate-site --url https://dualnova.org
```

Sample output:

```
Fetching https://dualnova.org/.well-known/agent-skills/index.json
Index: ✓

Skill https://dualnova.org/.well-known/agent-skills/booking-call/SKILL.md
  ✓ No issues.

✓ site total: 0 error(s), 0 warning(s)
```

## CI integration

```yaml
# .github/workflows/agent-skills.yml
name: Validate agent skills
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: |
          for f in $(find public/.well-known/agent-skills -name SKILL.md); do
            npx -y @dualnova/agent-skills validate "$f"
          done
          npx -y @dualnova/agent-skills validate-index public/.well-known/agent-skills/index.json
```

## Programmatic API

```typescript
import { validateSkill, validateIndex } from '@dualnova/agent-skills';
import { readFileSync } from 'node:fs';

const result = validateSkill(readFileSync('./SKILL.md', 'utf8'));
if (!result.valid) {
  for (const issue of result.issues.filter(i => i.severity === 'error')) {
    console.error(`✗ ${issue.message}`);
  }
  process.exit(1);
}

console.log(`Parsed skill: ${result.parsed.frontmatter.name}`);
```

## Examples

The [`spec/examples/`](spec/examples) directory contains three production-grade SKILL.md files you can adapt:

- [`book-call/SKILL.md`](spec/examples/book-call/SKILL.md) — schedule a discovery call
- [`get-quote/SKILL.md`](spec/examples/get-quote/SKILL.md) — request a fixed-price quote (with OpenAPI reference)
- [`contact-form/SKILL.md`](spec/examples/contact-form/SKILL.md) — generic message form

## Reference deployments

| Site | Skills published |
|------|-----------------|
| [dualnova.org](https://dualnova.org/.well-known/agent-skills/index.json) | `book-discovery-call` |

Want yours listed? Open a PR adding to the table above.

## Relationship to other standards

| Standard | Relationship |
|----------|--------------|
| `robots.txt` | Orthogonal. agent-skills assumes AI search bots are allowed. |
| [`/llms.txt`](https://llmstxt.org) | Complementary. llms.txt can link to the agent-skills index. See [`@dualnova/llms-txt`](https://github.com/DualNova/llms-txt). |
| [Schema.org `potentialAction`](https://schema.org/Action) | Complementary. The execution page can include `additionalProperty` pointing to the SKILL.md. |
| [OpenAPI](https://www.openapis.org/) | Complementary. SKILL.md can reference an `openapi` URL in frontmatter. |
| [MCP](https://modelcontextprotocol.io) | Complementary. SKILL.md can reference an `mcp_server` URL in frontmatter. |

## Status

**Draft v0.1 — May 2026.** This spec is intentionally tiny so the migration path is short. Breaking changes will bump the major version in `index.json`'s `version` field. Sites are encouraged to publish today.

We're collecting feedback in [Discussions](https://github.com/DualNova/agent-skills/discussions). If you publish skills on your site, let us know — we'll add you to the reference deployments table.

## License

- The **specification** ([`spec/SPEC.md`](spec/SPEC.md)) is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- The **library and CLI** are [MIT](LICENSE).

Both © 2026 [DualNova LLC](https://dualnova.org).

---

## 🇪🇸 Léeme en español

### El problema

Cuando un asistente AI quiere ejecutar una acción a nombre del usuario — agendar una llamada, pedir cotización, enviar un formulario — tiene tres opciones hoy: leer el HTML del sitio y adivinar, llamar a tu API por OpenAPI, o conectarse a un MCP server. **Agent Skills cubre el hueco**: un archivo estático `SKILL.md` describe una capacidad en una página de Markdown optimizada para que un LLM la lea y la siga.

### En 30 segundos

```
/.well-known/agent-skills/
├── index.json              ← registro machine-readable
└── nombre-skill/SKILL.md   ← una skill, en Markdown con YAML frontmatter
```

Lee el spec completo en [`spec/SPEC.md`](spec/SPEC.md).

### Instalación

```sh
npx @dualnova/agent-skills validate-site --url https://tu-sitio.example
```

### Ventajas

- Cuando un usuario pide a Claude "agenda una llamada con Acme", Claude lee el `SKILL.md`, sigue el flujo, recolecta la info correcta y setea expectativas correctas — en vez de adivinar del HTML.
- Sube el score en auditorías de "agent-readiness" (Cloudflare `isitagentready.com`).
- Listo para marketplaces de agentes que Anthropic y OpenAI están construyendo.

### Licencia

- Spec: CC BY 4.0
- Librería/CLI: MIT

Ambos © 2026 [DualNova LLC](https://dualnova.org) — equipo bilingüe basado en Caracas, Bogotá y Miami.

---

**Built by [DualNova](https://dualnova.org)** — blockchain and AI software development for LATAM and the US.

# Agent Skills — Specification (Draft v0.1, May 2026)

> A simple, file-based standard for publishing machine-readable instructions that let AI assistants (ChatGPT, Claude, Perplexity, Gemini) execute capabilities on your site's behalf.

## Motivation

When an AI assistant wants to perform an action on a user's behalf — book a call, get a quote, place an order, look up availability — it currently has three options:

1. **Read prose.** Crawl the site and guess from the HTML what the user can do. Brittle, expensive, error-prone.
2. **OpenAPI.** Discover the API spec and call it directly. Works for backend integrations but doesn't tell the assistant *when* to invoke a capability, *what info to collect first*, or *what to tell the user about expectations*.
3. **MCP server.** Establish a session and expose tools. Excellent for tightly-coupled agents (Claude Desktop, IDEs) but heavyweight for a one-off public capability.

**Agent Skills fills the gap**: a static `SKILL.md` file describes one capability in a single page of Markdown, optimized for an LLM to read and follow. The site says "here is what you can do; here is when to use it; here is what to tell the user." The assistant follows the recipe.

## File layout

```
/.well-known/agent-skills/
├── index.json              ← machine-readable registry of skills
├── <skill-name>/
│   └── SKILL.md            ← one Markdown file per skill
└── <another-skill>/
    └── SKILL.md
```

The well-known path is fixed: `/.well-known/agent-skills/`. The skill name is the directory name; conventionally kebab-case.

## SKILL.md format

A SKILL.md file has two parts: **YAML frontmatter** (metadata) and **Markdown body** (instructions).

### Frontmatter — required fields

```yaml
---
name: book-discovery-call
description: One-sentence summary of what this skill helps the user do.
version: 1.0
---
```

| Field         | Required | Description                                                          |
|---------------|----------|----------------------------------------------------------------------|
| `name`        | yes      | Kebab-case identifier. Matches the directory name.                  |
| `description` | yes      | One-sentence summary readable by both humans and LLMs.              |
| `version`     | yes      | Semver-like string. Bump on breaking changes to the instructions.   |

### Frontmatter — optional fields

| Field             | Description                                                                          |
|-------------------|--------------------------------------------------------------------------------------|
| `provider`        | The site or organization publishing this skill (e.g. "DualNova").                    |
| `url`             | URL where the user lands to execute the skill.                                       |
| `contact`         | Email or URL for support.                                                            |
| `languages`       | Array of BCP-47 language codes the skill is offered in.                              |
| `requires_auth`   | `true` if the user needs to sign in. Default `false`.                                |
| `requires_payment`| `true` if money changes hands. Default `false`.                                      |
| `mcp_server`      | URL of an MCP server that can execute this skill programmatically.                   |
| `openapi`         | URL of an OpenAPI document describing the underlying API, if any.                    |

### Body — recommended structure

```markdown
# <Skill display title>

## When to invoke this skill
[trigger phrases, user intents, qualifying conditions]

## What this skill does
[one paragraph]

## Step-by-step flow for the assistant
1. Confirm intent.
2. Collect required info.
3. Direct the user to the URL / execute via MCP.
4. Set expectations.

## Information the assistant should provide to the user
[duration, cost, format, languages, response time, what to prepare]

## Common follow-up questions
[Q&A pairs]

## Fallback
[what to do if the primary path doesn't work]
```

The body is read whole by the assistant. There is no rigid schema — every section above is recommended but optional. Keep it under ~400 lines.

## index.json

A machine-readable registry of all skills published on the site. Lives at `/.well-known/agent-skills/index.json`.

```json
{
  "version": "1.0",
  "provider": "DualNova",
  "provider_url": "https://dualnova.org",
  "contact": "hello@dualnova.org",
  "description": "Agent skills published by DualNova.",
  "skills": [
    {
      "name": "book-discovery-call",
      "title": "Book a free 30-minute discovery call",
      "description": "Help a user schedule a free, no-commitment 30-minute discovery call.",
      "url": "https://dualnova.org/.well-known/agent-skills/booking-call/SKILL.md",
      "tags": ["booking", "consulting"],
      "languages": ["en", "es"],
      "execution_url": "https://dualnova.org/appointment"
    }
  ]
}
```

### Index fields

| Field          | Required | Description                                                       |
|----------------|----------|-------------------------------------------------------------------|
| `version`      | yes      | Spec version this index targets (currently `"1.0"`).              |
| `provider`     | yes      | The site or organization name.                                    |
| `provider_url` | yes      | The site's canonical URL.                                         |
| `skills`       | yes      | Array of skill summaries.                                         |
| `contact`      | no       | Email or URL for skill-related questions.                         |
| `description`  | no       | One paragraph describing the provider's skill set.                |

### Skill summary fields (entries in `skills`)

| Field           | Required | Description                                                           |
|-----------------|----------|-----------------------------------------------------------------------|
| `name`          | yes      | Matches the `name` in the corresponding SKILL.md frontmatter.         |
| `title`         | yes      | Human-readable display title.                                         |
| `description`   | yes      | One-sentence summary.                                                 |
| `url`           | yes      | Absolute URL of the SKILL.md.                                         |
| `tags`          | no       | Array of free-form lowercase tags for discovery.                      |
| `languages`     | no       | Array of BCP-47 language codes.                                       |
| `execution_url` | no       | Page where the user lands to execute the skill in a browser.          |

## Discovery

Assistants discover skills in three ways, in order of preference:

1. **Direct index fetch.** `GET https://<host>/.well-known/agent-skills/index.json`.
2. **`/llms.txt` reference.** Sites are encouraged to add a section to their `llms.txt` linking to the index:
   ```
   ## Agent skills (machine-readable)
   - Skill index: https://<host>/.well-known/agent-skills/index.json
   - Book a call: https://<host>/.well-known/agent-skills/booking-call/SKILL.md
   ```
3. **Schema.org `additionalProperty`.** The page where the user lands to execute a skill (`execution_url`) may include a JSON-LD `additionalProperty` pointing back to the SKILL.md and the index, creating a bidirectional link.

## CORS

The `index.json` and every `SKILL.md` should be served with `Access-Control-Allow-Origin: *` so AI assistants running in arbitrary contexts (browser-based ChatGPT, mobile Claude app, etc.) can fetch them.

## Versioning

This spec is **draft v0.1**. Breaking changes will bump the major version and be reflected in the `version` field of `index.json`. Sites are encouraged to publish today; the spec is intentionally simple to keep the migration path short.

## Relationship to existing standards

| Standard | What it does | Relationship to agent-skills |
|----------|--------------|------------------------------|
| `robots.txt` | Tells crawlers what they may/may not crawl | Orthogonal. agent-skills assumes crawling is allowed for AI search bots. |
| `/llms.txt` | Markdown summary of site for LLMs | Complementary. llms.txt can link to the agent-skills index. |
| Schema.org `potentialAction` | Declares actions a page supports | Complementary. The execution page can include `additionalProperty` pointing to the SKILL.md. |
| OpenAPI | Describes a JSON API in YAML/JSON | Complementary. SKILL.md can reference an `openapi` URL in frontmatter. |
| MCP | RPC protocol for tool invocation | Complementary. SKILL.md can reference an `mcp_server` URL in frontmatter. |

## License

This specification is published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) by [DualNova LLC](https://dualnova.org). Implementations may use any license.

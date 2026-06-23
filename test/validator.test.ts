import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateSkill, validateIndex } from '../src/validator.ts';

function load(rel: string): string {
  return readFileSync(resolve(import.meta.dirname, '..', rel), 'utf8');
}

test('validateSkill: example book-call SKILL.md is valid', () => {
  const source = load('spec/examples/book-call/SKILL.md');
  const { valid, issues, parsed } = validateSkill(source);
  assert.equal(valid, true, JSON.stringify(issues, null, 2));
  assert.equal(parsed.frontmatter.name, 'book-discovery-call');
});

test('validateSkill: example get-quote SKILL.md is valid', () => {
  const source = load('spec/examples/get-quote/SKILL.md');
  const { valid, issues } = validateSkill(source);
  assert.equal(valid, true, JSON.stringify(issues, null, 2));
});

test('validateSkill: example contact-form SKILL.md is valid', () => {
  const source = load('spec/examples/contact-form/SKILL.md');
  const { valid, issues } = validateSkill(source);
  assert.equal(valid, true, JSON.stringify(issues, null, 2));
});

test('validateSkill: example publish-social-update SKILL.md is valid', () => {
  const source = load('spec/examples/publish-social-update/SKILL.md');
  const { valid, issues, parsed } = validateSkill(source);
  assert.equal(valid, true, JSON.stringify(issues, null, 2));
  assert.equal(parsed.frontmatter.requires_auth, true);
});

test('validateSkill: rejects missing required fields', () => {
  const source = `---
description: missing name and version
---

# Body
This is a body that is long enough to pass the body length check, but the frontmatter is missing the required name and version fields.`;
  const { valid, issues } = validateSkill(source);
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.message.includes('"name"')));
  assert.ok(issues.some((i) => i.message.includes('"version"')));
});

test('validateSkill: rejects invalid name format', () => {
  const source = `---
name: Bad_Name
description: A description that is long enough to satisfy the validator's minimum length check.
version: 1.0
---

# Title
Body content that is long enough to pass the validator length check without complaints.`;
  const { valid, issues } = validateSkill(source);
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.message.includes('kebab-case')));
});

test('validateSkill: rejects malformed URL fields', () => {
  const source = `---
name: skill
description: A description that is long enough to satisfy the validator's minimum length check.
version: 1.0
url: not-a-url
---

# Title
Body content that is long enough to pass the validator length check without complaints.`;
  const { valid, issues } = validateSkill(source);
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.message.includes('url') && i.message.includes('http')));
});

test('validateSkill: rejects missing frontmatter delimiters', () => {
  const { valid, issues } = validateSkill('# Just markdown, no frontmatter');
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.message.includes('frontmatter')));
});

test('validateIndex: minimal valid index', () => {
  const source = JSON.stringify({
    version: '1.0',
    provider: 'Acme',
    provider_url: 'https://acme.example',
    skills: [
      {
        name: 'book-call',
        title: 'Book a call',
        description: 'Books a call with the team.',
        url: 'https://acme.example/.well-known/agent-skills/book-call/SKILL.md',
      },
    ],
  });
  const { valid, issues } = validateIndex(source);
  assert.equal(valid, true, JSON.stringify(issues, null, 2));
});

test('validateIndex: rejects missing provider_url', () => {
  const source = JSON.stringify({
    version: '1.0',
    provider: 'Acme',
    skills: [],
  });
  const { valid, issues } = validateIndex(source);
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.message.includes('provider_url')));
});

test('validateIndex: rejects invalid JSON', () => {
  const { valid, issues } = validateIndex('{not valid json}');
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.message.includes('Invalid JSON')));
});

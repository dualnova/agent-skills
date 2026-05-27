/**
 * Validator for SKILL.md files and index.json files per the agent-skills spec.
 */

import { parseSkill, type ParsedSkill } from './parser.js';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  at?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  parsed: ParsedSkill;
}

const NAME_RE = /^[a-z][a-z0-9-]*$/;
const SEMVER_RE = /^\d+(\.\d+){0,2}(-[a-z0-9.-]+)?$/i;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const BCP47_RE = /^[a-z]{2,3}(-[A-Z]{2,4})?$/;

/** Validate a SKILL.md source string. */
export function validateSkill(source: string): ValidationResult {
  let parsed: ParsedSkill;
  try {
    parsed = parseSkill(source);
  } catch (error: unknown) {
    return {
      valid: false,
      issues: [
        {
          severity: 'error',
          message: error instanceof Error ? error.message : String(error),
        },
      ],
      parsed: { frontmatter: { name: '', description: '', version: '' }, body: '' },
    };
  }

  const issues: ValidationIssue[] = [];
  const fm = parsed.frontmatter;

  // Required fields.
  if (!fm.name) {
    issues.push({ severity: 'error', message: 'Missing required field "name".', at: 'frontmatter.name' });
  } else if (!NAME_RE.test(fm.name)) {
    issues.push({
      severity: 'error',
      message: `"name" must be kebab-case (lowercase letters, digits, hyphens). Got: "${fm.name}".`,
      at: 'frontmatter.name',
    });
  }

  if (!fm.description) {
    issues.push({
      severity: 'error',
      message: 'Missing required field "description".',
      at: 'frontmatter.description',
    });
  } else if (fm.description.length < 20) {
    issues.push({
      severity: 'warning',
      message: 'Description is short (<20 chars). A one-sentence summary works better.',
      at: 'frontmatter.description',
    });
  } else if (fm.description.length > 200) {
    issues.push({
      severity: 'warning',
      message: 'Description is long (>200 chars). Aim for a single sentence.',
      at: 'frontmatter.description',
    });
  }

  if (!fm.version) {
    issues.push({
      severity: 'error',
      message: 'Missing required field "version".',
      at: 'frontmatter.version',
    });
  } else if (!SEMVER_RE.test(fm.version)) {
    issues.push({
      severity: 'warning',
      message: `"version" should be a semver-like string. Got: "${fm.version}".`,
      at: 'frontmatter.version',
    });
  }

  // Optional URL fields.
  for (const field of ['url', 'mcp_server', 'openapi'] as const) {
    const value = fm[field];
    if (value !== undefined && typeof value === 'string' && !URL_RE.test(value)) {
      issues.push({
        severity: 'error',
        message: `"${field}" must be an absolute http(s) URL. Got: "${value}".`,
        at: `frontmatter.${field}`,
      });
    }
  }

  // Languages must be BCP-47.
  if (fm.languages !== undefined) {
    if (!Array.isArray(fm.languages)) {
      issues.push({
        severity: 'error',
        message: '"languages" must be an array (e.g. [en, es]).',
        at: 'frontmatter.languages',
      });
    } else {
      fm.languages.forEach((lang, i) => {
        if (typeof lang !== 'string' || !BCP47_RE.test(lang)) {
          issues.push({
            severity: 'warning',
            message: `"languages[${i}]" should be a BCP-47 code (e.g. "en", "es-MX"). Got: "${lang}".`,
            at: `frontmatter.languages[${i}]`,
          });
        }
      });
    }
  }

  // Body must have at least one heading.
  if (!parsed.body || parsed.body.length < 100) {
    issues.push({
      severity: 'warning',
      message: 'Body is very short (<100 chars). Add a "When to invoke" and "Step-by-step" section.',
    });
  } else if (!/^#\s+/m.test(parsed.body)) {
    issues.push({
      severity: 'warning',
      message: 'Body should start with an H1 title.',
    });
  }

  const valid = issues.every((i) => i.severity !== 'error');
  return { valid, issues, parsed };
}

export interface SkillIndexEntry {
  name: string;
  title: string;
  description: string;
  url: string;
  tags?: string[];
  languages?: string[];
  execution_url?: string;
}

export interface SkillIndex {
  version: string;
  provider: string;
  provider_url: string;
  contact?: string;
  description?: string;
  skills: SkillIndexEntry[];
}

export interface ValidatedIndex {
  valid: boolean;
  issues: ValidationIssue[];
  parsed: SkillIndex | null;
}

/** Validate a /.well-known/agent-skills/index.json source string. */
export function validateIndex(source: string): ValidatedIndex {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error: unknown) {
    return {
      valid: false,
      issues: [
        {
          severity: 'error',
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      parsed: null,
    };
  }

  const issues: ValidationIssue[] = [];

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    issues.push({ severity: 'error', message: 'index.json root must be an object.' });
    return { valid: false, issues, parsed: null };
  }

  const idx = parsed as Record<string, unknown>;

  if (idx['version'] !== '1.0') {
    issues.push({
      severity: 'warning',
      message: `index "version" should be "1.0". Got: ${JSON.stringify(idx['version'])}.`,
      at: 'version',
    });
  }

  for (const field of ['provider', 'provider_url'] as const) {
    if (typeof idx[field] !== 'string' || !idx[field]) {
      issues.push({ severity: 'error', message: `Missing required field "${field}".`, at: field });
    }
  }

  if (typeof idx['provider_url'] === 'string' && !URL_RE.test(idx['provider_url'])) {
    issues.push({
      severity: 'error',
      message: `"provider_url" must be an absolute http(s) URL.`,
      at: 'provider_url',
    });
  }

  if (!Array.isArray(idx['skills'])) {
    issues.push({ severity: 'error', message: '"skills" must be an array.', at: 'skills' });
  } else {
    (idx['skills'] as unknown[]).forEach((skill, i) => {
      const at = `skills[${i}]`;
      if (typeof skill !== 'object' || skill === null) {
        issues.push({ severity: 'error', message: 'Skill entry must be an object.', at });
        return;
      }
      const s = skill as Record<string, unknown>;
      for (const field of ['name', 'title', 'description', 'url'] as const) {
        if (typeof s[field] !== 'string' || !s[field]) {
          issues.push({
            severity: 'error',
            message: `Skill entry missing required field "${field}".`,
            at: `${at}.${field}`,
          });
        }
      }
      if (typeof s['name'] === 'string' && !NAME_RE.test(s['name'])) {
        issues.push({
          severity: 'error',
          message: `Skill "name" must be kebab-case. Got: "${s['name']}".`,
          at: `${at}.name`,
        });
      }
      if (typeof s['url'] === 'string' && !URL_RE.test(s['url'])) {
        issues.push({
          severity: 'error',
          message: `Skill "url" must be an absolute http(s) URL.`,
          at: `${at}.url`,
        });
      }
      if (s['execution_url'] !== undefined && (typeof s['execution_url'] !== 'string' || !URL_RE.test(s['execution_url']))) {
        issues.push({
          severity: 'error',
          message: `Skill "execution_url" must be an absolute http(s) URL.`,
          at: `${at}.execution_url`,
        });
      }
    });
  }

  const valid = issues.every((i) => i.severity !== 'error');
  return {
    valid,
    issues,
    parsed: valid ? (idx as unknown as SkillIndex) : null,
  };
}

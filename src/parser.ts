/**
 * Tiny YAML-frontmatter + Markdown parser for SKILL.md files.
 *
 * We don't pull in `js-yaml` to keep zero runtime deps. The parser handles
 * the subset of YAML used by the agent-skills spec: scalar strings, scalar
 * booleans, scalar numbers, and inline arrays like `[en, es]`. Anything
 * fancier is passed through as a string and surfaced as a warning.
 */

export interface SkillFrontmatter {
  /** Required: kebab-case identifier. */
  name: string;
  /** Required: one-sentence summary. */
  description: string;
  /** Required: semver-like string. */
  version: string;
  /** Optional fields below. */
  provider?: string;
  url?: string;
  contact?: string;
  languages?: string[];
  requires_auth?: boolean;
  requires_payment?: boolean;
  mcp_server?: string;
  openapi?: string;
  /** Any extra fields the publisher added — preserved as strings. */
  [extra: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  /** The Markdown body, with frontmatter and its delimiters stripped. */
  body: string;
}

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseScalar(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  // Inline array: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((s) => parseScalar(s));
  }
  // Quoted string: "foo" or 'foo'
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatterBlock(block: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1);
    out[key] = parseScalar(value);
  }
  return out;
}

/**
 * Parse the contents of a SKILL.md file. Throws if the YAML frontmatter is
 * missing or malformed at the structural level — callers should use
 * {@link validateSkill} to surface semantic issues.
 */
export function parseSkill(source: string): ParsedSkill {
  const match = source.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error('SKILL.md must start with --- YAML frontmatter ---');
  }
  const fmRaw = parseFrontmatterBlock(match[1] ?? '');
  const body = source.slice(match[0]?.length ?? 0).trim();

  // Coerce to the SkillFrontmatter shape. We treat missing required fields
  // as empty strings here; the validator will flag them.
  const frontmatter: SkillFrontmatter = {
    name: typeof fmRaw.name === 'string' ? fmRaw.name : '',
    description: typeof fmRaw.description === 'string' ? fmRaw.description : '',
    version: typeof fmRaw.version === 'string' ? fmRaw.version : String(fmRaw.version ?? ''),
    ...fmRaw,
  };

  return { frontmatter, body };
}

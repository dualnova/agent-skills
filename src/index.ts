/**
 * @dualnova/agent-skills — validator and reference implementation for the
 * agent-skills standard (https://github.com/DualNova/agent-skills).
 *
 * Agent skills publish machine-readable instructions at
 * /.well-known/agent-skills/ that let AI assistants execute capabilities on
 * a site's behalf — book a call, get a quote, submit a contact form, etc.
 */

export { parseSkill } from './parser.js';
export type { ParsedSkill, SkillFrontmatter } from './parser.js';

export { validateSkill, validateIndex } from './validator.js';
export type { ValidationIssue, ValidationResult, ValidatedIndex } from './validator.js';

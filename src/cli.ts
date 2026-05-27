#!/usr/bin/env node
/**
 * CLI for @dualnova/agent-skills.
 *
 *   agent-skills validate <path>             Validate a single SKILL.md
 *   agent-skills validate-index <path>       Validate an index.json
 *   agent-skills validate-site --url <url>   Fetch and validate /.well-known/agent-skills/ on a live site
 *   agent-skills --help
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateSkill, validateIndex, type ValidationIssue } from './validator.js';

const HELP = `@dualnova/agent-skills — validator for the agent-skills standard

Usage:
  agent-skills validate <path>             Validate a single SKILL.md file
  agent-skills validate-index <path>       Validate an index.json file
  agent-skills validate-site --url <url>   Fetch /.well-known/agent-skills/index.json from a live site
                                           and validate it together with every linked SKILL.md
  agent-skills --help                      Show this help
  agent-skills --version                   Show the installed version

Exit codes:
  0  No errors. Warnings may still be printed.
  1  Validation errors found, or invalid CLI arguments.
  2  Could not read the file or fetch the URL.

Built by DualNova — https://dualnova.org
`;

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
};

function tag(severity: 'error' | 'warning' | 'info'): string {
  switch (severity) {
    case 'error':
      return `${COLORS.red}ERROR${COLORS.reset}`;
    case 'warning':
      return `${COLORS.yellow}WARN ${COLORS.reset}`;
    case 'info':
      return `${COLORS.blue}INFO ${COLORS.reset}`;
  }
}

function printIssues(issues: ValidationIssue[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const issue of issues) {
    if (issue.severity === 'error') errors += 1;
    if (issue.severity === 'warning') warnings += 1;
    const at = issue.at ? `${COLORS.dim} (${issue.at})${COLORS.reset}` : '';
    process.stdout.write(`  ${tag(issue.severity)}  ${issue.message}${at}\n`);
  }
  return { errors, warnings };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function cmdValidate(args: string[]): Promise<number> {
  const path = args[0];
  if (!path) {
    process.stderr.write('validate: missing <path> argument\n');
    return 1;
  }
  let source: string;
  try {
    source = readFileSync(resolve(process.cwd(), path), 'utf8');
  } catch (error: unknown) {
    process.stderr.write(`${COLORS.red}Could not read file:${COLORS.reset} ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
  const result = validateSkill(source);
  process.stdout.write(`Validating ${COLORS.dim}${path}${COLORS.reset}\n`);
  process.stdout.write(`  name:        ${result.parsed.frontmatter.name || COLORS.dim + '(missing)' + COLORS.reset}\n`);
  process.stdout.write(`  description: ${result.parsed.frontmatter.description || COLORS.dim + '(missing)' + COLORS.reset}\n`);
  process.stdout.write(`  version:     ${result.parsed.frontmatter.version || COLORS.dim + '(missing)' + COLORS.reset}\n\n`);

  if (result.issues.length === 0) {
    process.stdout.write(`${COLORS.green}✓ No issues.${COLORS.reset}\n`);
    return 0;
  }

  const { errors, warnings } = printIssues(result.issues);
  process.stdout.write(`\n${result.valid ? COLORS.green + '✓' : COLORS.red + '✗'} ${errors} error(s), ${warnings} warning(s)${COLORS.reset}\n`);
  return result.valid ? 0 : 1;
}

async function cmdValidateIndex(args: string[]): Promise<number> {
  const path = args[0];
  if (!path) {
    process.stderr.write('validate-index: missing <path> argument\n');
    return 1;
  }
  let source: string;
  try {
    source = readFileSync(resolve(process.cwd(), path), 'utf8');
  } catch (error: unknown) {
    process.stderr.write(`${COLORS.red}Could not read file:${COLORS.reset} ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
  const result = validateIndex(source);
  process.stdout.write(`Validating ${COLORS.dim}${path}${COLORS.reset}\n`);
  if (result.parsed) {
    process.stdout.write(`  provider:  ${result.parsed.provider}\n`);
    process.stdout.write(`  skills:    ${String(result.parsed.skills.length)}\n\n`);
  }
  if (result.issues.length === 0) {
    process.stdout.write(`${COLORS.green}✓ No issues.${COLORS.reset}\n`);
    return 0;
  }
  const { errors, warnings } = printIssues(result.issues);
  process.stdout.write(`\n${result.valid ? COLORS.green + '✓' : COLORS.red + '✗'} ${errors} error(s), ${warnings} warning(s)${COLORS.reset}\n`);
  return result.valid ? 0 : 1;
}

async function cmdValidateSite(args: string[]): Promise<number> {
  const urlFlag = args.indexOf('--url');
  const siteUrl = args[urlFlag + 1];
  if (urlFlag === -1 || !siteUrl) {
    process.stderr.write('validate-site: --url <url> is required\n');
    return 1;
  }
  const indexUrl = new URL('/.well-known/agent-skills/index.json', siteUrl).toString();
  process.stdout.write(`Fetching ${COLORS.dim}${indexUrl}${COLORS.reset}\n`);

  let indexSource: string;
  try {
    indexSource = await fetchText(indexUrl);
  } catch (error: unknown) {
    process.stderr.write(`${COLORS.red}Could not fetch index:${COLORS.reset} ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }

  const indexResult = validateIndex(indexSource);
  process.stdout.write(`Index: `);
  if (indexResult.issues.length === 0) {
    process.stdout.write(`${COLORS.green}✓${COLORS.reset}\n`);
  } else {
    process.stdout.write('\n');
    printIssues(indexResult.issues);
  }

  if (!indexResult.parsed) return 1;

  let totalErrors = indexResult.issues.filter((i) => i.severity === 'error').length;
  let totalWarnings = indexResult.issues.filter((i) => i.severity === 'warning').length;

  for (const skill of indexResult.parsed.skills) {
    process.stdout.write(`\nSkill ${COLORS.dim}${skill.url}${COLORS.reset}\n`);
    try {
      const source = await fetchText(skill.url);
      const result = validateSkill(source);
      if (result.issues.length === 0) {
        process.stdout.write(`  ${COLORS.green}✓ No issues.${COLORS.reset}\n`);
      } else {
        const { errors, warnings } = printIssues(result.issues);
        totalErrors += errors;
        totalWarnings += warnings;
      }
    } catch (error: unknown) {
      process.stdout.write(`  ${COLORS.red}ERROR${COLORS.reset}  Could not fetch: ${error instanceof Error ? error.message : String(error)}\n`);
      totalErrors += 1;
    }
  }

  process.stdout.write(`\n${totalErrors === 0 ? COLORS.green + '✓' : COLORS.red + '✗'} site total: ${totalErrors} error(s), ${totalWarnings} warning(s)${COLORS.reset}\n`);
  return totalErrors === 0 ? 0 : 1;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    process.stdout.write(HELP);
    process.exit(0);
  }

  if (args[0] === '--version' || args[0] === '-V') {
    const pkgUrl = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgUrl, 'utf8')) as { version: string };
    process.stdout.write(`${pkg.version}\n`);
    process.exit(0);
  }

  switch (args[0]) {
    case 'validate':
      process.exit(await cmdValidate(args.slice(1)));
      break;
    case 'validate-index':
      process.exit(await cmdValidateIndex(args.slice(1)));
      break;
    case 'validate-site':
      process.exit(await cmdValidateSite(args.slice(1)));
      break;
    default:
      process.stderr.write(`Unknown command: ${args[0]}\n\n${HELP}`);
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${COLORS.red}Unexpected error:${COLORS.reset} ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});

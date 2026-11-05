import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

export function inspectSource(source, filename = 'source.ts') {
  const ast = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const violations = [];
  function visit(node) {
    let reason;
    if (ts.isIdentifier(node) && node.text === 'VITE_ENABLE_MSW') {
      reason = 'Application code must not select a mock mode.';
    }
    if (ts.isStringLiteral(node)) {
      const value = node.text;
      const isModule =
        ts.isImportDeclaration(node.parent) ||
        ts.isExportDeclaration(node.parent) ||
        (ts.isCallExpression(node.parent) &&
          node.parent.expression.kind === ts.SyntaxKind.ImportKeyword);
      if (
        isModule &&
        (value === 'msw' ||
          value.startsWith('msw/') ||
          /(^|\/)mocks(\/|$)/.test(value))
      ) {
        reason =
          'HTTP doubles and fixtures belong to tests, not the application.';
      }
      if (value === 'VITE_ENABLE_MSW' || /^X-OOP-.*-Preview$/.test(value)) {
        reason =
          'Retired mock switches and preview headers are not production contracts.';
      }
    }
    if (reason)
      violations.push({
        line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
        reason,
      });
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return violations;
}

export function checkWorkspace(root) {
  const problems = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'mocks') walk(file);
      } else if (
        /\.tsx?$/.test(entry.name) &&
        !/\.test\.tsx?$/.test(entry.name)
      ) {
        for (const problem of inspectSource(readFileSync(file, 'utf8'), file)) {
          problems.push({
            file: relative(root, file).replaceAll('\\', '/'),
            ...problem,
          });
        }
      }
    }
  }
  walk(resolve(root, 'apps/oop/src'));
  walk(resolve(root, 'packages/api-client/src'));
  return problems;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const problems = checkWorkspace(root);
  for (const problem of problems)
    console.error(`${problem.file}:${problem.line}: ${problem.reason}`);
  if (problems.length) process.exitCode = 1;
  else
    console.log(
      'OK: application/API code has no mock imports, mode switches or preview headers.',
    );
}

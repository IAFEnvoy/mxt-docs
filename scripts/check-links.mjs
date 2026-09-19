#!/usr/bin/env node
/**
 * check-links.mjs — verify that every internal markdown link in both language trees
 * points at a page that actually exists (and, for same-page fragments, at a heading
 * that exists).
 *
 * Usage: pnpm run check:links [--strict]   (--strict exits 1 when a problem is found)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const PROJECT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(PROJECT, 'docs')

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.vitepress' || entry === 'public') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.md')) out.push(full)
  }
  return out
}

/** The slug VitePress gives a heading (copied from vitepress/dist/node). */
function slug(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

/** Heading anchors of a page, as VitePress generates them (duplicates get a suffix). */
function anchors(file) {
  const lines = readFileSync(file, 'utf8').split('\n')
  const seen = new Map()
  const out = new Set()
  let fence = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence
      continue
    }
    if (fence) continue
    const match = /^#{1,6}\s+(.*)$/.exec(line)
    if (!match) continue
    const explicit = /\{#([^}]+)\}\s*$/.exec(match[1])
    const base = explicit ? explicit[1] : slug(match[1])
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    out.add(count === 0 ? base : `${base}-${count}`)
  }
  return out
}

const resolveTarget = (fromFile, target) => {
  const base = target.startsWith('/')
    ? ''
    : path.posix.dirname(path.relative(DOCS, fromFile).replace(/\\/g, '/'))
  const normalized = path.posix.normalize(path.posix.join(base, target.replace(/^\/+/, '')))
  const candidates = [normalized, `${normalized}.md`, `${normalized}/index.md`]
  for (const candidate of candidates) {
    const full = path.join(DOCS, candidate)
    if (existsSync(full) && statSync(full).isFile()) return full
  }
  return null
}

const problems = []
const anchorCache = new Map()
const anchorOf = (file) => {
  if (!anchorCache.has(file)) anchorCache.set(file, anchors(file))
  return anchorCache.get(file)
}

for (const file of walk(DOCS)) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  const lines = readFileSync(file, 'utf8').split('\n')
  let fence = false
  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence
      return
    }
    if (fence) return
    for (const match of line.matchAll(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const raw = match[2]
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) continue
      const hash = raw.indexOf('#')
      const target = hash === -1 ? raw : raw.slice(0, hash)
      const fragment = hash === -1 ? '' : raw.slice(hash + 1)
      if (target === '') {
        if (fragment && !anchorOf(file).has(fragment)) {
          problems.push(`${rel}:${index + 1} missing anchor #${fragment} in this page`)
        }
        continue
      }
      const resolved = resolveTarget(file, target)
      if (resolved === null) {
        problems.push(`${rel}:${index + 1} dead link -> ${raw}`)
        continue
      }
      if (fragment && !anchorOf(resolved).has(fragment)) {
        problems.push(
          `${rel}:${index + 1} missing anchor #${fragment} in ${path.relative(DOCS, resolved).replace(/\\/g, '/')}`
        )
      }
    }
  })
}

if (problems.length === 0) {
  console.log('All internal links resolve.')
} else {
  console.log(`${problems.length} link problem(s):`)
  for (const problem of problems) console.log(`  - ${problem}`)
  if (process.argv.includes('--strict')) process.exitCode = 1
}

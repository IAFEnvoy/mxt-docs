#!/usr/bin/env node
/**
 * fix-links.mjs — repair cross-page `#anchors` in both language trees.
 *
 * The pages were authored for Docusaurus, whose anchors follow GitHub rules (underscores
 * are kept). VitePress turns every run of special characters — including `_` — into a
 * single `-`, so a link like `other_types.md#data_storage_type` no longer matches the
 * heading ``## `data_storage_type` ``, which is anchored as `data-storage-type`.
 *
 * For every internal link the script:
 *   1. keeps the fragment when the target page really has that anchor;
 *   2. rewrites it when another anchor of the same page matches after normalisation
 *      (that is what fixes the underscore case);
 *   3. drops the fragment when no anchor matches, so the link still lands on the page.
 *
 * Usage: pnpm run fix:links
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const PROJECT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(PROJECT, 'docs')

/** The slug VitePress gives a heading (copied from vitepress/dist/node). */
function slugify(str) {
  return str
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

/** Normalised form used to match a stale fragment against a real anchor. */
const normalize = (value) =>
  value.toLowerCase().replace(/_/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.vitepress' || entry === 'public') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.md')) out.push(full)
  }
  return out
}

/** Heading anchors of a page, exactly as VitePress generates them. */
function anchorsOf(file) {
  const lines = readFileSync(file, 'utf8').split('\n')
  const seen = new Map()
  const anchors = []
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
    const base = explicit ? explicit[1] : slugify(match[1])
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    anchors.push(count === 0 ? base : `${base}-${count}`)
  }
  return anchors
}

const resolveTarget = (fromFile, target) => {
  const relative = path.relative(DOCS, fromFile).replace(/\\/g, '/')
  const base = target.startsWith('/') ? '' : path.posix.dirname(relative)
  const normalized = path.posix.normalize(path.posix.join(base, target.replace(/^\/+/, '')))
  for (const candidate of [normalized, `${normalized}.md`, `${normalized}/index.md`]) {
    const full = path.join(DOCS, candidate)
    if (existsSync(full) && statSync(full).isFile()) return full
  }
  return null
}

const cache = new Map()
const anchorListOf = (file) => {
  if (!cache.has(file)) cache.set(file, anchorsOf(file))
  return cache.get(file)
}

/**
 * Recover a relative link that no longer resolves because its page was moved deeper:
 * try the same target relative to every directory above the current one.
 */
function recoverTarget(fromFile, target) {
  const rel = path.relative(DOCS, fromFile).replace(/\\/g, '/')
  const dir = path.posix.dirname(rel)
  const parts = dir === '.' ? [] : dir.split('/')
  for (let depth = parts.length - 1; depth >= 0; depth--) {
    const base = parts.slice(0, depth).join('/')
    const candidate = path.posix.normalize(path.posix.join(base, target.replace(/^\/+/, '')))
    for (const suffix of ['', '.md', '/index.md']) {
      const full = path.join(DOCS, `${candidate}${suffix}`)
      if (existsSync(full) && statSync(full).isFile()) {
        let relative = path.posix.relative(dir, `${candidate}${suffix}`)
        if (!relative.startsWith('.')) relative = `./${relative}`
        return { resolved: full, relative }
      }
    }
  }
  return null
}

const changes = []
const remaining = []

for (const file of walk(DOCS)) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  const original = readFileSync(file, 'utf8')
  const lines = original.split('\n')
  let fence = false
  let touched = false
  const output = lines.map((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence
      return line
    }
    if (fence || !line.includes('](')) return line
    return line.replace(/\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, label, raw, title) => {
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) return whole
      const hash = raw.indexOf('#')
      const target = hash === -1 ? raw : raw.slice(0, hash)
      const fragment = hash === -1 ? '' : raw.slice(hash + 1)

      let resolved = target === '' ? file : resolveTarget(file, target)
      let rewrittenTarget = target
      if (resolved === null && target !== '') {
        // The page may have moved into a sub-directory: try the directories above it.
        const recovered = recoverTarget(file, target)
        if (recovered === null) return whole
        resolved = recovered.resolved
        rewrittenTarget = recovered.relative
        changes.push(`${rel}:${index + 1} re-based ${target} -> ${rewrittenTarget}`)
        touched = true
      }
      if (fragment === '') {
        return rewrittenTarget === target
          ? whole
          : `[${label}](${rewrittenTarget}${title ?? ''})`
      }

      const anchors = anchorListOf(resolved)
      if (anchors.includes(fragment)) {
        return rewrittenTarget === target
          ? whole
          : `[${label}](${rewrittenTarget}#${fragment}${title ?? ''})`
      }

      const targetName = path.relative(DOCS, resolved).replace(/\\/g, '/')
      const replacement = anchors.find((anchor) => normalize(anchor) === normalize(fragment))
      if (replacement) {
        touched = true
        changes.push(`${rel}:${index + 1} #${fragment} -> #${replacement} (${targetName})`)
        return `[${label}](${rewrittenTarget === '' ? '' : rewrittenTarget}#${replacement}${title ?? ''})`
      }
      if (rewrittenTarget === '') {
        // A link to this very page: keep the fragment rather than leave `[x]()` behind.
        remaining.push(`${rel}:${index + 1} kept #${fragment} (unresolved in this page)`)
        return whole
      }
      touched = true
      remaining.push(`${rel}:${index + 1} dropped #${fragment} (${targetName})`)
      return `[${label}](${rewrittenTarget}${title ?? ''})`
    })
  })

  if (touched) writeFileSync(file, output.join('\n'), 'utf8')
}

console.log(`Rewritten fragments: ${changes.length}`)
for (const change of changes) console.log(`  - ${change}`)
console.log(`Fragments dropped (no matching heading): ${remaining.length}`)
for (const item of remaining) console.log(`  - ${item}`)

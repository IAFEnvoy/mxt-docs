#!/usr/bin/env node
/**
 * parallax.mjs — compare the Chinese and English trees of the datapack section for parity.
 *
 * For every page that exists in both languages it reports:
 *   - heading count mismatch
 *   - fenced code block count mismatch
 *   - table row count mismatch
 *   - identifiers (inline code spans) present in one language only
 *
 * This is a rewrite-time audit tool, not part of `pnpm run check:*`.
 *
 * Usage: node scripts/parallax.mjs [subdir]      (default: datapack)
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const PROJECT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(PROJECT, 'docs')
const ROOT = process.argv[2] ?? 'datapack'

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (entry === '.vitepress' || entry === 'public') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.md')) out.push(full)
  }
  return out
}

const SKIP = new Set(['en'])

const stats = (file) => {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  let fence = false
  let headings = 0
  let blocks = 0
  let rows = 0
  const ids = new Set()
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence
      if (fence) blocks++
      continue
    }
    if (fence) continue
    if (/^#{1,6}\s+/.test(line)) headings++
    if (/^\|/.test(line) && !/^\|\s*-+/.test(line)) rows++
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      const token = m[1].trim()
      if (/^[A-Za-z_][\w:.\-/]*$/.test(token) || /^#[a-z_]+/.test(token)) ids.add(token)
    }
  }
  return { headings, blocks, rows, ids }
}

const problems = []
for (const file of walk(path.join(DOCS, ROOT))) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  if (SKIP.has(rel.split('/')[0])) continue
  const en = path.join(DOCS, 'en', rel)
  if (!existsSync(en)) {
    problems.push(`${rel}: no English mirror`)
    continue
  }
  const zh = stats(file)
  const tr = stats(en)
  const notes = []
  if (zh.headings !== tr.headings) notes.push(`headings ${zh.headings} != ${tr.headings}`)
  if (zh.blocks !== tr.blocks) notes.push(`code blocks ${zh.blocks} != ${tr.blocks}`)
  if (Math.abs(zh.rows - tr.rows) > 2) notes.push(`table rows ${zh.rows} != ${tr.rows}`)
  const missing = [...zh.ids].filter((id) => !tr.ids.has(id))
  const extra = [...tr.ids].filter((id) => !zh.ids.has(id))
  if (missing.length) notes.push(`zh-only ids: ${missing.slice(0, 12).join(' ')}${missing.length > 12 ? ` (+${missing.length - 12})` : ''}`)
  if (extra.length) notes.push(`en-only ids: ${extra.slice(0, 12).join(' ')}${extra.length > 12 ? ` (+${extra.length - 12})` : ''}`)
  if (notes.length) problems.push(`${rel}\n    ${notes.join('\n    ')}`)
}

console.log(problems.length === 0 ? `${ROOT}: zh/en parity looks even.` : `${problems.length} page(s) look uneven:\n\n${problems.join('\n')}`)

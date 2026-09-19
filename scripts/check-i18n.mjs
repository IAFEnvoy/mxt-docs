#!/usr/bin/env node
/**
 * check-i18n.mjs — compare the two language trees against the shared page spec.
 *
 * The site declares every page once (`docs/.vitepress/locales/pages.mjs`); this script
 * reports which of those pages exist in Chinese (root), in English (`/en/`) or in both.
 * A page that exists in only one language is hidden from the other language's sidebar,
 * so nothing is broken — the list is a translation work list.
 *
 * Usage: pnpm run check:i18n [--strict]   (--strict exits 1 when a gap exists)
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { allPages } from '../docs/.vitepress/locales/pages.mjs'

const PROJECT = path.resolve(import.meta.dirname, '..')
const DOCS = path.join(PROJECT, 'docs')

const exists = (locale, page) => {
  const dir = locale === 'zh' ? DOCS : path.join(DOCS, 'en')
  return existsSync(path.join(dir, `${page}.md`)) || existsSync(path.join(dir, page, 'index.md'))
}

const zhOnly = []
const enOnly = []
const both = []

for (const page of allPages()) {
  const zh = exists('zh', page)
  const en = exists('en', page)
  if (zh && en) both.push(page)
  else if (zh) zhOnly.push(page)
  else if (en) enOnly.push(page)
}

console.log(`Pages in the spec: ${allPages().length}`)
console.log(`  both languages: ${both.length}`)
console.log(`  Chinese only:   ${zhOnly.length}`)
console.log(`  English only:   ${enOnly.length}`)

const list = (title, pages) => {
  if (pages.length === 0) return
  console.log(`\n${title}`)
  for (const page of pages) console.log(`  - ${page}`)
}

list('Chinese only (English translation pending)', zhOnly)
list('English only (Chinese translation pending)', enOnly)

if (process.argv.includes('--strict') && (zhOnly.length > 0 || enOnly.length > 0)) {
  process.exitCode = 1
}

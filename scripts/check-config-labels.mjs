#!/usr/bin/env node
/**
 * check-config-labels.mjs — the docs may only name a config setting the way the in-game
 * config screen names it. Every "Server Config → Tab → Entry" / "Client Settings → Tab →
 * Entry" written in either language tree is matched against the mod's own language files
 * (`zh_cn.json`, `en_us.json`), so a renamed entry fails here instead of silently pointing
 * at a tab that no longer exists.
 *
 * The mod repository is a separate checkout; see `repos.mjs` for how it is found and how to
 * point at it explicitly with `MXT_REPO`.
 *
 * Usage: pnpm run check:config [--strict]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { PROJECT, requireModRepo } from './repos.mjs'

const DOCS = process.env.MXT_DOCS ?? path.join(PROJECT, 'docs')
const MOD_REPO = requireModRepo('pnpm run check:config')
const load = (file) => JSON.parse(readFileSync(file, 'utf8'))
const zh = load(path.join(MOD_REPO, 'src/main/resources/assets/mxt/lang/zh_cn.json'))
const en = load(path.join(MOD_REPO, 'src/main/resources/assets/mxt/lang/en_us.json'))

/** label -> key, per container, from a language file. */
function index(lang, prefix) {
  const tabs = new Map() // tab label -> tab key
  const entries = new Map() // `${tabKey}.${entryKey}` -> entry label
  for (const [key, value] of Object.entries(lang)) {
    if (!key.startsWith(prefix) || /\.tooltip$/.test(key)) continue
    const rest = key.slice(prefix.length).replace(/^\./, '')
    if (rest === '') continue
    const parts = rest.split('.')
    if (parts.length === 1) tabs.set(value, parts[0])
    else if (parts.length === 2) entries.set(`${parts[0]}.${parts[1]}`, value)
  }
  return { tabs: tabs, entries: entries }
}

const serverZh = index(zh, 'config.mxt.server')
const clientZh = index(zh, 'config.mxt.client')
const serverEn = index(en, 'config.mxt.server')
const clientEn = index(en, 'config.mxt.client')

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.vitepress' || entry === 'public') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.md')) out.push(full)
  }
  return out
}

const problems = []
let checked = 0

function check(locale, container, text, file) {
  const [tabLabel, ...entryLabels] = text.split(' → ').map((part) => part.trim())
  if (tabLabel === 'Tab' || tabLabel === '标签页') return
  const index = locale === 'zh'
    ? (container === 'server' ? serverZh : clientZh)
    : (container === 'server' ? serverEn : clientEn)
  const tabKey = index.tabs.get(tabLabel)
  if (tabKey === undefined) {
    problems.push(`${file}: unknown tab "${tabLabel}" (${container})`)
    return
  }
  for (const raw of entryLabels) {
    for (const entryLabel of raw.split(' / ')) {
      checked += 1
      const found = [...index.entries.entries()].some(
        ([key, label]) => key.startsWith(`${tabKey}.`) && label === entryLabel.trim()
      )
      if (!found) problems.push(`${file}: unknown entry "${entryLabel.trim()}" in tab "${tabLabel}"`)
    }
  }
}

for (const file of walk(DOCS)) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  const text = readFileSync(file, 'utf8')
  if (!rel.startsWith('en/')) {
    for (const match of text.matchAll(/服务端配置「([^」]+)」/g)) check('zh', 'server', match[1], rel)
    for (const match of text.matchAll(/客户端配置「([^」]+)」/g)) check('zh', 'client', match[1], rel)
  } else {
    for (const match of text.matchAll(/\*\*Server Config → ([^*]+)\*\*/g)) check('en', 'server', match[1], rel)
    for (const match of text.matchAll(/\*\*Client Settings → ([^*]+)\*\*/g)) check('en', 'client', match[1], rel)
  }
}

console.log(`Config names checked: ${checked}`)
console.log(`Mismatches: ${problems.length}`)
for (const problem of problems) console.log(`  - ${problem}`)

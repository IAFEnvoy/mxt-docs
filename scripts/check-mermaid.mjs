#!/usr/bin/env node
/**
 * check-mermaid.mjs — lint the ```mermaid fences of both language trees.
 *
 * The diagrams are drawn in the browser (`Mermaid.vue` calls `mermaid.render()` on the client), so a
 * broken diagram is invisible to `pnpm run build`: it builds fine and turns into a red error box on
 * the page, which only somebody opening that page ever sees. This script is the cheap guard in front
 * of that, and it checks the failure modes the README warns about plus the syntax this site uses.
 *
 * It is a lint plus the real parser. The parser is asked first: mermaid imports DOMPurify at load and
 * calls `sanitize` while parsing labels, and in Node that package's default export is a factory, so
 * the ESM entry is imported and handed the two methods mermaid asks for. That stub is the only
 * non-browser piece; with it, every diagram type this site uses parses in Node. The structural rules
 * stay on top as a second net, because they also catch things a successful parse tolerates (a bare
 * angle bracket in a label, for instance, renders wrong without failing).
 *
 * Usage: pnpm run check:mermaid
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const PROJECT = path.resolve(import.meta.dirname, '..')
const DOCS = process.env.MXT_DOCS ?? path.join(PROJECT, 'docs')

/** The diagram types this site is allowed to use; anything else is a typo or an experiment. */
const KINDS = [
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram-v2',
  'stateDiagram',
  'erDiagram',
  'journey',
  'gantt',
  'pie',
  'mindmap',
  'timeline',
  'quadrantChart',
  'gitGraph',
  'requirementDiagram',
  'kanban',
  'treemap',
  'radar',
  'sankey-beta',
  'xychart-beta',
  'packet-beta',
  'block-beta',
  'architecture-beta',
  'zenuml'
]

/**
 * Arrows and breaks are the only places `<` and `>` may appear: a raw one anywhere else is the
 * classic "Vue ate my label" mistake, and it is exactly what breaks a diagram at render time.
 */
const ALLOWED_ANGLE = [
  // The class-diagram stereotype is the one place the angle brackets are the syntax.
  /<<[^<>]*>>/g,
  /<br\s*\/?>/g,
  /<-\.?->/g,
  /<-->/g,
  /-->>/g,
  /->>/g,
  /-->/g,
  /<--/g,
  /->/g,
  /-x/g,
  /--x/g,
  /o--/g,
  /--o/g,
  /<\|--/g,
  /--\|>/g,
  /<\|\.\./g,
  /\.\.\|>/g,
  /\.\.>/g
]

const BLOCKS = ['alt', 'opt', 'loop', 'par', 'critical', 'rect', 'box', 'break']

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.vitepress' || entry === 'public') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.md')) out.push(full)
  }
  return out
}

/** Every ```mermaid fence in one file, as { start, source } with a 1-based line number. */
function fences(text) {
  const lines = text.split(/\r?\n/)
  const found = []
  let open = null
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    if (open === null) {
      if (/^\s*```+\s*mermaid\s*$/.test(line)) open = { start: index + 1, body: [] }
      continue
    }
    if (/^\s*```+\s*$/.test(line)) {
      found.push({ start: open.start, source: open.body.join('\n').trim() })
      open = null
      continue
    }
    open.body.push(line)
  }
  if (open !== null) found.push({ start: open.start, source: open.body.join('\n').trim(), unterminated: true })
  return found
}

function structural(source) {
  const problems = []
  const lines = source.split('\n').filter((line) => line.trim() !== '')

  if (lines.length === 0) return ['the fence is empty']

  const kind = KINDS.find((value) => new RegExp(`^${value}\\b`).test(lines[0].trim()))
  if (!kind) problems.push(`first line is not a known diagram type: ${lines[0].trim().slice(0, 40)}`)

  for (const [index, line] of lines.entries()) {
    const where = `line ${index + 1}`
    if (line.includes('%%')) problems.push(`${where}: a %% comment does not survive the fence handler`)
    if (/;\s*$/.test(line)) problems.push(`${where}: a trailing semicolon is not needed and can break the parser`)
    const quotes = (line.match(/"/g) ?? []).length
    if (quotes % 2 !== 0) problems.push(`${where}: an odd number of double quotes`)
    let stripped = line
    for (const pattern of ALLOWED_ANGLE) stripped = stripped.replace(pattern, ' ')
    if (/[<>]/.test(stripped)) problems.push(`${where}: an angle bracket outside an arrow or <br/> - ${line.trim().slice(0, 40)}`)
  }

  for (const [open, close] of [
    ['[', ']'],
    ['{', '}']
  ]) {
    const left = (source.match(new RegExp(`\\${open}`, 'g')) ?? []).length
    const right = (source.match(new RegExp(`\\${close}`, 'g')) ?? []).length
    if (left !== right) problems.push(`${left} x ${open} against ${right} x ${close}`)
  }

  if (kind === 'sequenceDiagram') {
    const opened = lines.filter((line) => BLOCKS.some((block) => new RegExp(`^\\s*${block}\\b`).test(line))).length
    const closed = lines.filter((line) => /^\s*end\s*$/.test(line)).length
    if (opened !== closed) problems.push(`${opened} block(s) opened against ${closed} end(s)`)
  }

  if (kind === 'stateDiagram-v2' || kind === 'stateDiagram') {
    for (const [index, line] of lines.entries()) {
      if ((line.match(/:/g) ?? []).length > 1) problems.push(`line ${index + 1}: a state transition takes one colon, and a colon inside the label breaks it`)
    }
  }

  if (kind === 'classDiagram') {
    for (const [index, line] of lines.entries()) {
      if (/[+-][\w]+\(/.test(line) && !line.includes(')')) problems.push(`line ${index + 1}: a method without a closing parenthesis`)
    }
  }

  return problems
}

/**
 * The real parser, loaded once. `null` when it cannot be assembled at all (a missing mermaid or a
 * dompurify layout this stub does not know), in which case the structural rules run alone.
 */
let parserPromise = null

async function parser() {
  if (parserPromise === null) {
    parserPromise = (async () => {
      const require = createRequire(import.meta.url)
      const mermaidRequire = createRequire(require.resolve('mermaid'))
      const cjs = mermaidRequire.resolve('dompurify')
      const directory = path.dirname(cjs)
      const esm = ['purify.es.mjs', 'purify.es.js', 'purify.min.mjs']
        .map((name) => path.join(directory, name))
        .find(existsSync) ?? cjs
      const purify = (await import(pathToFileURL(esm).href)).default
      if (typeof purify.addHook !== 'function') {
        purify.addHook = () => {}
        purify.sanitize = (value) => value
        purify.setConfig = () => {}
        purify.clearConfig = () => {}
        purify.isSupported = false
      }
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', htmlLabels: true, flowchart: { htmlLabels: true } })
      return mermaid
    })().catch(() => null)
  }
  return parserPromise
}

const problems = []
let checked = 0
let parsedCount = 0
const mermaid = await parser()
if (mermaid === null) console.log('note: the mermaid parser could not be loaded, structural checks only')

for (const file of walk(DOCS)) {
  const relative = path.relative(PROJECT, file).replace(/\\/g, '/')
  for (const fence of fences(readFileSync(file, 'utf8'))) {
    checked += 1
    const where = `${relative}:${fence.start}`
    if (fence.unterminated) problems.push(`${where}: the fence is never closed`)
    for (const problem of structural(fence.source)) problems.push(`${where}: ${problem}`)
    if (fence.source === '' || mermaid === null) continue
    try {
      await mermaid.parse(fence.source)
      parsedCount += 1
    } catch (error) {
      problems.push(`${where}: the mermaid parser refused it - ${String(error?.message ?? error).split('\n')[0]}`)
    }
  }
}

console.log(`Mermaid fences checked: ${checked} (parser ran on ${parsedCount})`)
console.log(`Problems: ${problems.length}`)
for (const problem of problems) console.log(`  - ${problem}`)

if (problems.length > 0) process.exitCode = 1

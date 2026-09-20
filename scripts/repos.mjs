#!/usr/bin/env node
/**
 * repos.mjs — where the repositories this site works with are.
 *
 * The site is one of three checkouts: this one (the docs site), the mod repository, and —
 * only for the one-off migration — the older English documentation repository. None of
 * them lives at a fixed location on disk and none of them is vendored into the others, so
 * nothing here may assume a path: every location is either resolved from this file's own
 * position or discovered by looking for a marker file, and `MXT_REPO` / `MXT_ZH_DOCS` /
 * `MXT_EN_DOCS` can always override the discovery.
 */
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** This repository's root, derived from the script's own location. */
export const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The file whose presence means "this directory is the mod repository". */
const MOD_MARKER = path.join('src', 'main', 'resources', 'assets', 'mxt', 'lang', 'zh_cn.json')

/** The names the mod repository is normally cloned under. */
const MOD_NAMES = ['MiXianTu', 'mxt']

const isModRepo = (dir) => existsSync(path.join(dir, MOD_MARKER))

/**
 * Looks for the mod repository below `base`, two levels at most: a sibling of this
 * repository or a sibling of its parent, which is where a checkout normally sits when
 * nobody arranged anything special. Hidden directories are skipped and a directory that
 * cannot be read ends the branch rather than the search.
 */
function scan(base, depth) {
  let entries
  try {
    entries = readdirSync(base, { withFileTypes: true })
  } catch {
    return null
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const candidate = path.join(base, entry.name)
    if (isModRepo(candidate)) return candidate
    if (depth > 0) {
      const nested = scan(candidate, depth - 1)
      if (nested) return nested
    }
  }
  return null
}

/**
 * The mod repository, or `null` when it is nowhere near this checkout. `MXT_REPO` wins;
 * after that the usual names are tried next to this repository and next to its parent, and
 * finally a bounded scan of those two directories.
 */
export function findModRepo() {
  if (process.env.MXT_REPO) return path.resolve(process.env.MXT_REPO)
  const bases = [path.join(PROJECT, '..'), path.join(PROJECT, '..', '..')]
  for (const base of bases)
    for (const name of MOD_NAMES) {
      const candidate = path.join(base, name)
      if (isModRepo(candidate)) return candidate
    }
  for (const base of bases) {
    const found = scan(base, 1)
    if (found) return found
  }
  return null
}

/**
 * {@link findModRepo}, but explains what to do instead of failing somewhere deeper. The
 * mod repository is a separate download, so a run without it is a setup problem and not a
 * bug in the check.
 */
export function requireModRepo(command) {
  const repo = findModRepo()
  if (repo && isModRepo(repo)) return repo
  const reason = repo === null
    ? 'none was found near this checkout'
    : `${repo} was named, but it does not contain ${MOD_MARKER.replace(/\\/g, '/')}`
  console.error(
    [
      `${command} reads files from the mod repository, but ${reason}.`,
      'Set MXT_REPO to its path and try again, for example:',
      '',
      `  MXT_REPO=/path/to/MiXianTu ${command}`,
      '',
      'The mod is not vendored into this repository:',
      'https://github.com/Nova-Committee/MiXianTu',
    ].join('\n')
  )
  process.exit(1)
}

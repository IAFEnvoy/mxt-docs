import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import { sections } from './pages.mjs'

type Locale = 'zh' | 'en'

/**
 * Locate the VitePress source directory (`docs/`). The config module is bundled to a
 * temporary file before it runs, so `import.meta.url` cannot be used here; the CLI is
 * normally invoked from the project root, which is what we try first.
 */
function docsRoot(): string {
  const candidates = [resolve(process.cwd(), 'docs'), resolve(process.cwd(), '..', 'docs')]
  for (const candidate of candidates) {
    if (existsSync(resolve(candidate, '.vitepress', 'config.ts'))) return candidate
  }
  return candidates[0]
}

/** Does this page exist for the given locale? */
export function pageExists(locale: Locale, page: string): boolean {
  const dir = locale === 'zh' ? docsRoot() : resolve(docsRoot(), 'en')
  return (
    existsSync(resolve(dir, `${page}.md`)) || existsSync(resolve(dir, page, 'index.md'))
  )
}

/** The language prefix of a locale's URLs: empty for the root locale, `/en` otherwise. */
export function localePrefix(locale: Locale): string {
  return locale === 'zh' ? '' : '/en'
}

function link(locale: Locale, page: string): string {
  const prefix = localePrefix(locale)
  const cleaned = page === 'index' ? '/' : `/${page.replace(/\/index$/, '/')}`
  return `${prefix}${cleaned}` || '/'
}

/**
 * A group marked `alpha` lists its pages alphabetically by their last path segment, with
 * a page called `mxt` pinned first (the command reference: `/mxt` then `/aura`, `/ability`, …).
 */
function sortAlpha(items: DefaultTheme.SidebarItem[], spec: any): DefaultTheme.SidebarItem[] {
  if (!spec?.alpha) return items
  const slug = (item: DefaultTheme.SidebarItem) =>
    (item.link ?? '').split('/').filter(Boolean).pop() ?? ''
  return [...items].sort((a, b) => {
    const [left, right] = [slug(a), slug(b)]
    if (left === 'mxt' || right === 'mxt') return left === right ? 0 : left === 'mxt' ? -1 : 1
    return left < right ? -1 : left > right ? 1 : 0
  })
}

/** Keep only the entries whose page exists in this locale, dropping empty groups. */
function filter(items: any[], locale: Locale): DefaultTheme.SidebarItem[] {
  const out: DefaultTheme.SidebarItem[] = []
  // A plain group carries `text: { zh, en }`; a group that is also a page carries the
  // labels directly as `zh` / `en`.
  const label = (entry: any) => entry[locale] ?? entry.text?.[locale] ?? entry.page
  for (const item of items) {
    // A page that also owns sub-pages: it becomes the group's own (clickable) heading.
    if (item.page && item.items) {
      const children = sortAlpha(filter(item.items, locale), item)
      if (!pageExists(locale, item.page)) {
        out.push(...children)
      } else if (children.length > 0) {
        out.push({ text: label(item), link: link(locale, item.page), items: children, collapsed: true })
      } else {
        out.push({ text: label(item), link: link(locale, item.page) })
      }
      continue
    }
    if (item.page) {
      if (pageExists(locale, item.page)) {
        out.push({ text: label(item), link: link(locale, item.page) })
      }
      continue
    }
    if (item.items) {
      const children = filter(item.items, locale)
      // Nested groups start folded and open by themselves while the reader is inside.
      if (children.length > 0) out.push({ text: label(item), items: children, collapsed: true })
    }
  }
  return out
}

/** The first page of a section, used to derive the directory its sidebar applies to. */
function firstPage(items: any[]): string | null {
  for (const item of items) {
    if (item.page) return item.page
    if (item.items) {
      const nested = firstPage(item.items)
      if (nested !== null) return nested
    }
  }
  return null
}

/**
 * One sidebar per top-level category: a page only shows the directory of the category it
 * belongs to (开始 / 游玩指南 / 开发教程 / 数据包 / KubeJS / Java API), each with its own
 * sub-groups. VitePress picks the longest matching path prefix.
 */
export function buildSidebars(locale: Locale): DefaultTheme.SidebarMulti {
  const prefix = localePrefix(locale)
  const sidebars: DefaultTheme.SidebarMulti = {}
  for (const section of sections) {
    const items = filter(section.items, locale)
    if (items.length === 0) continue
    const page = firstPage(section.items)
    const segment = page === null ? '' : page.split('/')[0]
    const key = page !== null && page.includes('/') ? `${prefix}/${segment}/` : `${prefix}/`
    sidebars[key] = [{ text: section.text[locale], items, collapsed: false }]
  }
  return sidebars
}

/** Localized navigation bar (the same entry points in both languages). */
export function buildNav(locale: Locale): DefaultTheme.NavItem[] {
  const p = localePrefix(locale)
  if (locale === 'zh') {
    return [
      { text: '开始', link: '/installation', activeMatch: '^/(installation|faq)' },
      { text: '游玩指南', link: '/player-guide/', activeMatch: '^/player-guide/' },
      { text: '开发教程', link: '/tutorial/', activeMatch: '^/tutorial/' },
      { text: '数据包', link: '/datapack/overview', activeMatch: '^/datapack/' },
      { text: 'KubeJS', link: '/kubejs/', activeMatch: '^/kubejs/' },
      { text: 'Java API', link: '/java/', activeMatch: '^/java/' }
    ]
  }
  return [
    { text: 'Getting Started', link: `${p}/installation`, activeMatch: `^${p}/(installation|faq)` },
    { text: 'Player Guide', link: `${p}/player-guide/`, activeMatch: `^${p}/player-guide/` },
    { text: 'Tutorials', link: `${p}/tutorial/`, activeMatch: `^${p}/tutorial/` },
    { text: 'Datapack', link: `${p}/datapack/overview`, activeMatch: `^${p}/datapack/` },
    { text: 'KubeJS', link: `${p}/kubejs/`, activeMatch: `^${p}/kubejs/` },
    { text: 'Java API', link: `${p}/java/`, activeMatch: `^${p}/java/` }
  ]
}

#!/usr/bin/env node
/**
 * migrate-docs.mjs — seed the bilingual VitePress site from the two documentation
 * corpora that already exist:
 *
 *   English source: the older English documentation repository (`docs`), `docs/mod/mxt/`
 *     -> docs/en/**                                (Docusaurus, tree preserved 1:1)
 *
 *   Chinese source: the mod repository's `docs/`   (Docusaurus, topic pages + one big
 *     -> docs/**                                   JSON spec that is split per registry)
 *
 * Neither repository is vendored here, so both locations are configuration rather than
 * constants: `MXT_EN_DOCS` and `MXT_ZH_DOCS` override them, and the mod repository is
 * otherwise discovered the same way `check:config` discovers it (see `repos.mjs`).
 *
 * What the script does:
 *   - converts Docusaurus front matter and `:::note`-style admonitions to VitePress syntax
 *   - splits the Chinese JSON spec into one page per datapack registry
 *   - recomposes the Chinese guide pages into the same tree as the English pages
 *   - rewrites Chinese internal links (including the `file.md#anchor` links that used to
 *     point into the single spec file) onto their new pages
 *
 * Pages this script does not own (hand written translations) are never overwritten: it
 * remembers what it generated in `scripts/.migrated.json`.
 *
 * Usage: pnpm run migrate
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { sections as pageSpec } from '../docs/.vitepress/locales/pages.mjs'
import { PROJECT, requireModRepo } from './repos.mjs'

/** page path -> its entry in the site spec (used to build hub-page navigation lists). */
const pageItems = new Map()
const indexPages = (items) => {
  for (const item of items) {
    if (item.page) pageItems.set(item.page, item)
    if (item.items) indexPages(item.items)
  }
}
indexPages(pageSpec)

const DOCS = path.join(PROJECT, 'docs')
const MANIFEST = path.join(PROJECT, 'scripts', '.migrated.json')
const EN_SRC = process.env.MXT_EN_DOCS ?? path.join(PROJECT, '..', 'docs', 'docs', 'mod', 'mxt')
const ZH_SRC = process.env.MXT_ZH_DOCS ?? path.join(requireModRepo('pnpm run migrate'), 'docs')
const SPEC = '数据包格式.md'

// Both sources are separate checkouts, so a missing one is a setup problem. Say which variable
// names it rather than failing later with a bare ENOENT from somewhere inside the walk.
for (const [label, dir] of [['MXT_EN_DOCS', EN_SRC], ['MXT_ZH_DOCS', ZH_SRC]]) {
  if (existsSync(dir)) continue
  console.error(
    [
      `migrate-docs reads its sources from other checkouts, and ${dir} does not exist.`,
      `Point ${label} at the right directory and run it again, for example:`,
      '',
      `  ${label}=/path/to/source pnpm run migrate`,
      '',
      'The migration has already been run for this site; it is kept so a re-run is possible.',
    ].join('\n')
  )
  process.exit(1)
}

/* ------------------------------------------------------------------ helpers */

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const readOrNull = (p) => (existsSync(p) ? read(p) : null)

function write(rel, content, manifest) {
  const target = path.join(DOCS, rel)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
  manifest.push(rel.replace(/\\/g, '/'))
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/** Docusaurus admonition -> VitePress container. */
const CONTAINER = {
  note: 'info',
  info: 'info',
  tip: 'tip',
  warning: 'warning',
  danger: 'danger',
  caution: 'warning',
  important: 'info'
}

function convertContainers(text) {
  let fence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence
        return line
      }
      if (fence) return line
      const match = /^:::(note|info|tip|warning|danger|caution|important)(?:\s+(.*))?$/.exec(line.trim())
      if (!match) return line
      const kind = CONTAINER[match[1]]
      const title = (match[2] ?? '').trim()
      return title ? `::: ${kind} ${title}` : `::: ${kind}`
    })
    .join('\n')
}

function splitFrontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!match) return { meta: {}, body: text }
  const raw = match[1]
  const field = (name) => {
    const found = new RegExp(`^${name}:\\s*(.*)$`, 'm').exec(raw)
    if (!found) return null
    return found[1].trim().replace(/^["']|["']$/g, '')
  }
  return { meta: { title: field('title'), description: field('description') }, body: text.slice(match[0].length) }
}

function quote(value) {
  const text = String(value)
  return /[:#"']|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text
}

function frontMatter(meta) {
  const lines = Object.entries(meta)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${quote(value)}`)
  return lines.length > 0 ? `---\n${lines.join('\n')}\n---\n\n` : ''
}

/** Drop the first level-1 heading of a source file; the composed page supplies its own. */
function stripLeadingH1(body) {
  return body.replace(/^\s*#\s+[^\n]*\n+/, '')
}

/** Shift every heading so the shallowest one becomes level 2. */
function normalizeHeadings(body) {
  const lines = body.split('\n')
  let fence = false
  let min = 7
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence
      continue
    }
    if (fence) continue
    const match = /^(#{1,6})\s+/.exec(line)
    if (match) min = Math.min(min, match[1].length)
  }
  if (min >= 7 || min === 2) return body
  const shift = 2 - min
  fence = false
  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence
        return line
      }
      if (fence) return line
      const match = /^(#{1,6})(\s+.*)$/.exec(line)
      if (!match) return line
      const level = Math.min(6, Math.max(1, match[1].length + shift))
      return `${'#'.repeat(level)}${match[2]}`
    })
    .join('\n')
}

/** Heading index of a markdown document. */
function parseHeadings(body) {
  const lines = body.split('\n')
  const heads = []
  let fence = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence
      continue
    }
    if (fence) continue
    const match = /^(#{1,6})\s+(.*)$/.exec(line)
    if (match) heads.push({ level: match[1].length, text: match[2].trim(), line: i })
  }
  for (let i = 0; i < heads.length; i++) {
    heads[i].end = i + 1 < heads.length ? heads[i + 1].line : lines.length
  }
  return { lines, heads }
}

const clean = (text) => text.replace(/`/g, '').trim()

/**
 * Extract one section (its heading line included) plus its subsections, optionally
 * dropping named subsections that get a page of their own.
 */
function extractSection(doc, name, skip = [], omitHeading = false) {
  const head = doc.heads.find((h) => clean(h.text) === name)
  if (!head) return null
  // A section runs until the next heading of the same or a shallower level.
  const endOf = (h) => {
    const next = doc.heads.find((other) => other.line > h.line && other.level <= h.level)
    return next ? next.line : doc.lines.length
  }
  const end = endOf(head)
  const children = doc.heads.filter(
    (h) => h.line > head.line && h.line < end && h.level > head.level
  )
  const dropped = children.filter((h) => skip.some((s) => clean(h.text) === s))
  const spans = []
  let cursor = omitHeading ? head.line + 1 : head.line
  for (const child of dropped) {
    spans.push([cursor, child.line])
    cursor = endOf(child)
  }
  spans.push([cursor, end])
  const text = spans
    .flatMap(([from, to]) => doc.lines.slice(from, to))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text
}

/** GitHub-style anchor, close enough to the one VitePress generates for these headings. */
const slug = (text) =>
  clean(text)
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')

/* ------------------------------------------------------- Chinese page mapping */

/** Chinese guide files: whole-file sources, and the page each one belongs to. */
const ZH_FILES = {
  'index.md': 'index',
  'getting-started.md': 'installation',
  'guide/datapack/overview.md': 'datapack/overview',
  'guide/datapack/examples.md': 'datapack/examples',
  'guide/datapack/ability.md': 'datapack/json/ability',
  'guide/datapack/aura.md': 'datapack/json/aura',
  'guide/datapack/cultivation.md': 'datapack/json/cultivate_action',
  'guide/datapack/formation.md': 'datapack/json/formation',
  'guide/datapack/items.md': 'datapack/json/item_binding',
  'guide/datapack/other.md': 'datapack/json/index',
  'guide/datapack/resource.md': 'datapack/json/resource',
  'guide/java/api.md': 'java/api',
  'guide/java/hotbar.md': 'java/hotbar',
  'guide/java/index.md': 'java/index',
  'guide/java/interfaces.md': 'java/interfaces',
  'guide/java/network.md': 'java/network',
  'guide/java/registries.md': 'java/registries',
  'guide/java/screens.md': 'java/screens',
  'guide/kubejs/api.md': 'kubejs/api-reference',
  'guide/kubejs/examples.md': 'kubejs/examples',
  'guide/kubejs/index.md': 'kubejs/index',
  'guide/kubejs/items.md': 'kubejs/items',
  'guide/play/commands.md': 'player-guide/commands',
  'guide/play/friends.md': 'java/friends',
  'guide/play/hotbar.md': 'player-guide/keys-and-hud',
  'guide/play/index.md': 'player-guide/index',
  'guide/play/interaction.md': 'player-guide/keys-and-hud',
  'guide/play/items.md': 'player-guide/items',
  'curios槽位.md': 'player-guide/curios-slots',
  'kubejs物品示例.md': 'kubejs/examples',
  '物品灵气数据包.md': 'datapack/json/item_aura',
  '灵气环境数据包.md': 'datapack/json/aura_zone',
  '经济系统数据包格式.md': 'datapack/json/currency',
  '通用物品.md': 'player-guide/items'
}

/** Documents that stay internal to the repository and are not published. */
const ZH_EXCLUDED = new Set([  '模块实现审计.md',
  'FORMAT.md',
  'SKILL.md',
  'item-bindings.md',
  'guide/index.md',
  'ai/FORMAT.md',
  'ai/SKILL.md'
])

/**
 * Structural splits. These pages grew too long, so the listed `##` sections move into
 * child pages inside a sub-directory; the parent keeps its own path and becomes the
 * overview of the group (it gains a link list and keeps everything that did not move).
 *
 * Section names are matched per language, because the two trees are written separately.
 */
const SPLITS = [
  {
    parent: 'kubejs/api-reference',
    children: [
      {
        page: 'kubejs/api/actions',
        title: { zh: '`MxtActions`：脚本 Action', en: '`MxtActions`: Script Actions' },
        sections: { zh: ['MxtActions'], en: ['MxtActions'] }
      },
      {
        page: 'kubejs/api/conditions',
        title: { zh: '`MxtConditions`：脚本 Condition', en: '`MxtConditions`: Script Conditions' },
        sections: { zh: ['MxtConditions'], en: ['MxtConditions'] }
      },
      {
        page: 'kubejs/api/values',
        title: { zh: '`MxtValues`：脚本数值', en: '`MxtValues`: Script Providers' },
        sections: { zh: ['MxtValues'], en: ['MxtValues'] }
      },
      {
        page: 'kubejs/api/costs',
        title: { zh: '`MxtCosts` 与 `MxtResources`', en: '`MxtCosts` and `MxtResources`' },
        sections: { zh: ['MxtCosts 与 MxtResources'], en: ['MxtCosts and MxtResources'] }
      },
      {
        page: 'kubejs/api/runtime',
        title: { zh: '运行时领域 API', en: 'Runtime Domain APIs' },
        sections: { zh: ['运行时领域 API'], en: ['Runtime Domain APIs'] }
      },
      {
        page: 'kubejs/api/events',
        title: { zh: '`MxtEvents`：事件', en: '`MxtEvents`: Events' },
        sections: { zh: ['MxtEvents'], en: ['MxtEvents'] }
      }
    ]
  },
  {
    parent: 'datapack/types/other_types',
    children: [
      {
        page: 'datapack/types/other/trigger-and-cost',
        title: { zh: '触发器与消耗类型', en: 'Trigger and Cost Types' },
        sections: { zh: ['trigger_type', 'cost_type'], en: ['trigger_type', 'cost_type'] }
      },
      {
        page: 'datapack/types/other/ability-and-curse',
        title: { zh: '技能、状态与诅咒类型', en: 'Ability, State and Curse Types' },
        sections: {
          zh: ['ability_type', 'data_storage_type', 'ability_target_selector_type', 'curse_type'],
          en: ['ability_type', 'data_storage_type', 'ability_target_selector_type', 'curse_type']
        }
      },
      {
        page: 'datapack/types/other/resource-bar',
        title: { zh: '资源条与灵气类型', en: 'Resource Bar and Aura Types' },
        sections: {
          zh: [
            'resource_bar_context',
            'resource_bar_render_data_type',
            'resource_bar_visibility_type',
            'resource_value_provider_type',
            'aura_maximum_type'
          ],
          en: [
            'resource_bar_context',
            'resource_bar_render_data_type',
            'resource_bar_visibility_type',
            'resource_value_provider_type',
            'aura_maximum_type'
          ]
        }
      },
      {
        page: 'datapack/types/other/formation-and-matcher',
        title: { zh: '阵法、时间线与匹配器类型', en: 'Formation, Timeline and Matcher Types' },
        sections: {
          zh: ['formation_action_type', 'timeline_entry_type', 'item_matcher_entry_type'],
          en: ['formation_action_type', 'timeline_entry_type', 'item_matcher_entry_type']
        }
      }
    ]
  },
  {
    parent: 'player-guide/commands',
    children: [
      {
        // The friends system is an extension surface, not a command, so it lives with the
        // Java API pages.
        page: 'java/friends',
        title: { zh: '好友与敌我识别', en: 'Friends and Foe Identification' },
        sections: {
          zh: [
            '模块定位',
            '完成状态',
            '两种好友',
            '命令',
            '判断流程',
            '离线镜像缓存',
            'FTB Teams（可选）',
            '数据包条件',
            '接入示例',
            '服务端/客户端边界',
            '测试与故障排查'
          ],
          en: ['Friends']
        }
      }
    ]
  }
]

/**
 * Pages that are written and owned by hand. The script neither regenerates nor deletes
 * them, so translating a page by hand is enough to take it away from the migration.
 */
const KEEP = new Set(['index.md', 'installation.md', 'player-guide/index.md'])

/** Datapack registries documented as their own `###` section of the spec file. */
const REGISTRIES = [
  'resource',
  'aura',
  'realm_stage',
  'element',
  'spirit_root',
  'physique',
  'ability',
  'curse',
  'forging_method',
  'forging_blueprint',
  'tool_binding',
  'blueprint_binding',
  'item_quality',
  'skill_stage',
  'technique',
  'cultivate_action',
  'item_binding',
  'weapon_binding',
  'pill_binding',
  'technique_binding',
  'item_archetype',
  'spirit_herb',
  'aura_zone',
  'block_aura',
  'item_aura',
  'formation',
  'tribulation',
  'creature_profile',
  'contract_type',
  'realm_instance',
  'trigger',
  'talisman',
  'currency'
]

/** Sub-sections of the spec file that belong to a registry page of the same name. */
const REGISTRY_SUBSECTIONS = {
  'resource.bars': 'resource',
  'aura_zone.client_hud': 'aura_zone',
  灌注与激发: 'talisman'
}

/**
 * Sub-sections that sit at the same heading level as their parent in the spec file, and
 * therefore have to be pulled into the parent page explicitly.
 */
const EXTRA_SECTIONS = {
  resource: ['resource.bars'],
  aura_zone: ['aura_zone.client_hud'],
  talisman: ['灌注与激发']
}

/**
 * How each Chinese page is composed. `file:` takes a whole guide document, `section:`
 * takes one section of the JSON spec file.
 */
const COMPOSE = {
  index: ['file:index.md'],
  installation: ['file:getting-started.md'],
  'datapack/overview': [
    'file:guide/datapack/overview.md',
    'section:加载与覆盖',
    'section:加载、同步与调试'
  ],
  'datapack/damage': ['section:伤害结算'],
  'datapack/examples': ['file:guide/datapack/examples.md', 'section:灵气、元素与通用绑定示例'],
  'datapack/json/index': ['section:动态注册表', 'section:固有类型分派', 'file:guide/datapack/other.md'],
  'datapack/types/shared_data_types': [
    'section:基础类型',
    'section:图标引用',
    'section:Holder、标签与匹配器'
  ],
  'datapack/types/number_provider_types': ['section:数值提供器'],
  'datapack/types/formula_variables': ['section:常见公式变量'],
  'java/api': ['file:guide/java/api.md'],
  'java/hotbar': ['file:guide/java/hotbar.md'],
  'java/index': ['file:guide/java/index.md'],
  'java/interfaces': ['file:guide/java/interfaces.md'],
  'java/network': ['file:guide/java/network.md'],
  'java/registries': ['file:guide/java/registries.md'],
  'java/screens': ['file:guide/java/screens.md'],
  'kubejs/api-reference': ['file:guide/kubejs/api.md'],
  'kubejs/examples': ['file:guide/kubejs/examples.md', 'file:kubejs物品示例.md'],
  'kubejs/index': ['file:guide/kubejs/index.md'],
  'kubejs/items': ['file:guide/kubejs/items.md'],
  'player-guide/commands': ['file:guide/play/commands.md', 'file:guide/play/friends.md'],
  'player-guide/curios-slots': ['file:curios槽位.md'],
  'player-guide/index': ['file:guide/play/index.md'],
  'player-guide/items': ['file:guide/play/items.md', 'file:通用物品.md'],
  'player-guide/keys-and-hud': ['file:guide/play/hotbar.md', 'file:guide/play/interaction.md']
}

/** Registry pages that get an extra guide document appended after their spec section. */
const REGISTRY_EXTRA = {
  resource: 'guide/datapack/resource.md',
  aura: 'guide/datapack/aura.md',
  cultivate_action: 'guide/datapack/cultivation.md',
  ability: 'guide/datapack/ability.md',
  item_binding: 'guide/datapack/items.md',
  formation: 'guide/datapack/formation.md',
  item_aura: '物品灵气数据包.md',
  aura_zone: '灵气环境数据包.md',
  currency: '经济系统数据包格式.md'
}

/** Chinese page titles, used when no source document carries one. */
const TITLES = {
  'datapack/damage': '伤害结算',
  'datapack/json/index': '动态注册表',
  'datapack/types/shared_data_types': '共享数据类型',
  'datapack/types/number_provider_types': '数值提供器',
  'datapack/types/formula_variables': '公式变量',
  'datapack/types/index': '类型参考',
  'datapack/types/other_types': '其他类型',
  'datapack/types/action/entity_action_types': '实体行为类型',
  'datapack/types/action/bientity_action_types': '双实体行为类型',
  'datapack/types/action/block_action_types': '方块行为类型',
  'datapack/types/action/item_action_types': '物品行为类型',
  'datapack/types/condition/entity_condition_types': '实体条件类型',
  'datapack/types/condition/bientity_condition_types': '双实体条件类型',
  'datapack/types/condition/block_condition_types': '方块条件类型',
  'datapack/types/condition/item_condition_types': '物品条件类型',
  'datapack/types/condition/damage_condition_types': '伤害条件类型',
  'datapack/json/alchemy_recipe': 'alchemy_recipe（炼丹配方）',
  'datapack/json/spirit_crafting': 'spirit_crafting（灵性合成）',
  faq: '常见问题',
  'datapack/loot-and-criteria': '战利品与进度条件',
  'tutorial/index': '教程',
  'tutorial/add-an-ability': '定义一个技能',
  'tutorial/define-aura-and-realms': '定义灵气与境界',
  'tutorial/aura-environment': '搭建灵气环境',
  'tutorial/create-items-with-kubejs': '用 KubeJS 创建物品',
  'java/information-panel': '信息面板'
}

const REGISTRY_TITLES = {
  resource: '资源',
  aura: '灵气',
  realm_stage: '境界阶段',
  element: '元素',
  spirit_root: '灵根',
  physique: '体质',
  ability: '技能',
  curse: '诅咒',
  forging_method: '锻造手法',
  forging_blueprint: '锻造图纸',
  tool_binding: '工具绑定',
  blueprint_binding: '图纸绑定',
  item_quality: '品质',
  skill_stage: '技能水平',
  technique: '功法',
  cultivate_action: '修炼行为',
  item_binding: '物品绑定',
  weapon_binding: '武器绑定',
  pill_binding: '丹药绑定',
  technique_binding: '功法绑定',
  item_archetype: '法器原型',
  spirit_herb: '灵植',
  aura_zone: '灵气区域',
  block_aura: '方块灵气',
  item_aura: '物品灵气',
  formation: '阵法',
  tribulation: '天劫',
  creature_profile: '生物档案',
  contract_type: '契约类型',
  realm_instance: '秘境实例',
  trigger: '事件规则',
  talisman: '符箓',
  currency: '货币'
}

/* ------------------------------------------------------------------ migration */

/**
 * The compose step reads its `file:` sources by name, and five of them were retired on
 * 2026-09-21: the mod repository deleted its pre-migration long-form pages, because that content
 * now lives here (the pages below) and in its `数据包格式.md`. A re-run without them would rewrite
 * the pages that used to be generated from them with whatever is left, so it refuses instead and
 * names the missing file. `scripts/.migrated.json` still remembers what was generated.
 */
const RETIRED_ZH_SOURCES = {
  'curios槽位.md': 'player-guide/curios-slots',
  '通用物品.md': 'player-guide/items',
  '灵气环境数据包.md': 'datapack/json/aura_zone',
  '经济系统数据包格式.md': 'datapack/json/currency',
  'item-bindings.md': null
}

/** Every Chinese document the compose step reads: the `file:` entries plus the registry extras. */
function requiredZhSources() {
  const required = new Set([SPEC, ...Object.values(REGISTRY_EXTRA)])
  for (const entries of Object.values(COMPOSE))
    for (const entry of entries)
      if (entry.startsWith('file:')) required.add(entry.slice('file:'.length))
  return [...required]
}

const missingZh = requiredZhSources().filter((name) => !existsSync(path.join(ZH_SRC, name)))
if (missingZh.length > 0) {
  console.error(
    [
      'migrate-docs cannot re-run: these Chinese sources are missing from',
      `  ${ZH_SRC}`,
      '',
      ...missingZh.map((name) => {
        const page = RETIRED_ZH_SOURCES[name]
        if (page === undefined) return `  - ${name}`
        return page === null
          ? `  - ${name}（从未发布，仅内部参考）`
          : `  - ${name}（已退役；那一页现在手工维护：${page}）`
      }),
      '',
      'The migration has already been run, and the pages it produced are maintained by hand now.',
      'Restore those sources (git history has them) or point MXT_ZH_DOCS at an older snapshot if',
      'you really need to re-run it.',
    ].join('\n')
  )
  process.exit(1)
}

const manifest = []
const report = { copied: 0, composed: 0, split: 0, registryPurpose: 0, gaps: [], warnings: [] }

function convertEn() {
  for (const file of walk(EN_SRC)) {
    if (!file.endsWith('.md')) continue
    const rel = path.relative(EN_SRC, file).replace(/\\/g, '/')
    const { meta, body } = splitFrontMatter(read(file))
    const content = frontMatter({ title: meta.title, description: meta.description }) +
      convertContainers(body).trim() + '\n'
    write(`en/${rel}`, content, manifest)
    report.copied += 1
  }
}

function migrateZh() {
  const specText = read(path.join(ZH_SRC, SPEC))
  const specDoc = parseHeadings(splitFrontMatter(specText).body)

  // Every source file that the site publishes, mapped onto its target page.
  const filePages = new Map(Object.entries(ZH_FILES))

  /** Link targets that live in the spec file: section name -> page. */
  const specTargets = new Map()
  specTargets.set('文件位置', 'datapack/overview')
  specTargets.set('加载与覆盖', 'datapack/overview')
  specTargets.set('加载、同步与调试', 'datapack/overview')
  specTargets.set('失效功法数据与修复', 'datapack/overview')
  specTargets.set('基础类型', 'datapack/types/shared_data_types')
  specTargets.set('图标引用', 'datapack/types/shared_data_types')
  specTargets.set('Holder、标签与匹配器', 'datapack/types/shared_data_types')
  specTargets.set('数值提供器', 'datapack/types/number_provider_types')
  specTargets.set('常见公式变量', 'datapack/types/formula_variables')
  specTargets.set('固有类型分派', 'datapack/json/index')
  specTargets.set('动态注册表', 'datapack/json/index')
  specTargets.set('伤害结算', 'datapack/damage')
  specTargets.set('灵气、元素与通用绑定示例', 'datapack/examples')
  specTargets.set('符箓', 'datapack/json/talisman')
  for (const registry of REGISTRIES) specTargets.set(registry, `datapack/json/${registry}`)
  for (const [sub, registry] of Object.entries(REGISTRY_SUBSECTIONS)) {
    specTargets.set(sub, `datapack/json/${registry}`)
  }
  // Group headings of the spec file: the best page for a deep link is the registry index.
  for (const head of specDoc.heads) {
    const name = clean(head.text)
    if (head.level === 2 && !specTargets.has(name)) specTargets.set(name, 'datapack/json/index')
  }

  const sourceAvailable = (source) => {
    const [kind, ...rest] = source.split(':')
    const name = rest.join(':')
    if (kind === 'file') return existsSync(path.join(ZH_SRC, name))
    const skip = name === '数值提供器' ? ['常见公式变量'] : []
    return extractSection(specDoc, name, skip) !== null
  }

  // Which page is composed from what, plus the set of Chinese pages that will exist.
  const pageSources = new Map(Object.entries(COMPOSE))
  for (const registry of REGISTRIES) {
    const sources = [`section:${registry}`]
    for (const extra of EXTRA_SECTIONS[registry] ?? []) sources.push(`section:${extra}`)
    if (REGISTRY_EXTRA[registry]) sources.push(`file:${REGISTRY_EXTRA[registry]}`)
    pageSources.set(`datapack/json/${registry}`, sources)
  }
  const produced = new Set()
  for (const [page, sources] of pageSources) {
    if (existsSync(path.join(DOCS, `${page}.md`)) || sources.some(sourceAvailable)) produced.add(page)
  }
  // Hand written Chinese pages that are not composed from any source count as well.
  for (const page of Object.keys(TITLES)) {
    if (existsSync(path.join(DOCS, `${page}.md`))) produced.add(page)
  }
  // Pages this run creates later (structural splits and the per-command pages), so links
  // into them stay in this language instead of falling back to the English tree.
  for (const split of SPLITS) {
    for (const child of split.children) produced.add(child.page)
  }
  for (const root of COMMAND_PAGES.roots) {
    produced.add(`${COMMAND_PAGES.parent}/${root}`)
  }

  /** Rewrite every internal link of a Chinese chunk onto its new page. */
  const rewrite = (text, sourceRel, ownPage) => {
    const sourceDir = path.posix.dirname(sourceRel)
    let fence = false
    return text
      .split('\n')
      .map((line) => {
        if (/^\s*(```|~~~)/.test(line)) {
          fence = !fence
          return line
        }
        if (fence || !line.includes('](')) return line
        return line.replace(/\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, label, rawTarget, title) => {
          if (/^[a-z][a-z0-9+.-]*:/i.test(rawTarget) || rawTarget.startsWith('//')) return whole
          const hash = rawTarget.indexOf('#')
          const target = hash === -1 ? rawTarget : rawTarget.slice(0, hash)
          const fragment = hash === -1 ? '' : rawTarget.slice(hash + 1)
          if (target === '') return whole // pure fragment, stays on the page

          const candidates = []
          const fileRelative = path.posix.normalize(path.posix.join(sourceDir, target))
          const rootRelative = path.posix.normalize(target.replace(/^\/+/, ''))
          for (const base of [fileRelative, rootRelative]) {
            candidates.push(base, `${base}.md`, `${base}/index.md`, base.replace(/\.md$/, ''))
          }

          let page = null
          let excluded = false
          for (const candidate of candidates) {
            if (filePages.has(candidate)) {
              page = filePages.get(candidate)
              break
            }
            if (candidate.endsWith('.md') && ZH_EXCLUDED.has(candidate)) {
              excluded = true
              break
            }
            if (candidate.replace(/\.md$/, '') === SPEC.replace(/\.md$/, '')) {
              page = specTargets.get(fragment) ?? 'datapack/json/index'
              break
            }
          }

          if (page === null) {
            // Not a published page: an internal document, a missing file or an asset.
            if (excluded || existsSync(path.join(ZH_SRC, fileRelative))) return label
            return whole
          }

          const prefix = produced.has(page) ? '' : '/en'
          const url = `${prefix}/${page === 'index' ? '' : page}`
          const anchor = page === ownPage && fragment ? `#${fragment}` : ''
          return `[${label}](${url}${anchor}${title ?? ''})`
        })
      })
      .join('\n')
  }

  /**
   * The Chinese sources occasionally mention files by their path inside the mod
   * repository. Those paths do not exist on the website, so point them at the page that
   * now carries the same content.
   */
  const polish = (text) => {
    let out = text
    out = out.replace(/`docs\/数据包格式\.md`\s*的「([^」]+)」/g, (whole, name) => {
      const page = specTargets.get(name)
      return page ? `[${name}](/${page})` : whole
    })
    out = out.replace(/`docs\/guide\/datapack\/([\w-]+)\.md`\s*的「([^」]+)」/g, (whole, file, name) => {
      const page = filePages.get(`guide/datapack/${file}.md`)
      return page ? `[${name}](/${page})` : whole
    })
    out = out.replace(/`docs\/([^`]+\.md)`/g, (whole, file) => {
      const page = filePages.get(file)
      return page ? `[${file.replace(/\.md$/, '')}](/${page})` : whole
    })
    out = out.replace(/以\s*模块实现审计\s*为准/g, '以项目仓库内的「模块实现审计」为准')
    out = out.replace(/见模块实现审计/g, '见项目仓库内的「模块实现审计」')
    return out
  }

  const chunksFor = (page, sources) =>
    sources
      .map((source, index) => {
        const [kind, ...rest] = source.split(':')
        const name = rest.join(':')
        if (kind === 'file') {
          const text = readOrNull(path.join(ZH_SRC, name))
          if (text === null) return null
          const { body } = splitFrontMatter(text)
          return polish(rewrite(normalizeHeadings(stripLeadingH1(body)).trim(), name, page))
        }
        const skip = name === '数值提供器' ? ['常见公式变量'] : []
        // A section that gives the page its title does not repeat it as a heading.
        const omit =
          index === 0 &&
          (page.startsWith('datapack/json/') && !page.endsWith('/index')
            ? name === page.replace('datapack/json/', '')
            : TITLES[page] === name)
        const section = extractSection(specDoc, name, skip, omit)
        if (section === null) return null
        return polish(rewrite(normalizeHeadings(section).trim(), SPEC, page))
      })
      .filter((chunk) => chunk !== null && chunk !== '')

  const titleFor = (page, sources) => {
    if (REGISTRY_TITLES[page.replace('datapack/json/', '')] && page.startsWith('datapack/json/')) {
      const registry = page.replace('datapack/json/', '')
      return `${registry}（${REGISTRY_TITLES[registry]}）`
    }
    if (TITLES[page]) return TITLES[page]
    for (const source of sources) {
      const [kind, ...rest] = source.split(':')
      const name = rest.join(':')
      if (kind === 'file') {
        const text = readOrNull(path.join(ZH_SRC, name))
        if (text === null) continue
        const { meta, body } = splitFrontMatter(text)
        const h1 = /^#\s+(.*)$/m.exec(body)
        if (h1) return h1[1].trim()
        if (meta.title) return meta.title
      }
    }
    return page
  }

  const composePage = (page, sources) => {
    const chunks = chunksFor(page, sources)
    if (chunks.length === 0) {
      report.gaps.push(`zh: ${page}`)
      return null
    }
    const title = titleFor(page, sources)
    const id = page.startsWith('datapack/json/') && !page.endsWith('/index')
      ? ` {#${page.replace('datapack/json/', '')}}`
      : ''
    return `${frontMatter({ title })}# ${title}${id}\n\n${chunks.join('\n\n')}\n`
  }

  for (const [page, sources] of pageSources) {
    if (KEEP.has(`${page}.md`)) continue
    const content = composePage(page, sources)
    if (content !== null) {
      write(`${page}.md`, content, manifest)
      report.composed += 1
    }
  }

  // Pages that exist in English only: report them so translations can follow.
  for (const page of Object.keys(TITLES)) {
    if (!existsSync(path.join(DOCS, `${page}.md`))) report.gaps.push(`zh (missing): ${page}`)
  }
}

/* ------------------------------------------------------------------ splitting */

/** Split a body into its preamble and one block per level-2 heading. */
function level2Blocks(body) {
  const doc = parseHeadings(body)
  const heads = doc.heads.filter((head) => head.level === 2)
  const blocks = heads.map((head, index) => {
    const end = index + 1 < heads.length ? heads[index + 1].line : doc.lines.length
    return {
      heading: clean(head.text),
      text: doc.lines.slice(head.line, end).join('\n').trim()
    }
  })
  const preambleEnd = heads.length > 0 ? heads[0].line : doc.lines.length
  return { preamble: doc.lines.slice(0, preambleEnd).join('\n').trim(), blocks }
}

/** Drop the first heading line of a block (used when the title carries the name). */
const dropHeading = (text) => text.replace(/^#{1,6}\s+.*\n+/, '').trim()

/**
 * Moved sections keep their text verbatim, so their relative links have to be re-based
 * from the parent's directory onto the child's directory.
 */
function rebaseLinks(text, fromDir, toDir) {
  if (fromDir === toDir) return text
  let fence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence
        return line
      }
      if (fence || !line.includes('](')) return line
      return line.replace(/\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, label, raw, title) => {
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || /^[/#]/.test(raw)) return whole
        const hash = raw.indexOf('#')
        const target = hash === -1 ? raw : raw.slice(0, hash)
        const fragment = hash === -1 ? '' : raw.slice(hash + 1)
        if (target === '') return whole
        const absolute = path.posix.normalize(path.posix.join(fromDir, target))
        let relative = path.posix.relative(toDir, absolute)
        if (!relative.startsWith('.')) relative = `./${relative}`
        return `[${label}](${relative}${fragment ? `#${fragment}` : ''}${title ?? ''})`
      })
    })
    .join('\n')
}

/**
 * Same-page fragment links inside a moved section pointed at a heading that may have
 * travelled to a different child page; send them there explicitly.
 */
function rewriteOwnFragments(text, ownPage, movedSlugs, prefix) {
  let fence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence
        return line
      }
      if (fence || !line.includes('](')) return line
      return line.replace(/\[([^\]]*)\]\(#([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, label, raw, title) => {
        const page = movedSlugs.get(normalizeAnchor(raw))
        if (page === undefined || page === ownPage) return whole
        return `[${label}](/${prefix}${page}#${raw}${title ?? ''})`
      })
    })
    .join('\n')
}

/**
 * Move the declared sections of a page into child pages, in both language trees.
 * Running it twice is safe: once the sections are gone from the parent, the split is
 * considered done and only the generated child pages are kept alive in the manifest.
 */
function applySplits(locale) {
  for (const split of SPLITS) {
    const prefix = locale === 'zh' ? '' : 'en/'
    const parentRel = `${prefix}${split.parent}.md`
    const parentPath = path.join(DOCS, parentRel)
    if (!existsSync(parentPath)) {
      report.warnings.push(`split: ${parentRel} is missing`)
      continue
    }

    const { meta, body } = splitFrontMatter(read(parentPath))
    const { preamble, blocks } = level2Blocks(body)
    const moved = new Map() // heading -> child page
    const outputs = []

    for (const child of split.children) {
      const names = child.sections[locale]
      const found = blocks.filter((block) => names.includes(block.heading))
      if (found.length === 0) continue
      for (const block of found) moved.set(block.heading, child.page)
      outputs.push({ child, found })
    }

    const missing = split.children.filter(
      (child) => !outputs.some((output) => output.child === child)
    )

    if (outputs.length === 0) {
      // Already split in an earlier run; keep the parent and the children owned so the
      // stale-file cleanup cannot remove what a previous run produced.
      manifest.push(parentRel)
      for (const child of split.children) {
        if (!existsSync(path.join(DOCS, `${prefix}${child.page}.md`))) {
          report.warnings.push(`split: ${prefix}${child.page} is missing and cannot be rebuilt`)
        } else {
          manifest.push(`${prefix}${child.page}.md`)
        }
      }
      continue
    }

    const parentDir = path.posix.dirname(parentRel)
    // Every heading inside a moved section is indexed, not only the section heading, so
    // deep links such as `#formulacontext` follow the heading to its new page.
    const innerSlugs = new Map()
    for (const { child, found } of outputs) {
      for (const block of found) {
        for (const line of block.text.split('\n')) {
          const inner = /^#{1,6}\s+(.*)$/.exec(line)
          if (inner) innerSlugs.set(normalizeAnchor(inner[1]), child.page)
        }
      }
    }
    for (const { child, found } of outputs) {
      const title = child.title[locale]
      const childDir = path.posix.dirname(`${prefix}${child.page}.md`)
      const chunks = found.map((block) => {
        const moved = rewriteOwnFragments(
          rebaseLinks(found.length === 1 ? dropHeading(block.text) : block.text, parentDir, childDir),
          child.page,
          innerSlugs,
          prefix
        )
        // Losing the section heading promotes the headings below it, so the child page
        // keeps a sane H2-first outline.
        return normalizeHeadings(moved)
      })
      const heading = `# ${title}`
      const meta = { title: title.replace(/`/g, '') }
      write(`${prefix}${child.page}.md`, `${frontMatter(meta)}${heading}\n\n${chunks.join('\n\n')}\n`, manifest)
      report.split += 1
    }

    const kept = blocks.filter((block) => !moved.has(block.heading)).map((block) => block.text)
    const parentContent = frontMatter(meta) + [preamble, ...kept].filter(Boolean).join('\n\n') + '\n'
    write(parentRel, parentContent, manifest)

    // Point links that deep-linked into a moved section at the section's new page.
    const movedSlugs = new Map(innerSlugs)
    for (const [heading, page] of moved) movedSlugs.set(normalizeAnchor(heading), page)
    if (movedSlugs.size === 0) continue
    for (const file of walk(DOCS)) {
      const rel = path.relative(DOCS, file).replace(/\\/g, '/')
      if (locale === 'en' ? !rel.startsWith('en/') : rel.startsWith('en/')) continue
      if (!file.endsWith('.md')) continue
      const original = read(file)
      if (!original.includes('#') || !original.includes('](')) continue
      const updated = rewriteMovedLinks(original, rel, parentRel, movedSlugs)
      if (updated !== original) writeFileSync(file, updated, 'utf8')
    }

    if (missing.length > 0) {
      report.warnings.push(
        `split: ${parentRel} produced no section for ${missing.map((child) => child.page).join(', ')}`
      )
    }
  }
}

const normalizeAnchor = (value) =>
  value
    .replace(/`/g, '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}\-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

/** Rewrite `parent#section` links onto the child page that now holds that section. */
function rewriteMovedLinks(text, fileRel, parentRel, movedSlugs) {
  const dir = path.posix.dirname(fileRel)
  const own = fileRel.replace(/\.md$/, '')
  let fence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence
        return line
      }
      if (fence || !line.includes('](')) return line
      return line.replace(/\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, label, raw, title) => {
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) return whole
        const hash = raw.indexOf('#')
        if (hash === -1) return whole
        const target = raw.slice(0, hash)
        const fragment = raw.slice(hash + 1)
        if (fragment === '') return whole
        const resolved = target === ''
          ? own
          : path.posix.normalize(path.posix.join(dir, target.replace(/^\/+/, ''))).replace(/\.md$/, '')
        if (resolved !== parentRel.replace(/\.md$/, '')) return whole
        const page = movedSlugs.get(normalizeAnchor(fragment))
        if (page === undefined) return whole
        const prefix = fileRel.startsWith('en/') ? '/en/' : '/'
        return `[${label}](${prefix}${page}#${fragment}${title ?? ''})`
      })
    })
    .join('\n')
}

/* ------------------------------------------------------------- command pages */

/**
 * The command reference is split one page per **root command**: every table row and every
 * detail section of the parent page moves to the page of the root it belongs to, and the
 * parent becomes an index. Rows that carry a top-level alias (`/aura`, `/formation`, …)
 * follow the alias instead of `/mxt`.
 */
const COMMAND_PAGES = {
  parent: 'player-guide/commands',
  roots: [
    'mxt',
    'picker',
    'aura',
    'ability',
    'curse',
    'technique',
    'talisman',
    'formation',
    'lightning',
    'tribulation',
    'display',
    'trade',
    'friend'
  ],
  /** Sections whose title does not name a command but belongs to one of the pages. */
  sectionTargets: {
    zh: { 阵盘: 'formation', 好友名单: 'friend' },
    en: { 'Formation Plates': 'formation' }
  },
  /** Sections that document the command layer itself and stay on the index page. */
  keepSections: {
    zh: [],
    en: ['Permissions', 'Tab Completion']
  },
  /**
   * Rows the Chinese command table is missing. They document the mod's real commands and
   * come from the English table, so the two trees keep the same page set.
   */
  supplements: {
    zh: {
      talisman: [
        '| `/talisman`（= `/mxt talisman`） | 发给你一个空白符箓载体。该子树的所有节点都需要 `gamemaster` 权限。 |',
        '| `/talisman blank [count <count>]`（= `/mxt talisman blank [count <count>]`） | 发给你 `count` 个空白载体；数量接受 1–64，默认 1。 |',
        '| `/talisman give <talismans> [count <count>] [stored]`（= `/mxt talisman give …`） | 发给你已铭刻指定符箓定义的载体；`<talismans>` 是逗号分隔的列表，`count` 一次给出多份（1–64，默认 1），`stored` 以储存模式铭刻，于是它们靠手动灌注而不是下一次点按发动。 |',
        '| `/talisman give <talismans> count <count> charged`（= `/mxt talisman give …`） | 同上，并同时把整笔灵气灌进去，这正是让载体在下一次点按发动的方式。`charged` 只能写在 `count` 之后。 |'
      ]
    }
  }
}

/** The command token of a table cell or heading: `/mxt aura query` -> `/mxt`. */
const tokenRoot = (token) => `/${token.replace(/^\//, '').split(/\s+/)[0]}`

/** Does a code span in a table cell need its pipe escaped so the row keeps its columns? */
const escapePipes = (line) =>
  line.replace(/`[^`]*`/g, (span) => span.replace(/\|/g, '\\|'))

/** Which command page does this text belong to? */
function commandPageFor(text, locale) {
  const explicit = COMMAND_PAGES.sectionTargets[locale][clean(text)]
  if (explicit !== undefined) return explicit
  const tokens = [...text.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1].trim())
    .filter((token) => token.startsWith('/'))
  // Headings arrive with their code ticks already stripped, so the whole text can be the
  // command token (`/mxt lightning`, `/picker`).
  const bare = clean(text)
  if (bare.startsWith('/')) tokens.push(bare)
  for (const token of tokens) {
    const root = tokenRoot(token).slice(1)
    if (COMMAND_PAGES.roots.includes(root) && root !== 'mxt') return root
  }
  for (const token of tokens) {
    // Command paths are space separated (`/mxt lightning`), so the interesting segment of
    // a `/mxt ...` token is the second word.
    const words = token
      .replace(/^\//, '')
      .split(/\s+/)
      .filter((word) => word !== '' && !word.startsWith('[') && !word.startsWith('<'))
    let leaf = words[0] ?? ''
    if (leaf === 'mxt' && words[1] !== undefined) leaf = words[1]
    leaf = leaf.split('/').pop()
    if (COMMAND_PAGES.roots.includes(leaf) && leaf !== 'mxt') return leaf
  }
  return 'mxt'
}

/** Find the `| Command | Effect |` table of a page and where it lives. */
function findCommandTable(preamble, blocks) {
  const sources = [
    { where: 'preamble', text: preamble, index: -1 },
    ...blocks.map((block, index) => ({ where: `block:${block.heading}`, text: block.text, index }))
  ]
  for (const source of sources) {
    const lines = source.text.split('\n')
    const header = lines.findIndex(
      (line) => line.startsWith('|') && /(命令|Command)\s*\|/.test(line)
    )
    if (header === -1) continue
    if (!/^\|[\s:|-]+\|$/.test((lines[header + 1] ?? '').trim())) continue
    const rows = []
    let cursor = header + 2
    while (cursor < lines.length && lines[cursor].startsWith('|')) {
      rows.push(lines[cursor])
      cursor += 1
    }
    if (rows.length === 0) continue
    return { ...source, header, separator: lines[header + 1], rows, end: cursor, lines }
  }
  return null
}

/** Replace the nav section of a group page with a list built from the page spec. */
function groupNavFor(page, locale) {
  const item = pageItems.get(page)
  if (!item?.items) return null
  const prefix = locale === 'zh' ? '' : '/en'
  const url = (child) => `${prefix}/${child.page === 'index' ? '' : child.page}`
  const lines = []
  const label = (entry) => entry[locale] ?? entry.text?.[locale] ?? entry.page
  // Mirrors `sortAlpha` in the sidebar builder: an `alpha` group reads A→Z with `mxt`
  // pinned first, so a page only has to be added to the spec, not placed in it.
  const order = (entries) => {
    if (!item.alpha) return entries
    const slug = (entry) => entry.page.split('/').pop()
    return [...entries].sort((a, b) => {
      const [left, right] = [slug(a), slug(b)]
      if (left === 'mxt' || right === 'mxt') return left === right ? 0 : left === 'mxt' ? -1 : 1
      return left < right ? -1 : left > right ? 1 : 0
    })
  }
  if (item.alpha) {
    for (const child of order(item.items.filter((entry) => entry.page))) {
      lines.push(`- [${label(child)}](${url(child)})`)
    }
    return { heading: NAV_HEADING[locale], text: lines.join('\n') }
  }
  for (const child of item.items) {
    if (child.page) {
      lines.push(`- [${label(child)}](${url(child)})`)
      continue
    }
    if (child.items) {
      lines.push('', `### ${label(child)}`, '')
      for (const nested of order(child.items.filter((entry) => entry.page))) {
        lines.push(`- [${label(nested)}](${url(nested)})`)
      }
    }
  }
  return { heading: NAV_HEADING[locale], text: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() }
}

const NAV_HEADING = { zh: '子页面', en: 'Sub-pages' }

/** Every page that owns sub-pages gets a freshly generated nav block after its intro. */
function refreshGroupNav(locale) {
  const prefix = locale === 'zh' ? '' : 'en/'
  for (const page of pageItems.keys()) {
    const nav = groupNavFor(page, locale)
    if (nav === null) continue
    const rel = `${prefix}${page}.md`
    const full = path.join(DOCS, rel)
    if (!existsSync(full)) continue
    const { meta, body } = splitFrontMatter(read(full))
    const { preamble, blocks } = level2Blocks(body)
    const kept = blocks.filter((block) => block.heading !== nav.heading).map((block) => block.text)
    const navBlock = `## ${nav.heading}\n\n${nav.text}`
    const content = frontMatter(meta) + [preamble, navBlock, ...kept].filter(Boolean).join('\n\n') + '\n'
    if (content !== read(full)) write(rel, content, manifest)
  }
}

/** Split the command reference into one page per root command. */
function applyCommandPages(locale) {
  const prefix = locale === 'zh' ? '' : 'en/'
  const parentRel = `${prefix}${COMMAND_PAGES.parent}.md`
  const parentPath = path.join(DOCS, parentRel)
  if (!existsSync(parentPath)) {
    report.warnings.push(`commands: ${parentRel} is missing`)
    return
  }

  const { meta, body } = splitFrontMatter(read(parentPath))
  const { preamble, blocks } = level2Blocks(body)

  // 1. collect the rows of the command table, per root command
  const table = findCommandTable(preamble, blocks)
  const grouped = new Map(COMMAND_PAGES.roots.map((root) => [root, { rows: [], sections: [] }]))
  if (table !== null) {
    for (const row of table.rows) {
      const page = commandPageFor(row, locale)
      grouped.get(page).rows.push(escapePipes(row))
    }
    for (const [root, extra] of Object.entries(COMMAND_PAGES.supplements[locale] ?? {})) {
      grouped.get(root).rows.push(...extra)
    }
  }

  // 2. collect the detail sections (`## /mxt lightning`, `### /picker`, `## Formation Plates`)
  const movedSlugs = new Map()
  const removed = new Set()
  const claim = (heading, text, page) => {
    grouped.get(page).sections.push(text)
    removed.add(heading)
    for (const line of text.split('\n')) {
      const inner = /^#{1,6}\s+(.*)$/.exec(line)
      if (inner) movedSlugs.set(normalizeAnchor(inner[1]), `${COMMAND_PAGES.parent}/${page}`)
    }
  }
  for (const block of blocks) {
    if (block.heading === NAV_HEADING[locale]) continue
    if ((COMMAND_PAGES.keepSections[locale] ?? []).includes(block.heading)) continue

    const own = commandPageFor(block.heading, locale)
    const lines = block.text.split('\n')
    const inner = parseHeadings(block.text).heads.filter((head) => head.level === 3)
    if (inner.length === 0) {
      claim(block.heading, block.text, own)
      continue
    }

    // The block is only a container: its level-3 subsections are commands of their own.
    removed.add(block.heading)
    let body = lines.slice(1, inner[0].line)
    if (table !== null && table.where === `block:${block.heading}`) {
      body = [...body.slice(0, table.header - 1), ...body.slice(table.end - 1)]
    }
    const intro = body.join('\n').trim()
    if (intro !== '') grouped.get(own).sections.push(intro)
    for (let index = 0; index < inner.length; index++) {
      const end = index + 1 < inner.length ? inner[index + 1].line : lines.length
      const text = lines.slice(inner[index].line, end).join('\n').trim()
      claim(clean(inner[index].text), text, commandPageFor(inner[index].text, locale))
    }
  }

  if (table === null && movedSlugs.size === 0) {
    // Already split: keep what a previous run produced alive in the manifest.
    manifest.push(parentRel)
    for (const root of COMMAND_PAGES.roots) {
      const rel = `${prefix}${COMMAND_PAGES.parent}/${root}.md`
      if (existsSync(path.join(DOCS, rel))) manifest.push(rel)
      else report.warnings.push(`commands: ${rel} is missing and cannot be rebuilt`)
    }
    return
  }

  // 3. write one page per root command
  for (const root of COMMAND_PAGES.roots) {
    const group = grouped.get(root)
    const chunks = []
    if (group.rows.length > 0 && table !== null) {
      chunks.push([table.lines[table.header], table.separator, ...group.rows].join('\n'))
    }
    chunks.push(...group.sections.map((section) => normalizeHeadings(section)))
    if (chunks.length === 0) continue
    const title = `\`/${root}\``
    write(
      `${prefix}${COMMAND_PAGES.parent}/${root}.md`,
      `${frontMatter({ title: `/${root}` })}# ${title}\n\n${chunks.join('\n\n')}\n`,
      manifest
    )
    report.split += 1
  }

  // 4. rebuild the parent without the table and without the moved sections
  const keptBlocks = blocks
    .filter((block) => !removed.has(block.heading))
    .map((block) => block.text)
  let keptPreamble = preamble
  if (table !== null && table.where === 'preamble') {
    keptPreamble = [...table.lines.slice(0, table.header), ...table.lines.slice(table.end)]
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
  const content = frontMatter(meta) + [keptPreamble, ...keptBlocks].filter(Boolean).join('\n\n') + '\n'
  write(parentRel, content, manifest)

  // 5. deep links into a moved section follow the section to its new page
  if (movedSlugs.size > 0) {
    for (const file of walk(DOCS)) {
      const rel = path.relative(DOCS, file).replace(/\\/g, '/')
      if (locale === 'en' ? !rel.startsWith('en/') : rel.startsWith('en/')) continue
      if (!file.endsWith('.md')) continue
      const original = read(file)
      if (!original.includes('#') || !original.includes('](')) continue
      const updated = rewriteMovedLinks(original, rel, parentRel, movedSlugs)
      if (updated !== original) writeFileSync(file, updated, 'utf8')
    }
  }
}

/* ---------------------------------------------------------- registry intros */

/**
 * Every registry page starts with its file path, and right below it one line saying what
 * that registry is responsible for. The line is taken from the "purpose" column of the
 * registry table on the JSON index page, so the two can never drift apart.
 */
function applyRegistryPurpose(locale) {
  const prefix = locale === 'zh' ? '' : 'en/'
  const indexRel = `${prefix}datapack/json/index.md`
  const indexFile = path.join(DOCS, indexRel)
  if (!existsSync(indexFile)) {
    report.warnings.push(`registry purpose: ${indexRel} is missing`)
    return
  }

  const purposes = new Map()
  for (const line of read(indexFile).split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length !== 3) continue
    if (!/^`(mxt\/[a-z_]+|recipe)`/.test(cells[1])) continue
    const linked = /\]\(\.\/([a-z_]+)\.md\)/.exec(cells[0])
    const plain = /^`([a-z_]+)`$/.exec(cells[0])
    const name = linked !== null ? linked[1] : plain !== null ? plain[1] : null
    if (name !== null) purposes.set(name, cells[2])
  }

  const marker = locale === 'zh' ? '**用途**：' : '**Purpose**: '
  const dir = path.join(DOCS, `${prefix}datapack/json`)
  let written = 0
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.md') || entry === 'index.md') continue
    const name = entry.replace(/\.md$/, '')
    const purpose = purposes.get(name)
    const rel = `${prefix}datapack/json/${entry}`
    // The page exists, so it is part of this run's output even when nothing is inserted:
    // recording it keeps the stale-file cleanup from deleting an annotated page.
    manifest.push(rel)
    if (purpose === undefined) {
      report.warnings.push(`registry purpose: no purpose listed for ${rel}`)
      continue
    }
    const lines = read(path.join(DOCS, rel)).split('\n')
    if (lines.some((line) => line.includes(marker))) continue
    // The file path is the first line naming the datapack directory; `<id>` is normalised
    // to `<path>` here so both hand written and generated pages read the same.
    const index = lines.findIndex((line) => line.includes('data/<namespace>/'))
    if (index === -1) {
      report.warnings.push(`registry purpose: no file path in ${rel}`)
      continue
    }
    lines[index] = lines[index].replace(/<id>/g, '<path>')
    lines.splice(index + 1, 0, '', `${marker}${purpose}`)
    writeFileSync(path.join(DOCS, rel), `${lines.join('\n')}\n`, 'utf8')
    written += 1
  }
  report.registryPurpose += written
}

/* ---------------------------------------------------------------------- main */

mkdirSync(path.join(PROJECT, 'scripts'), { recursive: true })

// Remove the pages generated by an earlier run that this run no longer produces.
const previous = existsSync(MANIFEST) ? JSON.parse(read(MANIFEST)) : []
convertEn()
const beforeZh = new Set(manifest)
migrateZh()
applyRegistryPurpose('zh')
applyRegistryPurpose('en')
const beforeSplit = new Set(manifest)
applySplits('zh')
applySplits('en')
applyCommandPages('zh')
applyCommandPages('en')
refreshGroupNav('zh')
refreshGroupNav('en')
for (const stale of previous) {
  if (KEEP.has(stale)) continue
  if (!manifest.includes(stale) && !beforeZh.has(stale) && !beforeSplit.has(stale)) {
    const target = path.join(DOCS, stale)
    if (existsSync(target)) rmSync(target)
  }
}
writeFileSync(MANIFEST, `${JSON.stringify(manifest.sort(), null, 2)}\n`, 'utf8')

console.log(`English pages copied: ${report.copied}`)
console.log(`Chinese pages composed: ${report.composed}`)
console.log(`Split child pages written: ${report.split}`)
console.log(`Registry purpose lines: ${report.registryPurpose}`)
console.log(`Generated files: ${manifest.length}`)
if (report.gaps.length > 0) {
  console.log('\nPages still waiting for Chinese content:')
  for (const gap of report.gaps) console.log(`  - ${gap}`)
}
if (report.warnings.length > 0) {
  console.log('\nWarnings:')
  for (const warning of report.warnings) console.log(`  - ${warning}`)
}

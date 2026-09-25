/**
 * The single source of truth for the site structure.
 *
 * Every page is described once, with a Chinese label (the root locale) and an English
 * label (the `/en/` locale). `page` is the path relative to the locale root and without
 * an extension, so `datapack/json/ability` means:
 *
 *   zh: docs/datapack/json/ability.md   ->  /datapack/json/ability
 *   en: docs/en/datapack/json/ability.md ->  /en/datapack/json/ability
 *
 * A page that exists in only one language is silently dropped from the other language's
 * sidebar (see `buildSidebar`), so no sidebar entry ever points at a 404. Run
 * `pnpm run check:i18n` to list those gaps.
 */

export const sections = [
  {
    text: { zh: '开始', en: 'Getting Started' },
    items: [
      { page: 'index', zh: '文档首页', en: 'Home' },
      { page: 'installation', zh: '基本信息与安装', en: 'Installation' },
      { page: 'faq', zh: '常见问题', en: 'FAQ' }
    ]
  },
  {
    text: { zh: '游玩指南', en: 'Player Guide' },
    items: [
      { page: 'player-guide/index', zh: '总览', en: 'Overview' },
      { page: 'player-guide/keys-and-hud', zh: '按键与 HUD', en: 'Keys and HUD' },
      { page: 'player-guide/items', zh: '物品与方块', en: 'Items and Blocks' },
      {
        // The page itself is the group's entry; one sub-page per root command. `alpha`
        // tells the sidebar and the index list to sort the pages A→Z and to pin `/mxt`
        // to the top, so a new command only has to be added anywhere in this list.
        page: 'player-guide/commands',
        zh: '命令',
        en: 'Commands',
        alpha: true,
        items: [
          { page: 'player-guide/commands/mxt', zh: '/mxt（含子命令）', en: '/mxt (and subcommands)' },
          { page: 'player-guide/commands/ability', zh: '/ability', en: '/ability' },
          { page: 'player-guide/commands/aura', zh: '/aura', en: '/aura' },
          { page: 'player-guide/commands/contract', zh: '/contract', en: '/contract' },
          { page: 'player-guide/commands/curse', zh: '/curse', en: '/curse' },
          { page: 'player-guide/commands/display', zh: '/display', en: '/display' },
          { page: 'player-guide/commands/flight', zh: '/flight', en: '/flight' },
          { page: 'player-guide/commands/formation', zh: '/formation', en: '/formation' },
          { page: 'player-guide/commands/friend', zh: '/friend', en: '/friend' },
          { page: 'player-guide/commands/hud', zh: '/hud', en: '/hud' },
          { page: 'player-guide/commands/lightning', zh: '/lightning', en: '/lightning' },
          { page: 'player-guide/commands/physique', zh: '/physique', en: '/physique' },
          { page: 'player-guide/commands/picker', zh: '/picker', en: '/picker' },
          { page: 'player-guide/commands/quality', zh: '/quality', en: '/quality' },
          { page: 'player-guide/commands/realm', zh: '/realm', en: '/realm' },
          { page: 'player-guide/commands/spirit_root', zh: '/spirit_root', en: '/spirit_root' },
          { page: 'player-guide/commands/talisman', zh: '/talisman', en: '/talisman' },
          { page: 'player-guide/commands/technique', zh: '/technique', en: '/technique' },
          { page: 'player-guide/commands/trade', zh: '/trade', en: '/trade' },
          { page: 'player-guide/commands/tribulation', zh: '/tribulation', en: '/tribulation' },
          { page: 'player-guide/commands/wheel', zh: '/wheel', en: '/wheel' }
        ]
      },
      { page: 'player-guide/curios-slots', zh: 'Curios 槽位', en: 'Curios Slots' },
      { page: 'player-guide/rift', zh: '裂隙', en: 'Rifts' }
    ]
  },
  {
    text: { zh: '开发教程', en: 'Tutorials' },
    items: [
      { page: 'tutorial/index', zh: '教程索引', en: 'Tutorials' },
      { page: 'tutorial/add-an-ability', zh: '定义一个技能', en: 'Add an Ability' },
      { page: 'tutorial/define-aura-and-realms', zh: '定义灵气与境界', en: 'Define Aura and Realms' },
      { page: 'tutorial/aura-environment', zh: '搭建灵气环境', en: 'Build the Aura Environment' },
      { page: 'tutorial/create-items-with-kubejs', zh: '用 KubeJS 创建物品', en: 'Create Items with KubeJS' },
      { page: 'tutorial/define-a-formation', zh: '定义一个阵法', en: 'Define a Formation' },
      { page: 'tutorial/open-a-realm', zh: '开一个秘境', en: 'Open a Secret Realm' },
      { page: 'tutorial/inscribe-a-talisman', zh: '刻一张符箓', en: 'Inscribe a Talisman' },
      { page: 'tutorial/bring-down-a-tribulation', zh: '让突破引来天劫', en: 'Bring Down a Tribulation' },
      { page: 'tutorial/forge-a-treasure', zh: '锻造一件法器', en: 'Forge a Treasure' },
      // Deliberately a placeholder: the page lists what the alchemy system is made of and is honest
      // about the tutorial not being written yet, so the sidebar slot exists before the content does.
      { page: 'tutorial/refine-a-pill', zh: '炼制一枚丹药', en: 'Refine a Pill' }
    ]
  },
  {
    text: { zh: '数据包', en: 'Datapack' },
    items: [
      { page: 'datapack/overview', zh: '总览', en: 'Overview' },
      { page: 'datapack/examples', zh: '示例', en: 'Examples' },
      { page: 'datapack/loot-and-criteria', zh: '战利品与进度条件', en: 'Loot and Advancement Criteria' },
      {
        text: { zh: 'JSON 数据格式', en: 'JSON Data Formats' },
        items: [
          { page: 'datapack/json/index', zh: '注册表总览', en: 'Registry Overview' },
          { page: 'datapack/json/ability', zh: 'ability（技能）', en: 'ability' },
          { page: 'datapack/json/alchemy_recipe', zh: 'alchemy_recipe（炼丹配方）', en: 'alchemy_recipe' },
          { page: 'datapack/json/artifact', zh: 'artifact（法器）', en: 'artifact' },
          { page: 'datapack/json/aura', zh: 'aura（灵气）', en: 'aura' },
          { page: 'datapack/json/aura_zone', zh: 'aura_zone（灵气区域）', en: 'aura_zone' },
          { page: 'datapack/json/block_aura', zh: 'block_aura（方块灵气）', en: 'block_aura' },
          { page: 'datapack/json/blueprint_binding', zh: 'blueprint_binding（图纸绑定）', en: 'blueprint_binding' },
          { page: 'datapack/json/contract_type', zh: 'contract_type（契约类型）', en: 'contract_type' },
          { page: 'datapack/json/creature_profile', zh: 'creature_profile（生物档案）', en: 'creature_profile' },
          { page: 'datapack/json/cultivate_action', zh: 'cultivate_action（修炼行为）', en: 'cultivate_action' },
          { page: 'datapack/json/currency', zh: 'currency（货币）', en: 'currency' },
          { page: 'datapack/json/curse', zh: 'curse（诅咒）', en: 'curse' },
          { page: 'datapack/json/element', zh: 'element（元素）', en: 'element' },
          { page: 'datapack/json/element_reaction', zh: '元素反应', en: 'Element Reactions' },
          { page: 'datapack/json/forging_blueprint', zh: 'forging_blueprint（锻造图纸）', en: 'forging_blueprint' },
          { page: 'datapack/json/forging_method', zh: 'forging_method（锻造手法）', en: 'forging_method' },
          { page: 'datapack/json/formation', zh: 'formation（阵法）', en: 'formation' },
          { page: 'datapack/json/item_aura', zh: 'item_aura（物品灵气）', en: 'item_aura' },
          { page: 'datapack/json/item_binding', zh: 'item_binding（物品绑定）', en: 'item_binding' },
          { page: 'datapack/json/physique', zh: 'physique（体质）', en: 'physique' },
          { page: 'datapack/json/pill_binding', zh: 'pill_binding（丹药绑定）', en: 'pill_binding' },
          { page: 'datapack/json/quality', zh: 'quality（品质）', en: 'quality' },
          { page: 'datapack/json/quality_chain', zh: 'quality_chain（品质链条）', en: 'quality_chain' },
          { page: 'datapack/json/secret_realm', zh: 'secret_realm（秘境）', en: 'secret_realm' },
          { page: 'datapack/json/realm_stage', zh: 'realm_stage（境界阶段）', en: 'realm_stage' },
          { page: 'datapack/json/resource', zh: 'resource（资源）', en: 'resource' },
          { page: 'datapack/json/skill_stage', zh: 'skill_stage（技能水平）', en: 'skill_stage' },
          { page: 'datapack/json/spirit_crafting', zh: 'spirit_crafting（灵气合成）', en: 'spirit_crafting' },
          { page: 'datapack/json/spirit_herb', zh: 'spirit_herb（灵植）', en: 'spirit_herb' },
          { page: 'datapack/json/spirit_root', zh: 'spirit_root（灵根）', en: 'spirit_root' },
          { page: 'datapack/json/talisman', zh: 'talisman（符箓）', en: 'talisman' },
          { page: 'datapack/json/technique', zh: 'technique（功法）', en: 'technique' },
          { page: 'datapack/json/technique_binding', zh: 'technique_binding（功法绑定）', en: 'technique_binding' },
          { page: 'datapack/json/tool_binding', zh: 'tool_binding（工具绑定）', en: 'tool_binding' },
          { page: 'datapack/json/tribulation', zh: 'tribulation（天劫）', en: 'tribulation' },
          { page: 'datapack/json/trigger', zh: 'trigger（事件规则）', en: 'trigger' },
          { page: 'datapack/json/weapon_binding', zh: 'weapon_binding（武器绑定）', en: 'weapon_binding' }
        ]
      },
      {
        text: { zh: '类型参考', en: 'Type Reference' },
        items: [
          { page: 'datapack/types/index', zh: '类型参考总览', en: 'Type Reference' },
          {
            text: { zh: '行为（Action）', en: 'Actions' },
            items: [
              { page: 'datapack/types/action/entity_action_types', zh: '实体行为', en: 'Entity Actions' },
              { page: 'datapack/types/action/bientity_action_types', zh: '双实体行为', en: 'Bi-entity Actions' },
              { page: 'datapack/types/action/block_action_types', zh: '方块行为', en: 'Block Actions' },
              { page: 'datapack/types/action/item_action_types', zh: '物品行为', en: 'Item Actions' }
            ]
          },
          {
            text: { zh: '条件（Condition）', en: 'Conditions' },
            items: [
              { page: 'datapack/types/condition/entity_condition_types', zh: '实体条件', en: 'Entity Conditions' },
              { page: 'datapack/types/condition/bientity_condition_types', zh: '双实体条件', en: 'Bi-entity Conditions' },
              { page: 'datapack/types/condition/block_condition_types', zh: '方块条件', en: 'Block Conditions' },
              { page: 'datapack/types/condition/item_condition_types', zh: '物品条件', en: 'Item Conditions' },
              { page: 'datapack/types/condition/damage_condition_types', zh: '伤害条件', en: 'Damage Conditions' }
            ]
          },
          { page: 'datapack/types/formula_variables', zh: '公式变量', en: 'Formula Variables' },
          { page: 'datapack/types/number_provider_types', zh: '数值提供器', en: 'Number Providers' },
          { page: 'datapack/types/shared_data_types', zh: '共享数据类型', en: 'Shared Data Types' },
          {
            page: 'datapack/types/other_types',
            zh: '其他类型族',
            en: 'Other Type Families',
            items: [
              { page: 'datapack/types/other/trigger-and-cost', zh: '触发器与消耗类型', en: 'Trigger and Cost Types' },
              { page: 'datapack/types/other/ability-and-curse', zh: '技能、状态与诅咒类型', en: 'Ability, State and Curse Types' },
              { page: 'datapack/types/other/resource-bar', zh: '资源条与灵气类型', en: 'Resource Bar and Aura Types' },
              {
                page: 'datapack/types/other/formation-and-matcher',
                zh: '阵法、时间线与匹配器类型',
                en: 'Formation, Timeline and Matcher Types'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    text: { zh: 'KubeJS', en: 'KubeJS' },
    items: [
      { page: 'kubejs/index', zh: '总览', en: 'Overview' },
      { page: 'kubejs/items', zh: '物品与绑定', en: 'Items and Bindings' },
      {
        // The reference page is the group's entry; every API surface is a sub-page, one per global object.
        page: 'kubejs/api-reference',
        zh: 'API 参考',
        en: 'API Reference',
        items: [
          { page: 'kubejs/api/actions', zh: 'MxtActions', en: 'MxtActions' },
          { page: 'kubejs/api/conditions', zh: 'MxtConditions', en: 'MxtConditions' },
          { page: 'kubejs/api/values', zh: 'MxtValues', en: 'MxtValues' },
          { page: 'kubejs/api/costs', zh: 'MxtCosts', en: 'MxtCosts' },
          { page: 'kubejs/api/resources', zh: 'MxtResources', en: 'MxtResources' },
          { page: 'kubejs/api/abilities', zh: 'MxtAbilities', en: 'MxtAbilities' },
          { page: 'kubejs/api/cultivation', zh: 'MxtCultivation', en: 'MxtCultivation' },
          { page: 'kubejs/api/curses', zh: 'MxtCurses', en: 'MxtCurses' },
          { page: 'kubejs/api/aura', zh: 'MxtAura', en: 'MxtAura' },
          { page: 'kubejs/api/elements', zh: 'MxtElements', en: 'MxtElements' },
          { page: 'kubejs/api/spirit_roots', zh: 'MxtSpiritRoots', en: 'MxtSpiritRoots' },
          { page: 'kubejs/api/physiques', zh: 'MxtPhysiques', en: 'MxtPhysiques' },
          { page: 'kubejs/api/quality', zh: 'MxtQuality', en: 'MxtQuality' },
          { page: 'kubejs/api/souls', zh: 'MxtSouls', en: 'MxtSouls' },
          { page: 'kubejs/api/triggers', zh: 'MxtTriggers', en: 'MxtTriggers' },
          { page: 'kubejs/api/loot', zh: 'MxtLoot', en: 'MxtLoot' },
          { page: 'kubejs/api/events', zh: 'MxtEvents', en: 'MxtEvents' }
        ]
      },
      { page: 'kubejs/examples', zh: '示例', en: 'Examples' }
    ]
  },
  {
    text: { zh: 'Java API', en: 'Java API' },
    items: [
      { page: 'java/index', zh: '总览', en: 'Overview' },
      { page: 'java/registries', zh: '注册表与数据表', en: 'Registries and Data Tables' },
      { page: 'java/api', zh: '公开 API', en: 'Public API' },
      { page: 'java/interfaces', zh: '接口', en: 'Interfaces' },
      { page: 'java/network', zh: '网络协议', en: 'Network Protocol' },
      { page: 'java/screens', zh: '客户端界面', en: 'Client Screens' },
      { page: 'java/wheel', zh: '轮盘条目', en: 'Wheel Entries' },
      { page: 'java/information-panel', zh: '人物信息面板', en: 'Information Panel' }
    ]
  },
  {
    // The last category on purpose: these pages are source-level explanations of how a
    // subsystem is built, not recipes for using it. `page` is required, so the sidebar
    // entry and the link target are always the same file.
    text: { zh: '技术细节', en: 'Technical Details' },
    items: [
      { page: 'technical/index', zh: '总览', en: 'Overview' },
      { page: 'technical/damage', zh: '伤害系统', en: 'Damage System' },
      { page: 'technical/identification', zh: '敌我识别系统', en: 'Foe Identification' },
      { page: 'technical/aura', zh: '灵气计算', en: 'Aura Calculation' }
    ]
  }
]

/** Every page path in the spec, in sidebar order. */
export function allPages() {
  const out = []
  const walk = (items) => {
    for (const item of items) {
      if (item.page) out.push(item.page)
      if (item.items) walk(item.items)
    }
  }
  walk(sections)
  return out
}

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
      { page: 'player-guide/lifespan', zh: '寿元', en: 'Lifespan' },
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
          { page: 'player-guide/commands/lifespan', zh: '/lifespan', en: '/lifespan' },
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
      // The server configuration is its own page rather than a section of the command page:
      // configuration entries are not commands, and every tab lives here.
      { page: 'player-guide/config', zh: '服务端配置', en: 'Server Configuration' },
      { page: 'player-guide/curios-slots', zh: 'Curios 槽位', en: 'Curios Slots' },
      { page: 'player-guide/rift', zh: '裂隙', en: 'Rifts' }
    ]
  },
  {
    text: { zh: '开发教程', en: 'Tutorials' },
    items: [
      { page: 'tutorial/index', zh: '教程', en: 'Tutorials' },
      { page: 'tutorial/add-an-ability', zh: '定义技能', en: 'Define an Ability' },
      { page: 'tutorial/define-a-technique', zh: '定义功法与晋级', en: 'Define a Technique and Its Levels' },
      // The dual cultivation page is a follow-up to the aura tutorial and only uses what that
      // one built, so it hangs under it as a child; the parent stays a link to its own page.
      {
        page: 'tutorial/define-aura-and-realms',
        zh: '定义灵气与境界',
        en: 'Define Aura and Realms',
        items: [
          { page: 'tutorial/dual-cultivation', zh: '编写双修功法', en: 'Write a Dual Cultivation Method' }
        ]
      },
      { page: 'tutorial/define-spirit-roots-and-physiques', zh: '定义灵根与体质', en: 'Define Spirit Roots and Physiques' },
      { page: 'tutorial/aura-environment', zh: '定义灵气环境', en: 'Define the Aura Environment' },
      // The binding page is the deep dive into the four tables' hooks, so it hangs under the item
      // tutorial the same way dual cultivation hangs under the aura one.
      {
        page: 'tutorial/create-items-with-kubejs',
        zh: 'KubeJS 创建物品并绑定行为',
        en: 'Create Items and Bind Actions with KubeJS',
        items: [
          { page: 'tutorial/bind-actions', zh: 'KubeJS 绑定行为', en: 'Bind Actions with KubeJS' }
        ]
      },
      { page: 'tutorial/define-a-quality-chain', zh: '定义品质链', en: 'Define a Quality Chain' },
      { page: 'tutorial/define-a-formation', zh: '定义阵法', en: 'Define a Formation' },
      { page: 'tutorial/open-a-realm', zh: '定义秘境', en: 'Define a Secret Realm' },
      { page: 'tutorial/inscribe-a-talisman', zh: '定义符箓', en: 'Define a Talisman' },
      { page: 'tutorial/bring-down-a-tribulation', zh: '定义天劫', en: 'Define a Tribulation' },
      { page: 'tutorial/define-a-curse', zh: '定义诅咒', en: 'Define a Curse' },
      { page: 'tutorial/forge-a-treasure', zh: '锻造法器', en: 'Forge a Treasure' },
      // Deliberately a placeholder: the page lists what the alchemy system is made of and is honest
      // about the tutorial not being written yet, so the sidebar slot exists before the content does.
      { page: 'tutorial/refine-a-pill', zh: '炼制丹药', en: 'Refine a Pill' },
      { page: 'tutorial/contract-a-beast', zh: '契约灵兽', en: 'Contract a Beast' },
      // Storage and the flying mount are both follow-ups to this page and hang under it as children, the
      // same way dual cultivation hangs under the aura one; the parent stays a link to its own page.
      {
        page: 'tutorial/storage-and-spirit-vessels',
        zh: '储物与灵器',
        en: 'Storage and Spirit Vessels',
        items: [
          { page: 'tutorial/storage', zh: '储物', en: 'Storage' },
          { page: 'tutorial/flying-mount', zh: '飞行法器', en: 'Flying Mounts' }
        ]
      },
      { page: 'tutorial/rifts', zh: '裂隙', en: 'Rifts' }
    ]
  },
  {
    text: { zh: '数据包', en: 'Datapack' },
    items: [
      { page: 'datapack/overview', zh: '总览', en: 'Overview' },
      { page: 'datapack/examples', zh: '示例', en: 'Examples' },
      { page: 'datapack/loot-and-criteria', zh: '战利品与进度条件', en: 'Loot and Advancement Criteria' },
      {
        // The shared families (actions, conditions, costs…) belong to no single definition, so
        // they get a chapter of their own, ahead of the JSON one; a family owned by exactly one
        // definition hangs under that definition's page instead.
        text: { zh: '类型参考', en: 'Type Reference' },
        items: [
          { page: 'datapack/types/index', zh: '类型参考总览', en: 'Type Reference' },
          {
            text: { zh: '行为（Action）', en: 'Actions' },
            items: [
              { page: 'datapack/types/action/entity_action_types', zh: 'entity_action_type（实体行为）', en: 'Entity Actions (entity_action_type)' },
              { page: 'datapack/types/action/bientity_action_types', zh: 'bientity_action_type（双实体行为）', en: 'Bi-entity Actions (bientity_action_type)' },
              { page: 'datapack/types/action/block_action_types', zh: 'block_action_type（方块行为）', en: 'Block Actions (block_action_type)' },
              { page: 'datapack/types/action/item_action_types', zh: 'item_action_type（物品行为）', en: 'Item Actions (item_action_type)' }
            ]
          },
          {
            text: { zh: '条件（Condition）', en: 'Conditions' },
            items: [
              { page: 'datapack/types/condition/entity_condition_types', zh: 'entity_condition_type（实体条件）', en: 'Entity Conditions (entity_condition_type)' },
              { page: 'datapack/types/condition/bientity_condition_types', zh: 'bientity_condition_type（双实体条件）', en: 'Bi-entity Conditions (bientity_condition_type)' },
              { page: 'datapack/types/condition/block_condition_types', zh: 'block_condition_type（方块条件）', en: 'Block Conditions (block_condition_type)' },
              { page: 'datapack/types/condition/item_condition_types', zh: 'item_condition_type（物品条件）', en: 'Item Conditions (item_condition_type)' },
              { page: 'datapack/types/condition/damage_condition_types', zh: 'damage_condition_type（伤害条件）', en: 'Damage Conditions (damage_condition_type)' }
            ]
          },
          { page: 'datapack/types/formula_variables', zh: 'formula_variable（公式变量）', en: 'Formula Variables (formula_variable)' },
          { page: 'datapack/types/number_provider_types', zh: 'number_provider_type（数值提供器）', en: 'Number Providers (number_provider_type)' },
          { page: 'datapack/types/shared_data_types', zh: '共享数据类型', en: 'Shared Data Types' },
          // The item matcher and the cost family are written all over a pack too, so they sit
          // here as well rather than under one definition page.
          { page: 'datapack/types/other/cost-type', zh: 'cost_type（消耗）', en: 'Costs (cost_type)' },
          { page: 'datapack/types/other/item-matcher', zh: 'item_matcher_entry_type（物品匹配器）', en: 'Item Matcher (item_matcher_entry_type)' }
        ]
      },
      {
        text: { zh: 'JSON 数据格式', en: 'JSON Data Formats' },
        items: [
          { page: 'datapack/json/index', zh: '注册表总览', en: 'Registry Overview' },
          {
            // Recipes are not datapack registries: the vanilla RecipeManager loads them, `/reload`
            // refreshes them, and their files live in `data/<namespace>/recipe/`. They get a group
            // of their own so the registry overview above lists exactly the registries.
            text: { zh: '合成表', en: 'Recipes' },
            items: [
              { page: 'datapack/json/alchemy_recipe', zh: 'alchemy_recipe（炼丹配方）', en: 'alchemy_recipe' },
              { page: 'datapack/json/spirit_crafting', zh: 'spirit_crafting（灵气合成）', en: 'spirit_crafting' },
              { page: 'datapack/json/talisman_drawing', zh: 'talisman_drawing（画符配方）', en: 'Talisman Drawing (talisman_drawing)' }
            ]
          },
          {
            page: 'datapack/json/ability',
            zh: 'ability（技能）',
            en: 'ability',
            // A type page hangs under the definition page that writes the field, so the reader
            // meets it right below the JSON page's own entry.
            items: [
              { page: 'datapack/types/other/ability', zh: 'ability_type（技能类型）', en: 'Ability Types (ability_type)' },
              { page: 'datapack/types/other/ability-selector', zh: 'ability_target_selector_type（技能目标选择器）', en: 'Ability Target Selectors (ability_target_selector_type)' },
              { page: 'datapack/types/other/data-storage', zh: 'data_storage_type（数据存储）', en: 'Data Storage (data_storage_type)' },
              { page: 'datapack/types/other/mount-render', zh: 'mount_render_type（载具渲染器）', en: 'Mount Renderers (mount_render_type)' }
            ]
          },
          { page: 'datapack/json/alchemy_furnace', zh: 'alchemy_furnace（炉型）', en: 'alchemy_furnace' },
          { page: 'datapack/json/alchemy_wall_material', zh: 'alchemy_wall_material（炉壁材料）', en: 'alchemy_wall_material' },
          { page: 'datapack/json/heat_source', zh: 'heat_source（供热方块）', en: 'heat_source' },
          { page: 'datapack/json/artifact', zh: 'artifact（法器）', en: 'artifact' },
          { page: 'datapack/json/aura', zh: 'aura（灵气）', en: 'aura' },
          {
            page: 'datapack/json/aura_zone',
            zh: 'aura_zone（灵气区域）',
            en: 'aura_zone',
            items: [
              { page: 'datapack/types/other/aura-maximum', zh: 'aura_maximum_type（环境上限）', en: 'Aura Maximum (aura_maximum_type)' }
            ]
          },
          { page: 'datapack/json/block_aura', zh: 'block_aura（方块灵气）', en: 'block_aura' },
          { page: 'datapack/json/blueprint_binding', zh: 'blueprint_binding（图纸绑定）', en: 'blueprint_binding' },
          { page: 'datapack/json/contract_type', zh: 'contract_type（契约类型）', en: 'contract_type' },
          { page: 'datapack/json/creature_profile', zh: 'creature_profile（生物档案）', en: 'creature_profile' },
          { page: 'datapack/json/cultivation', zh: 'cultivation（修炼方式）', en: 'cultivation' },
          { page: 'datapack/json/currency', zh: 'currency（货币）', en: 'currency' },
          {
            page: 'datapack/json/curse',
            zh: 'curse（诅咒）',
            en: 'curse',
            items: [
              { page: 'datapack/types/other/curse', zh: 'curse_type（诅咒类型）', en: 'Curse Types (curse_type)' }
            ]
          },
          { page: 'datapack/json/element', zh: 'element（元素）', en: 'element' },
          { page: 'datapack/json/element_reaction', zh: 'element_reaction（元素反应）', en: 'Element Reactions' },
          { page: 'datapack/json/forging_blueprint', zh: 'forging_blueprint（锻造图纸）', en: 'forging_blueprint' },
          { page: 'datapack/json/forging_method', zh: 'forging_method（锻造手法）', en: 'forging_method' },
          {
            page: 'datapack/json/formation',
            zh: 'formation（阵法）',
            en: 'formation',
            items: [
              { page: 'datapack/types/other/formation-action', zh: 'formation_action_type（阵法功能）', en: 'Formation Actions (formation_action_type)' }
            ]
          },
          { page: 'datapack/json/item_aura', zh: 'item_aura（物品灵气）', en: 'item_aura' },
          { page: 'datapack/json/item_binding', zh: 'item_binding（物品绑定）', en: 'item_binding' },
          { page: 'datapack/json/medicinal_property', zh: 'medicinal_property（药性）', en: 'medicinal_property' },
          { page: 'datapack/json/physique', zh: 'physique（体质）', en: 'physique' },
          { page: 'datapack/json/pill', zh: 'pill（丹药）', en: 'pill' },
          { page: 'datapack/json/pill_binding', zh: 'pill_binding（丹药绑定）', en: 'pill_binding' },
          { page: 'datapack/json/quality', zh: 'quality（品质）', en: 'quality' },
          {
            page: 'datapack/json/secret_realm',
            zh: 'secret_realm（秘境）',
            en: 'secret_realm',
            items: [
              { page: 'datapack/types/other/secret-realm-generation', zh: 'secret_realm_generation_type（秘境生成方式）', en: 'Secret Realm Generations (secret_realm_generation_type)' }
            ]
          },
          { page: 'datapack/json/realm_stage', zh: 'realm_stage（境界阶段）', en: 'realm_stage' },
          {
            page: 'datapack/json/resource',
            zh: 'resource（资源）',
            en: 'resource',
            items: [
              { page: 'datapack/types/other/resource-bar-context', zh: 'resource_bar_context（资源条上下文）', en: 'Resource Bar Contexts (resource_bar_context)' },
              { page: 'datapack/types/other/resource-bar-render', zh: 'resource_bar_render_data_type（资源条绘制器）', en: 'Resource Bar Renderers (resource_bar_render_data_type)' },
              { page: 'datapack/types/other/resource-bar-visibility', zh: 'resource_bar_visibility_type（资源条显示条件）', en: 'Resource Bar Visibility (resource_bar_visibility_type)' },
              { page: 'datapack/types/other/resource-value-provider', zh: 'resource_value_provider_type（资源数值来源）', en: 'Resource Value Providers (resource_value_provider_type)' }
            ]
          },
          { page: 'datapack/json/progression', zh: 'progression（进度链）', en: 'progression' },
          { page: 'datapack/json/spirit_herb', zh: 'spirit_herb（灵植）', en: 'spirit_herb' },
          { page: 'datapack/json/spirit_root', zh: 'spirit_root（灵根）', en: 'spirit_root' },
          { page: 'datapack/json/talisman', zh: 'talisman（符箓）', en: 'talisman' },
          { page: 'datapack/json/technique', zh: 'technique（功法）', en: 'technique' },
          { page: 'datapack/json/technique_binding', zh: 'technique_binding（功法绑定）', en: 'technique_binding' },
          { page: 'datapack/json/tool_binding', zh: 'tool_binding（工具绑定）', en: 'tool_binding' },
          {
            page: 'datapack/json/tribulation',
            zh: 'tribulation（天劫）',
            en: 'tribulation',
            items: [
              { page: 'datapack/types/other/timeline-entry', zh: 'timeline_entry_type（天劫节拍）', en: 'Timeline Entries (timeline_entry_type)' }
            ]
          },
          {
            page: 'datapack/json/trigger',
            zh: 'trigger（事件规则）',
            en: 'trigger',
            items: [
              { page: 'datapack/types/other/trigger-type', zh: 'trigger_type（触发器）', en: 'Triggers (trigger_type)' }
            ]
          },
          { page: 'datapack/json/weapon_binding', zh: 'weapon_binding（武器绑定）', en: 'weapon_binding' }
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
          { page: 'kubejs/api/techniques', zh: 'MxtTechniques', en: 'MxtTechniques' },
          { page: 'kubejs/api/progression', zh: 'MxtProgression', en: 'MxtProgression' },
          { page: 'kubejs/api/quality', zh: 'MxtQuality', en: 'MxtQuality' },
          { page: 'kubejs/api/souls', zh: 'MxtSouls', en: 'MxtSouls' },
          { page: 'kubejs/api/lifespan', zh: 'MxtLifespan', en: 'MxtLifespan' },
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
      {
        // The overview is the group's entry; one sub-page per interface, grouped by what the
        // interface is for, so the Java chapter does not pile every type onto one page.
        page: 'java/interfaces',
        zh: '接口',
        en: 'Interfaces',
        items: [
          {
            text: { zh: '灵气存取', en: 'Aura Storage' },
            items: [
              { page: 'java/interfaces/aura/aura-access', zh: 'AuraAccess', en: 'AuraAccess' },
              { page: 'java/interfaces/aura/item-aura-access', zh: 'ItemAuraAccess', en: 'ItemAuraAccess' },
              { page: 'java/interfaces/aura/use-item-aura-access', zh: 'UseItemAuraAccess', en: 'UseItemAuraAccess' }
            ]
          },
          {
            text: { zh: '生物契约', en: 'Creature Contracts' },
            items: [
              { page: 'java/interfaces/creature/contractable', zh: 'Contractable', en: 'Contractable' },
              { page: 'java/interfaces/creature/contract-operations', zh: 'ContractOperations', en: 'ContractOperations' },
              { page: 'java/interfaces/creature/capture-listener', zh: 'CaptureListener', en: 'CaptureListener' },
              { page: 'java/interfaces/creature/perchable', zh: 'Perchable', en: 'Perchable' }
            ]
          },
          {
            text: { zh: '轮盘与按键', en: 'Wheel and Keys' },
            items: [
              { page: 'java/interfaces/wheel/wheel-menu-entry', zh: 'WheelMenuEntry', en: 'WheelMenuEntry' },
              { page: 'java/interfaces/wheel/wheel-source', zh: 'WheelSource', en: 'WheelSource' },
              { page: 'java/interfaces/wheel/wheel-entry-kind', zh: 'WheelEntryKind', en: 'WheelEntryKind' },
              { page: 'java/interfaces/wheel/togglable', zh: 'Togglable', en: 'Togglable' }
            ]
          },
          {
            text: { zh: '定义与消耗', en: 'Definitions and Costs' },
            items: [
              { page: 'java/interfaces/definition/named-definition', zh: 'NamedDefinition', en: 'NamedDefinition' },
              { page: 'java/interfaces/definition/cost', zh: 'Cost', en: 'Cost' },
              { page: 'java/interfaces/definition/tooltip-appender', zh: 'TooltipAppender', en: 'TooltipAppender' }
            ]
          },
          {
            text: { zh: '炼丹', en: 'Alchemy' },
            items: [
              { page: 'java/interfaces/alchemy/alchemy-heat-source', zh: 'AlchemyHeatSource', en: 'AlchemyHeatSource' },
              { page: 'java/interfaces/alchemy/alchemy-workstation', zh: 'AlchemyWorkstation', en: 'AlchemyWorkstation' }
            ]
          },
          {
            text: { zh: '载具', en: 'Mounts' },
            items: [
              { page: 'java/interfaces/mount/renderer', zh: 'MountRenderer', en: 'MountRenderer' },
              { page: 'java/interfaces/mount/vehicle', zh: 'MountVehicle', en: 'MountVehicle' }
            ]
          }
        ]
      },
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
      { page: 'technical/data-loading', zh: '数据加载', en: 'Data Loading' },
      { page: 'technical/damage', zh: '伤害系统', en: 'Damage System' },
      { page: 'technical/identification', zh: '敌我识别系统', en: 'Foe Identification' },
      { page: 'technical/aura', zh: '灵气计算', en: 'Aura Calculation' },
      { page: 'technical/ability', zh: '技能施放', en: 'Ability Casting' },
      { page: 'technical/talisman-scoring', zh: '画符判分', en: 'Talisman Scoring' }
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

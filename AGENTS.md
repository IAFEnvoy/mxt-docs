# AGENTS.md —— 用 AI 维护 MiXianTu 文档站

本文件是这个仓库（`mxt-docs`，MiXianTu 的玩家文档站）给 AI 协作者与人类贡献者的**入口约定**。
更细的机制说明（Mermaid 接法、部署到 Cloudflare Pages、迁移脚本怎么拆页）在 [`README.md`](README.md) 里，本文件只讲"怎么干活、哪些红线不能碰"。

模组本体在**另一个仓库**：<https://github.com/Nova-Committee/MiXianTu> —— 本站不包含它，也不假设它被克隆在哪里。文档里写的字段、命令、配置名都以那边**当前代码**为准。

> 别把"另一个仓库的 `docs/`"和本站搞混：那个仓库里也有一个 `docs/`，是**中文、作者向**的开发文档（Docusaurus 风格，字段级权威 `docs/数据包格式.md`，设计稿另在它的 `research/`）；本站是**面向玩家**的中英双语站点。两边的内容要同步，但**不要在这里改那边的文件，也不要把那边的长文整篇抄过来**。

## 0. 五分钟上手

1. `pnpm install`，然后 `pnpm run dev` 本地预览（<http://localhost:5173>）。
2. **改一页就要改两份**：`docs/` 是中文（站点根路径），`docs/en/` 是英文镜像，文件名与目录层级一一对应。
3. 新增页面必须登记到 `docs/.vitepress/locales/pages.mjs`，否则侧边栏不会出现它。
4. 交活之前跑第 2 节的检查（至少 `check:i18n` + `check:links`，收尾跑 `build`）。
5. 汇报时说清三件事：改了什么、检查结果（贴数字）、**哪些没跑**。

## 1. 铁律

1. **中英成对。** `docs/` 与 `docs/en/` 的页面集合必须相同，`pnpm run check:i18n` 报 0 缺口是底线。英文页是**自然的英文**，不是逐字直译；两边标题层级保持一致。
2. **不写死本机路径。** 正文与脚本里都不出现盘符开头的绝对路径（也不出现 `/Users/...`、`/home/...` 这类）；不假设本站与模组仓库的相对位置，需要模组仓库的脚本一律走 `scripts/repos.mjs`（`MXT_REPO` 优先，其次自动发现）。
3. **不写死模组版本号。** 版本以模组仓库的 `gradle.properties` / 玩家装的那份 Jar 为准；平台与依赖版本（Minecraft / NeoForge / Curios / KubeJS）可以写。
4. **不要自行 `git commit` / `git push`。** 也不要回滚或重排别人未提交的改动。
5. **状态要诚实。** 「完成 / 制作中 / 预留」只能由模组代码事实支撑：没实现的东西明说没实现（例：炼丹配方格式已定稿，但炼丹台还没开始做），设计稿里的东西不能写成"可用"。
6. **不发明字段。** 字段、命令、配置名一律照模组仓库的代码与 `docs/数据包格式.md` 核对后再写；拿不准就标"以当前 Codec 为准"。
7. **配置项按游戏内界面写。** 只写「服务端配置「标签页 → 条目」」或「客户端配置「标签页 → 条目」」，名字取自模组语言文件；**不写** `config/xxx.json` 这类文件路径，也不写原始键。`pnpm run check:config` 会逐字比对。
8. **不换 Mermaid 方案。** 它由本站自己的三个文件接起（见 README），曾经装过的第三方插件会把 dev 打崩。

## 2. 命令

| 用途 | 命令 | 说明 |
| --- | --- | --- |
| 本地预览 | `pnpm install` → `pnpm run dev` | 默认 <http://localhost:5173>。 |
| 构建 | `pnpm run build` | 等价于 `vitepress build docs`；产物在 `docs/.vitepress/dist/`。**别**在仓库根直接跑 `npx vitepress build`。 |
| 预览产物 | `pnpm run preview` | |
| 中英对齐 | `pnpm run check:i18n`（`-- --strict`） | 列出只有中文或只有英文的页面。 |
| 站内链接 | `pnpm run check:links`（`-- --strict`） | 校验链接与 `#锚点`。 |
| 配置名 | `pnpm run check:config` | 需要读模组仓库的语言文件，见下。 |
| 一次性迁移 | `pnpm run migrate` | 会**重写**它自己生成过的页面；只在你确实要重来时跑。 |

`check:config` 与 `migrate` 需要模组仓库（本站不含它）：默认自动发现，找不到会明确告诉你该设什么，也可以直接指定。

```bash
MXT_REPO=/path/to/MiXianTu pnpm run check:config
MXT_EN_DOCS=/path/to/old-docs MXT_ZH_DOCS=/path/to/MiXianTu/docs pnpm run migrate
```

## 3. 结构与改动落点

| 要改什么 | 去哪 |
| --- | --- |
| 页面本体 | `docs/<路径>.md` + `docs/en/<同一路径>.md` |
| 导航、侧边栏、分组 | `docs/.vitepress/locales/pages.mjs`（**全站页面清单，唯一结构来源**；`build.ts` 由它生成导航与整站侧边栏，缺失页自动过滤） |
| 语言包与界面文案 | `docs/.vitepress/locales/zh.ts` / `en.ts`、`docs/.vitepress/config.ts` |
| 配图 | `docs/public/images/<主题>/`（两种语言共用，引用写 `/images/...`） |
| 校验与迁移脚本 | `scripts/`（`check-*.mjs`、`migrate-docs.mjs`、`repos.mjs` 只管"外部仓库在哪"） |

两条容易踩的：

- **只把 `.md` 放进目录，侧边栏不会自己长出来。** 侧边栏是配置求值时生成的，`pnpm run dev` 只在 `config.ts` / `pages.mjs` 这类文件变化时重新求值——新页面登记进 `pages.mjs` 之后，必要时重启 dev。
- **`docs/.vitepress/` 必须在版本控制里。** `.gitignore` 里是 `/.vitepress/`（只忽略仓库根那个误建目录），别改成不带路径的写法，否则线上会得到没有侧边栏、没有语言切换的裸站点。

## 4. 写作约定

- **教程骨架**（中 / 英一一对应）：`## 你要搭建什么` → `## 第 N 步 —— …` → `## 在游戏里验证` → `## 常见错误` → `## 接下来`；英文为 `What You Are Building` / `Step N — …` / `Verify` / `Common Mistakes` / `Next`。
- **正文避免裸 `<` `>`**：页面经过 Vue 模板编译，写成普通文本的尖括号会被当成标签，轻则渲染错、重则构建失败。代码与 JSON 一律放进代码块。
- **表格短、解释放表格后**；代码块标语言；JSON 不给注释；长解释不要塞进单元格。
- **术语必须统一**（翻译时尤其注意）：符箓（`talisman`，**「符篆」是误用**，配套「符纸」「符笔」「符墨」）、灵气工作台（方块）+ **灵气合成**（它的配方族）、灵根、体质、功法、技能、技能水平、`resource`＝数值（不是"资源"当身份用）、`aura`＝灵气身份、行为（action）、条件（condition）。
- **状态用语**：完成 / 制作中 / 预留，别用营销词；研究文档里的设想不能写成已完成。
- **Mermaid**：源码要 `encodeURIComponent` 再进属性、`htmlLabels` 顶层与 `flowchart.*` 必须同时为 `true`、图在客户端绘制；点开可放大。三条约束的原因见 README，改之前先读。

## 5. 跨仓库同步

模组仓库改了东西，这里必须跟着改（**中英各一份**）：

| 模组侧改动 | 本站要改 |
| --- | --- |
| 数据包字段新增 / 改名 / 删除 | 对应的 `docs/datapack/json/<定义>.md`：字段表、示例、行为说明，以及受影响的 `docs/datapack/types/*` |
| 新命令 / 新配置项 | `docs/player-guide/commands*`（一个根命令一页）+ 相关功能页 + **`pages.mjs` 登记** |
| 公开 API / KubeJS 全局对象 | `docs/kubejs/*`（含 API 参考的概览表） |
| 数据包语义变化（例如某个倍率改由管线消费） | `docs/technical/*` + `docs/datapack/types/formula_variables.md` + 相关教程——**教程里的旧写法必须改掉**，否则读者照抄会重复相乘 |
| 模块完成度变化 | `docs/index.md` 功能表与相关页的状态措辞 |
| 类型 ID 增加 / 语义变化 | 该类型的"一览"页（条件、行为、触发器…） |

反向也成立：如果你在这里发现某条字段说明与代码不符，**权威在模组仓库**（`docs/数据包格式.md` 与定义本身），要回那边改，不要在文档站"就地编"一个说法。

## 6. 验证与汇报

交活前按改动范围跑：

```bash
pnpm run check:i18n      # 任何页面改动
pnpm run check:links     # 任何页面改动（新增链接/锚点必跑）
pnpm run check:config    # 动了命令页、配置名或模组语言文件
pnpm run build           # 收尾；构建后抽查 docs/.vitepress/dist/ 里有没有新内容
```

汇报用中文，按这个顺序：

1. **做了什么** —— 按页面/主题分点，带上文件路径。
2. **检查结果** —— 贴命令输出里的数字（页数、缺口数、构建耗时），比"没问题"有用。
3. **没跑的** —— 例如"没跑 dev 预览"、"没真跑 `migrate`（会重写页面）"。
4. **遗留与开放项** —— 有意不做的、发现的其它不一致、需要拍板的地方。

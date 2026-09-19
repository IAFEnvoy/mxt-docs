# MiXianTu 文档站（VitePress 多语言）

`E:\Website\mxt-docs` 是 MiXianTu（模组 ID `mxt`）的文档站，用 [VitePress](https://vitepress.dev/) 构建，
**中文（简体）是主语言，位于站点根路径**，英文镜像放在 `/en/` 下。两套文档的文件名与目录层级完全一致，
导航栏右上角由 VitePress 自动生成语言切换下拉框，不需要额外组件。

## 快速开始

```bash
pnpm install          # 安装依赖（首次会执行 esbuild 的 postinstall）
pnpm run dev          # 本地预览 http://localhost:5173
pnpm run build        # 构建全部语言页面到 docs/.vitepress/dist
pnpm run preview      # 预览构建产物
```

## 目录结构

```text
mxt-docs
├─ docs                     # VitePress 源目录（中文，站点根路径 /）
│  ├─ index.md              # 首页（手工维护）
│  ├─ installation.md       # 开始
│  ├─ datapack/             # 数据包：总览、伤害结算、示例、JSON 参考、类型参考
│  ├─ tutorial/             # 教程
│  ├─ player-guide/         # 游玩指南
│  ├─ kubejs/               # KubeJS
│  ├─ java/                 # Java API
│  ├─ en/                   # 英文镜像（与根目录一一对应，URL 带 /en/ 前缀）
│  ├─ public/               # logo、favicon 等静态资源（所有语言共用）
│  └─ .vitepress/
│     ├─ config.ts          # 公共配置 + locales 挂载
│     ├─ locales/
│     │  ├─ zh.ts           # 中文语言包：导航、侧边栏、界面文案
│     │  ├─ en.ts           # 英文语言包
│     │  ├─ build.ts       # 由页面清单生成导航与整站侧边栏树（自动过滤缺失页）
│     │  └─ pages.mjs       # 全站页面清单（唯一结构来源）
│     └─ theme/             # 默认主题 + 自定义样式
└─ scripts/
   ├─ migrate-docs.mjs      # 从两份既有文档生成站点内容
   ├─ check-i18n.mjs        # 列出只存在于单一语言的页面
   └─ check-links.mjs       # 校验站内链接与锚点
```

## 内容从哪里来

站点内容由两份既有文档生成，`pnpm run migrate` 负责搬运：

| 语言 | 来源 | 处理方式 |
| --- | --- | --- |
| 英文 | `E:\Website\docs\docs\mod\mxt`（Docusaurus） | 目录结构原样保留到 `docs/en/`，只转换 front matter 与 `:::note` 之类容器语法 |
| 中文 | `E:\Java\MiXianTu\docs`（Docusaurus） | 按目标结构重新组装：`数据包格式.md` 按注册表拆成 `docs/datapack/json/*.md`，各篇指南合并到对应页面 |

两点约定：

- **脚本只拥有它生成的页面。** 它把自己的产物记录在 `scripts/.migrated.json`，重跑时只覆盖这些文件；
  `KEEP` 名单（`docs/index.md`、`docs/player-guide/index.md`、`docs/installation.md`）与手工翻译的页面永远不动。
- **长页面会被拆成子页面。** `scripts/migrate-docs.mjs` 顶部的 `SPLITS` 声明「哪个页面的哪些 `##` 分节搬进
  哪个子页面」：父页**保留原路径**并变成该分组的索引，没搬走的内容留在原处，子页放在子目录里，于是在侧边栏
  形成二级目录。搬家时会重写相对链接的深度、把指向被搬走小节锚点的深链改指新页面、并把子页的标题层级提升到
  H2。每次改动只需改 `SPLITS` 与 `pages.mjs`，内容本身不重写。
- **命令页按根命令一页一条。** `COMMAND_PAGES` 把 `player-guide/commands` 的整张命令表按**根命令**（`/mxt`、
  `/aura`、`/formation`…）逐行分发到 `player-guide/commands/<根命令>.md`，并把 `/mxt lightning` 这类详情小节
  一并搬走；父页只剩说明与索引。带顶层别名的行跟随别名（`/mxt curse apply` → `/curse`），只有 `/mxt`
  子命令的行留在 `/mxt` 页。中文表原本缺 `/talisman` 的 4 行，由 `COMMAND_PAGES.supplements` 补齐。
- **索引页的「子页面」链接列表由页面清单生成。** `refreshGroupNav()` 依据 `pages.mjs` 给每个「自身是页面又有
  子页」的分组重建导航块（含二级小分组），所以侧边栏与索引页永远一致。
- **侧边栏按顶部大类分区。** 每个页面左侧只显示**当前大类**的目录（开始 / 游玩指南 / 开发教程 / 数据包 /
  KubeJS / Java API），由 VitePress 按路径前缀匹配最贴切的一份；大类内部的分组（如「JSON 数据格式」的 34 个
  注册表页、「类型参考」下的子分组）默认折叠，读者进入其中时由 VitePress 自动展开。
- **侧边栏按语言过滤。** `docs/.vitepress/locales/pages.mjs` 声明全站页面，`build.ts` 会检查文件是否存在，
  缺失的页面自动从该语言侧边栏消失，因此侧边栏不会指向 404。

## 校验

```bash
pnpm run check:i18n          # 列出只有中文或只有英文的页面（翻译待办）
pnpm run check:i18n -- --strict
pnpm run check:links         # 校验站内链接与 #锚点
pnpm run check:links -- --strict
pnpm run check:config        # 校验文档里的配置名与模组语言文件逐字一致
pnpm run build               # 构建失败会报告死链
```

## 配置类内容的写法

配置项只在**游戏内的配置界面**里修改（`模组列表 → 觅仙途 → 配置`：客户端设置 + 觅仙途服务端配置，
服务端配置需要 OP 且会同步给客户端）。因此文档里：

- **不写** `config/mxt-server.json` 之类的文件路径，也**不写**原始键（`formation.respect_friends`）；
- 一律写作 **「服务端配置「标签页 → 条目」」** 或 **「客户端配置「标签页 → 条目」」**，名字取自模组自己的
  语言文件（`src/main/resources/assets/mxt/lang/zh_cn.json` / `en_us.json`）；
- `pnpm run check:config` 会把这些名字与语言文件逐个比对，改名字后会立刻报错。

安装页（中英）里的「配置 / Configuration」一节是这条规则的正典说明，其他页面只引用标签页与条目名。

## 部署（Cloudflare Pages）

本站的 VitePress **源目录是 `docs/`**，而仓库根只是工程目录，所以 Pages 的构建设置必须指向 `docs`：

| 设置项 | 值 |
| --- | --- |
| Root directory（根目录） | 留空（即仓库根） |
| Build command（构建命令） | `pnpm run build`（等于 `vitepress build docs`） |
| Build output directory（输出目录） | `docs/.vitepress/dist` |
| Node / pnpm | 无需设置：`packageManager` 已锁 pnpm 11.5.2，Pages 自带的 Node 22 可用 |

**为什么不能写 `npx vitepress build`**：VitePress 的 CLI 不带目录参数时会把**当前目录**当作源目录，
于是页面路径全变成 `/docs/**`、`docs/.vitepress/config.ts` 也不会被加载，页内所有绝对链接
（`/installation`、`/datapack/json/element`…）统统变成死链，构建以
`[vitepress] 123 dead link(s) found` 失败。本地一条命令即可复现：

```bash
npx vitepress build        # ✗ 在仓库根执行：把仓库根当源目录，报一大堆 dead link
pnpm run build             # ✅ 等价于 vitepress build docs
```

> 注意 `.gitignore`：**不要**写不带路径的 `.vitepress`，那会连 `docs/.vitepress/`（配置、主题、语言包）
> 一起忽略，仓库里就没有配置文件了，线上会得到没有侧边栏、没有语言切换、没有搜索的裸站点。
> 现在文件里是 `/.vitepress/`（只忽略仓库根那个误建目录）。提交后可以这样确认：

```bash
git ls-files docs/.vitepress        # 应列出 config.ts、theme/、locales/ 等
```

## 已知情况

- 文档里的 ` ```mcfunction ` 代码块会以纯文本渲染：当前 VitePress 使用的 Shiki 没有内置 mcfunction 语法，
  构建时会打印 `The language 'mcfunction' is not loaded` 提示，不影响构建结果。
- 首屏 JS 体积超过 500 kB 的提示来自 VitePress 默认主题，与本项目的配置无关。
- **没有**开启「按浏览器语言自动跳转首页」：`docs/index.md` 保持中文首页，英文读者用导航栏的语言下拉框
  （或直接访问 `/en/`）切换。需要时可以在 `docs/index.md` 里加一段 `navigator.language` 判断的
  `<script setup>`，但那样会让中文主页在英文浏览器里被跳过。

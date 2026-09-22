import type { DefaultTheme } from 'vitepress'
import { buildNav, buildSidebars } from './build'

/**
 * Root locale: Simplified Chinese. Pages live directly under `docs/`, so their URLs
 * carry no prefix (`/datapack/overview`), while English pages live under `/en/`.
 */
const zh: DefaultTheme.LocaleConfig<any> = {
  label: '简体中文',
  lang: 'zh-CN',
  link: '/',
  title: '觅仙途文档',
  description:
    'MiXianTu（觅仙途，模组 ID：mxt）的安装、游玩、数据包、KubeJS 与 Java 开发文档。',
  themeConfig: {
    nav: buildNav('zh'),
    sidebar: buildSidebars('zh'),
    outline: { level: [2, 3], label: '本页目录' },
    langMenuLabel: '切换语言',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    externalLinkIcon: true,
    lastUpdated: { text: '最后更新于', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
    docFooter: { prev: '上一页', next: '下一页' },
    notFound: {
      title: '页面不存在',
      quote: '这里没有你要找的内容。可以换一个入口，或者回到文档首页。',
      linkLabel: '回到首页',
      linkText: '返回首页'
    },
    footer: {
      message: 'MiXianTu（觅仙途）是一个 NeoForge 修仙模组框架，本体只提供规则与运行时。',
      copyright: '文档内容随项目仓库一同发布'
    }
  }
}

export default zh

import type { DefaultTheme } from 'vitepress'
import { buildNav, buildSidebars } from './build'

/**
 * English locale, served from `/en/`. The page tree mirrors the Chinese one exactly:
 * a page that is missing here is also missing from this locale's sidebar.
 */
const en: DefaultTheme.LocaleConfig<any> = {
  label: 'English',
  lang: 'en-US',
  link: '/en/',
  title: 'MiXianTu Documentation',
  description:
    'Documentation for MiXianTu (mod id: mxt): installation, player content, datapack JSON formats, type reference, KubeJS and Java APIs.',
  themeConfig: {
    nav: buildNav('en'),
    sidebar: buildSidebars('en'),
    outline: { level: [2, 3], label: 'On this page' },
    langMenuLabel: 'Change language',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Return to top',
    externalLinkIcon: true,
    lastUpdated: { text: 'Last updated', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
    docFooter: { prev: 'Previous page', next: 'Next page' },
    notFound: {
      title: 'Page not found',
      quote: 'This page does not exist. Try another entry point or go back to the documentation home.',
      linkLabel: 'Go home',
      linkText: 'Back to home'
    },
    footer: {
      message: 'MiXianTu is a NeoForge cultivation mod framework; the mod itself ships rules and runtime only.',
      copyright: 'Documentation released with the project repository'
    }
  }
}

export default en

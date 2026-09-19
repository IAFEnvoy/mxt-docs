import { defineConfig } from 'vitepress'
import zh from './locales/zh'
import en from './locales/en'

export default defineConfig({
  // Shared configuration — every locale inherits these values.
  title: 'MiXianTu',
  description:
    'MiXianTu（觅仙途）文档：安装、游玩内容、数据包 JSON 格式、类型参考、KubeJS 与 Java 扩展 API。',
  lang: 'zh-CN',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['**/README.md'],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#5b8def' }]
  ],

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: false
  },

  themeConfig: {
    logo: '/logo.svg',
    // Shared defaults; each locale overrides the strings below with its own language.
    outline: { level: [2, 3] },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除查询条件',
                backButtonTitle: '返回',
                noResultsText: '无法找到相关结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'Esc'
                }
              }
            }
          },
          en: {
            translations: {
              button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
              modal: {
                displayDetails: 'Display detailed list',
                resetButtonTitle: 'Reset search',
                backButtonTitle: 'Back to previous search',
                noResultsText: 'No results found',
                footer: {
                  selectText: 'to select',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: 'to navigate',
                  navigateUpKeyAriaLabel: 'Up arrow',
                  navigateDownKeyAriaLabel: 'Down arrow',
                  closeText: 'to close',
                  closeKeyAriaLabel: 'Escape'
                }
              }
            }
          }
        }
      }
    }
  },

  // Chinese lives at the site root, English under /en/.
  locales: {
    root: zh,
    en
  }
})

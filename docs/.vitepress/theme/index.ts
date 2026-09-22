import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import Mermaid from './components/Mermaid.vue'
import ImageZoomLayer from './components/ImageZoomLayer.vue'

export default {
  ...DefaultTheme,
  // The layout wrapper exists for one reason: the layer that upgrades article figures to the shared
  // enlarged view has to be mounted once per page, and `layout-bottom` is the slot that renders on
  // every page without disturbing the theme's own structure.
  Layout() {
    return h(DefaultTheme.Layout, null, { 'layout-bottom': () => h(ImageZoomLayer) })
  },
  enhanceApp({ app }) {
    // 全局注册组件，名字必须和模板里 <Mermaid> 大小写完全一致
    app.component('Mermaid', Mermaid)
  }
}

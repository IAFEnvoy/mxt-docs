import DefaultTheme from 'vitepress/theme'
import Mermaid from './components/Mermaid.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // 全局注册组件，名字必须和模板里 <Mermaid> 大小写完全一致
    app.component('Mermaid', Mermaid)
  }
}

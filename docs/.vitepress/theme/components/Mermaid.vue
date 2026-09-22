<template>
  <div class="mermaid-wrap">
    <div
      ref="containerRef"
      class="mermaid-canvas"
      :title="text.hint"
      role="button"
      tabindex="0"
      :aria-label="text.hint"
      @click="open"
      @keydown.enter.prevent="open"
      @keydown.space.prevent="open"
    ></div>
    <span class="mermaid-badge" aria-hidden="true">{{ text.badge }}</span>
  </div>

  <!-- The enlargement is the shared viewer every figure uses: a floating card over a blurred page,
       zoomed with the wheel. The diagram is re-inserted there rather than moved, so the inline copy
       stays where it was and stays clickable. -->
  <ZoomViewer
    :open="viewer.open"
    :natural-width="rendered.width"
    :natural-height="rendered.height"
    :title="text.dialog"
    @close="close"
  >
    <div class="mermaid-zoom-canvas" v-html="viewer.svg"></div>
  </ZoomViewer>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useData } from 'vitepress'
import ZoomViewer from './ZoomViewer.vue'

const props = defineProps({
  // Percent-encoded diagram source: the fence handler in `.vitepress/config.ts` encodes it
  // so that quotes and newlines cannot break the attribute it travels in.
  code: {
    type: String,
    required: true
  }
})

const texts = {
  zh: {
    hint: '点击放大查看',
    badge: '点击放大 · 滚轮缩放',
    dialog: '图表放大查看'
  },
  en: {
    hint: 'Click to enlarge',
    badge: 'Click to enlarge · wheel to zoom',
    dialog: 'Enlarged diagram'
  }
}
const { isDark, lang } = useData()
const text = computed(() => (String(lang.value).startsWith('zh') ? texts.zh : texts.en))

const containerRef = ref(null)

/** The rendered SVG plus the size it was drawn at, which is what "100%" means. */
const rendered = reactive({ svg: '', width: 0, height: 0 })
const viewer = reactive({ open: false, svg: '' })

/** The intrinsic size of a rendered diagram: the viewBox mermaid wrote, `getBBox()` as a fallback. */
function measure(svg) {
  const viewBox = svg?.getAttribute('viewBox')?.split(/[\s,]+/).map(Number)
  if (viewBox?.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
    return { width: viewBox[2], height: viewBox[3] }
  }
  const box = svg?.getBBox?.()
  return { width: box?.width || 800, height: box?.height || 600 }
}

async function renderDiagram() {
  try {
    if (!containerRef.value) return
    const mermaidModule = await import('mermaid')
    const mermaid = mermaidModule.default
    if (!mermaid) return

    const source = decodeURIComponent(props.code)
    const renderId = `mermaid-${Math.random().toString(36).slice(2)}`
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: isDark.value ? 'dark' : 'default',
      // The same font stack the page body uses, so the diagram is measured with the font it
      // is painted with (measuring with one font and painting with another clips CJK text).
      fontFamily: "'Inter', 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif",
      // Both of these must stay `true`, and they must agree. Layout measures an HTML label by
      // its rendered box; with `flowchart.htmlLabels: false` the layout pass falls back to
      // SVG-text measurement while the renderer still emits a `<foreignObject>`, every label
      // then collapses to the 120px minimum, and the text stacks one character per line.
      htmlLabels: true,
      flowchart: {
        htmlLabels: true,
        // Longest label line in these pages is about 330px; raise the wrap width above it so
        // nothing wraps that was not wrapped on purpose with `<br/>`.
        wrappingWidth: 400
      }
    })
    const { svg } = await mermaid.render(renderId, source)
    containerRef.value.innerHTML = svg
    const element = containerRef.value.querySelector('svg')
    const size = measure(element)
    rendered.svg = svg
    rendered.width = size.width
    rendered.height = size.height
    if (viewer.open) viewer.svg = svg
  } catch (err) {
    console.error('Mermaid render error:', err)
    if (containerRef.value) {
      containerRef.value.innerHTML = `<pre style="color:red;white-space:pre-wrap;">图表渲染失败：${err.message}\n${decodeURIComponent(props.code)}</pre>`
    }
  }
}

function open() {
  if (!rendered.svg) return
  viewer.svg = rendered.svg
  viewer.open = true
}

function close() {
  viewer.open = false
  containerRef.value?.focus()
}

onMounted(renderDiagram)

watch(isDark, renderDiagram)
</script>

<style scoped>
.mermaid-wrap {
  position: relative;
  width: 100%;
  overflow: auto;
}

.mermaid-canvas {
  cursor: zoom-in;
}

.mermaid-canvas:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}

.mermaid-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 18px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.mermaid-wrap:hover .mermaid-badge,
.mermaid-canvas:focus-visible + .mermaid-badge {
  opacity: 1;
}

.mermaid-zoom-canvas {
  width: 100%;
  height: 100%;
}
</style>

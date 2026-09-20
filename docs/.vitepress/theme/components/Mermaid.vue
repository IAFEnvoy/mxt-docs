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

  <!-- The enlarged view is teleported to `body`: inside the article it would be clipped by the
       content column's stacking and overflow, and it has to cover the whole viewport. -->
  <Teleport to="body">
    <div
      v-if="viewer.open"
      ref="dialogRef"
      class="mermaid-viewer"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      @click.self="close"
      @keydown.esc.stop.prevent="close"
      @keydown.space.stop.prevent
    >
      <div class="mermaid-viewer-bar" @click.stop>
        <button type="button" :title="text.zoomOut" @click="zoomBy(1 / STEP)">−</button>
        <span class="mermaid-viewer-scale">{{ Math.round(viewer.scale * 100) }}%</span>
        <button type="button" :title="text.zoomIn" @click="zoomBy(STEP)">+</button>
        <button type="button" :title="text.reset" @click="resetZoom">↻</button>
        <button type="button" :title="text.close" @click="close">✕</button>
      </div>
      <div ref="stageRef" class="mermaid-viewer-stage" @click.self="close" @wheel="onWheel">
        <!-- The diagram is re-inserted rather than moved, so the inline copy stays where it was. -->
        <div class="mermaid-viewer-canvas" :style="canvasStyle" v-html="viewer.svg"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useData } from 'vitepress'
const { isDark, lang } = useData()

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
    hint: '点击查看大图',
    badge: '点击放大',
    zoomIn: '放大',
    zoomOut: '缩小',
    reset: '恢复原始大小',
    close: '关闭（Esc）'
  },
  en: {
    hint: 'Click to enlarge',
    badge: 'Click to enlarge',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset zoom',
    close: 'Close (Esc)'
  }
}
const text = computed(() => (String(lang.value).startsWith('zh') ? texts.zh : texts.en))

const containerRef = ref(null)
const dialogRef = ref(null)
const stageRef = ref(null)

/** The rendered SVG plus the size it was drawn at, which is what "100%" means. */
const rendered = reactive({ svg: '', width: 0, height: 0 })
const viewer = reactive({ open: false, scale: 1, svg: '' })

const MIN_SCALE = 0.25
const MAX_SCALE = 6
const STEP = 1.25

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
    // A diagram that was scaled down to fit the column is opened at its natural size, not at
    // whatever it happens to be displayed at.
    if (viewer.open) openViewer()
  } catch (err) {
    console.error('Mermaid render error:', err)
    if (containerRef.value) {
      containerRef.value.innerHTML = `<pre style="color:red;white-space:pre-wrap;">图表渲染失败：${err.message}\n${decodeURIComponent(props.code)}</pre>`
    }
  }
}

const canvasStyle = computed(() => ({
  width: `${Math.round(rendered.width * viewer.scale)}px`,
  height: `${Math.round(rendered.height * viewer.scale)}px`
}))

function openViewer() {
  viewer.svg = rendered.svg
  viewer.scale = 1
}

async function open() {
  if (!rendered.svg) return
  openViewer()
  viewer.open = true
  document.body.style.overflow = 'hidden'
  await nextTick()
  dialogRef.value?.focus()
  stageRef.value?.scrollTo({ top: 0, left: 0 })
}

function close() {
  viewer.open = false
  document.body.style.overflow = ''
  containerRef.value?.focus()
}

function zoomBy(factor) {
  zoomTo(viewer.scale * factor)
}

function zoomTo(scale) {
  const stage = stageRef.value
  // Keep the point under the middle of the viewport in place while the zoom changes.
  const centre = stage
    ? { x: (stage.scrollLeft + stage.clientWidth / 2) / viewer.scale, y: (stage.scrollTop + stage.clientHeight / 2) / viewer.scale }
    : null
  viewer.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
  if (stage && centre) {
    nextTick(() => {
      stage.scrollLeft = centre.x * viewer.scale - stage.clientWidth / 2
      stage.scrollTop = centre.y * viewer.scale - stage.clientHeight / 2
    })
  }
}

function resetZoom() {
  zoomTo(1)
}

function onWheel(event) {
  // Plain wheel scrolls the enlarged diagram; Ctrl/⌘ + wheel zooms, like a map.
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  zoomBy(event.deltaY < 0 ? STEP : 1 / STEP)
}

function onKeydown(event) {
  if (!viewer.open) return
  if (event.key === 'Escape') close()
  else if (event.key === '+' || event.key === '=') zoomBy(STEP)
  else if (event.key === '-') zoomBy(1 / STEP)
  else if (event.key === '0') resetZoom()
}

onMounted(() => {
  renderDiagram()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (viewer.open) document.body.style.overflow = ''
})

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

.mermaid-viewer {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
  outline: none;
}

.mermaid-viewer-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.mermaid-viewer-bar button {
  min-width: 36px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.mermaid-viewer-bar button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.mermaid-viewer-scale {
  min-width: 56px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.mermaid-viewer-stage {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.mermaid-viewer-canvas :deep(svg) {
  width: 100%;
  height: 100%;
  max-width: none;
}
</style>

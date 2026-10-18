<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

// Each tool is its own module so the page pays for the one it uses; `mount` only touches the DOM, so the import is
// side-effect free and the site can still be prerendered.
const tools = {
  'formation-figure': () => import('../tools/formation-figure.js'),
  'talisman-strokes': () => import('../tools/talisman-strokes.js')
}

const props = defineProps({
  /** The element id the tool fills, and the name of the module to mount. */
  tool: { type: String, required: true },
  host: { type: String, required: true }
})

const { lang } = useData()

let dispose = null

onMounted(async () => {
  const load = tools[props.tool]
  if (!load) return
  const { mount } = await load()
  const element = document.getElementById(props.host)
  // The editor's own strings live in `tools/messages/`; the site's locale picks which table it reads.
  const locale = String(lang.value).toLowerCase().startsWith('zh') ? 'zh' : 'en'
  dispose = mount(element, locale)?.dispose ?? null
})

// The site is a single-page app: leaving the page has to unhook the listeners the tool put on document and window.
onUnmounted(() => {
  dispose?.()
  dispose = null
})
</script>

<template>
  <div class="songyan-theme mxt-tool" :class="`mxt-tool--${tool}`" :id="host"></div>
</template>

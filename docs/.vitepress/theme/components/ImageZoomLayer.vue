<template>
  <!-- One viewer for every figure. It is mounted once by the layout and stays out of the way until
       a picture in the article is clicked. -->
  <ZoomViewer
    v-if="viewer.src"
    :open="viewer.open"
    :natural-width="viewer.width"
    :natural-height="viewer.height"
    :title="viewer.alt || text.title"
    @close="close"
  >
    <img :src="viewer.src" :alt="viewer.alt" />
  </ZoomViewer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { useData } from 'vitepress'
import ZoomViewer from './ZoomViewer.vue'

/**
 * Upgrades the figures in the article body to the same enlargement the diagrams get: clicking a
 * picture opens it in a floating card over a blurred page, where the wheel zooms and dragging pans.
 *
 * A click listener on the document rather than a wrapper around every image, because the markdown
 * is rendered by VitePress and the pages are not ours to rewrite. Three kinds of picture are left
 * alone: anything outside the article (the logo, the theme's own icons), a picture that is the whole
 * of a link - there the click belongs to the link - and anything a page marks with `data-no-zoom`.
 */
const texts = {
  zh: { title: '配图放大查看' },
  en: { title: 'Enlarged figure' }
}
const { lang } = useData()
const text = computed(() => (String(lang.value).startsWith('zh') ? texts.zh : texts.en))

const viewer = reactive({ open: false, src: '', alt: '', width: 0, height: 0 })

function onClick(event) {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = event.target
  if (!(target instanceof HTMLImageElement)) return
  if (!target.closest('.vp-doc') || target.closest('a') || target.closest('[data-no-zoom]')) return
  const src = target.currentSrc || target.src
  if (!src) return
  event.preventDefault()
  viewer.src = src
  viewer.alt = target.alt || ''
  viewer.width = target.naturalWidth || 1200
  viewer.height = target.naturalHeight || 800
  viewer.open = true
}

function close() {
  viewer.open = false
}

onMounted(() => document.addEventListener('click', onClick))
onBeforeUnmount(() => document.removeEventListener('click', onClick))
</script>

<!-- Not scoped: the rule has to reach the pictures VitePress renders into the article, and it is
     the pointer that tells a reader which pictures open the enlarged view. -->
<style>
.vp-doc img {
  cursor: zoom-in;
}

.vp-doc a img,
.vp-doc [data-no-zoom] img {
  cursor: pointer;
}
</style>

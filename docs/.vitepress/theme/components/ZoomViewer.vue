<template>
  <!-- The enlarged view is teleported to `body`: inside the article it would be clipped by the
       content column's stacking and overflow, and it has to cover the whole viewport. -->
  <Teleport to="body">
    <Transition name="zoom-layer">
      <div
        v-if="open"
        ref="layerRef"
        class="zoom-layer"
        role="dialog"
        aria-modal="true"
        :aria-label="title || text.dialog"
        tabindex="-1"
        @click.self="emit('close')"
      >
        <div
          ref="cardRef"
          class="zoom-card"
          :class="{ 'zoom-card-dragging': dragging }"
          @click.stop
        >
          <div class="zoom-bar">
            <span class="zoom-title">{{ title }}</span>
            <span class="zoom-spacer"></span>
            <button type="button" :title="text.zoomOut" @click="zoomBy(1 / STEP)">−</button>
            <span class="zoom-scale">{{ Math.round(scale * 100) }}%</span>
            <button type="button" :title="text.zoomIn" @click="zoomBy(STEP)">+</button>
            <button type="button" :title="text.reset" @click="fit">↻</button>
            <button type="button" :title="text.close" @click="emit('close')">✕</button>
          </div>
          <!-- The stage scrolls and pans; the wheel zooms about the pointer, so the diagram under
               the cursor stays under it. -->
          <div
            ref="stageRef"
            class="zoom-stage"
            @wheel.prevent="onWheel"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @click.self="onStageClick"
          >
            <div class="zoom-content" :style="contentStyle">
              <slot />
            </div>
          </div>
        </div>
        <p class="zoom-hint">{{ text.hint }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

/**
 * The enlarged view shared by diagrams and figures: a floating card over a blurred page, zoomed with
 * the wheel about the pointer, panned by dragging, closed with Esc or a click outside.
 *
 * It is a component of its own so that "look at this closer" behaves the same everywhere - the
 * diagram wrapper and the handler that upgrades article images both open this and nothing else.
 */
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  /** The content's intrinsic size: what "100%" means, and what the initial fit is computed from. */
  naturalWidth: {
    type: Number,
    default: 0
  },
  naturalHeight: {
    type: Number,
    default: 0
  },
  /** Shown in the bar and read out to assistive technology; may be empty. */
  title: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['close'])

const texts = {
  zh: {
    dialog: '放大查看',
    hint: '滚轮缩放 · 按住拖动平移 · Esc 关闭',
    zoomIn: '放大',
    zoomOut: '缩小',
    reset: '适应窗口',
    close: '关闭（Esc）'
  },
  en: {
    dialog: 'Enlarged view',
    hint: 'Wheel to zoom · drag to pan · Esc to close',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Fit to window',
    close: 'Close (Esc)'
  }
}
const { lang } = useData()
const text = computed(() => (String(lang.value).startsWith('zh') ? texts.zh : texts.en))

const layerRef = ref(null)
const cardRef = ref(null)
const stageRef = ref(null)

const scale = ref(1)
const dragging = ref(false)

const MIN_SCALE = 0.1
const MAX_SCALE = 8
const STEP = 1.25

const contentStyle = computed(() => {
  const width = Math.round(Math.max(1, props.naturalWidth) * scale.value)
  const height = Math.round(Math.max(1, props.naturalHeight) * scale.value)
  return {
    width: `${width}px`,
    height: `${height}px`
  }
})

/** The whole thing visible at once, never blown up past its own size. */
function fitScale() {
  const stage = stageRef.value
  if (!stage || !props.naturalWidth || !props.naturalHeight) return 1
  const available = {
    width: Math.max(1, stage.clientWidth - 24),
    height: Math.max(1, stage.clientHeight - 24)
  }
  return Math.min(1, available.width / props.naturalWidth, available.height / props.naturalHeight)
}

/** Fit, and put the content back under the middle of the stage. */
function fit() {
  scale.value = clamp(fitScale())
  nextTick(centre)
}

function centre() {
  const stage = stageRef.value
  if (!stage) return
  stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2
  stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2
}

function clamp(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

function zoomBy(factor) {
  zoomAt(scale.value * factor, {
    x: (stageRef.value?.clientWidth ?? 0) / 2,
    y: (stageRef.value?.clientHeight ?? 0) / 2
  })
}

/**
 * Zooms about one point of the stage: the content coordinate under `point` is put back under it
 * after the size changes, which is what makes the wheel feel like it is pulling the diagram.
 */
function zoomAt(target, point) {
  const stage = stageRef.value
  const offset = stage ? { left: stage.scrollLeft, top: stage.scrollTop } : { left: 0, top: 0 }
  const anchor = {
    x: (offset.left + point.x) / scale.value,
    y: (offset.top + point.y) / scale.value
  }
  const next = clamp(target)
  if (next === scale.value) return
  scale.value = next
  nextTick(() => {
    const element = stageRef.value
    if (!element) return
    element.scrollLeft = anchor.x * next - point.x
    element.scrollTop = anchor.y * next - point.y
  })
}

function onWheel(event) {
  const stage = stageRef.value
  if (!stage) return
  const rect = stage.getBoundingClientRect()
  // A trackpad reports small deltas and a mouse wheel large ones, so the step is proportional to
  // what was actually scrolled rather than a fixed increment.
  const factor = Math.exp(-event.deltaY * 0.0015)
  zoomAt(scale.value * factor, { x: event.clientX - rect.left, y: event.clientY - rect.top })
}

let drag = null
/** When a pan ends over the background the browser still fires a click, which must not close. */
let suppressClickUntil = 0

function onPointerDown(event) {
  const stage = stageRef.value
  if (!stage || event.button !== 0) return
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    left: stage.scrollLeft,
    top: stage.scrollTop,
    moved: false
  }
  dragging.value = true
  stage.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event) {
  const stage = stageRef.value
  if (!drag || !stage || event.pointerId !== drag.id) return
  if (Math.abs(event.clientX - drag.x) > 3 || Math.abs(event.clientY - drag.y) > 3) drag.moved = true
  stage.scrollLeft = drag.left - (event.clientX - drag.x)
  stage.scrollTop = drag.top - (event.clientY - drag.y)
}

function onPointerUp(event) {
  const stage = stageRef.value
  if (!drag || event.pointerId !== drag.id) return
  stage?.releasePointerCapture?.(event.pointerId)
  if (drag.moved) suppressClickUntil = Date.now() + 250
  drag = null
  dragging.value = false
}

function onStageClick() {
  if (Date.now() < suppressClickUntil) return
  emit('close')
}

function onKeydown(event) {
  if (!props.open) return
  if (event.key === 'Escape') emit('close')
  else if (event.key === '+' || event.key === '=') zoomBy(STEP)
  else if (event.key === '-' || event.key === '_') zoomBy(1 / STEP)
  else if (event.key === '0') fit()
}

function onResize() {
  if (props.open) fit()
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      document.body.style.overflow = ''
      drag = null
      dragging.value = false
      return
    }
    document.body.style.overflow = 'hidden'
    await nextTick()
    layerRef.value?.focus()
    fit()
  },
  // The image layer mounts its viewer already open on the first click, so the first open has to be
  // handled too rather than only the changes after it.
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
  if (props.open) document.body.style.overflow = ''
})
</script>

<style scoped>
/* A blurred copy of the page stays visible behind the card: the reader keeps their place, and the
   card reads as something laid over the article rather than as a page of its own. */
.zoom-layer {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 3vh 3vw;
  background: color-mix(in srgb, var(--vp-c-bg) 62%, transparent);
  backdrop-filter: blur(10px) saturate(1.15);
  -webkit-backdrop-filter: blur(10px) saturate(1.15);
  outline: none;
}

.zoom-card {
  display: flex;
  flex-direction: column;
  width: min(1400px, 94vw);
  height: min(1100px, 86vh);
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: 0 24px 60px rgb(0 0 0 / 35%);
}

.zoom-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
}

.zoom-title {
  overflow: hidden;
  color: var(--vp-c-text-2);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zoom-spacer {
  flex: 1;
}

.zoom-bar button {
  min-width: 34px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.zoom-bar button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.zoom-scale {
  min-width: 52px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

/* The stage is a flex box so that `margin: auto` on the content centres it on both axes while it
   fits, and still lets it scroll once it does not: a flex item never clips the start the way a
   centred grid or flex container does. `flex: none` keeps the zoomed size instead of shrinking it. */
.zoom-stage {
  display: flex;
  flex: 1;
  overflow: auto;
  padding: 12px;
  cursor: grab;
}

.zoom-card-dragging .zoom-stage {
  cursor: grabbing;
}

.zoom-content {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  margin: auto;
}

.zoom-content :deep(svg),
.zoom-content :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  user-select: none;
  -webkit-user-drag: none;
}

.zoom-hint {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.zoom-layer-enter-active,
.zoom-layer-leave-active {
  transition: opacity 0.16s ease;
}

.zoom-layer-enter-from,
.zoom-layer-leave-to {
  opacity: 0;
}
</style>

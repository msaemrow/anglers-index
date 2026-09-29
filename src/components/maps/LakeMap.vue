<script setup>
import { computed, ref, watch } from 'vue'
import { MapPin } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { lakeCoordinates } from '@/api/lakes'

const props = defineProps({ lake: { type: Object, required: true } })
const container = ref(null)
const coordinates = computed(() => lakeCoordinates(props.lake))
const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim()
const loading = ref(false)
const error = ref('')
const attempt = ref(0)

watch(
  [container, coordinates, attempt],
  async ([element, center], _, onCleanup) => {
    if (!element || !center || !accessToken) return
    let disposed = false
    let map
    let observer
    let timeout
    onCleanup(() => {
      disposed = true
      clearTimeout(timeout)
      observer?.disconnect()
      map?.remove()
    })
    loading.value = true
    error.value = ''
    try {
      const [mapbox] = await Promise.all([
        import('mapbox-gl/esm'),
        import('mapbox-gl/dist/mapbox-gl.css'),
      ])
      if (disposed) return
      map = new mapbox.Map({
        container: element,
        accessToken,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center,
        zoom: 11,
        cooperativeGestures: true,
      })
      map.addControl(new mapbox.NavigationControl(), 'top-right')
      const marker = new mapbox.Marker({ color: '#28496d' }).setLngLat(center).addTo(map)
      marker
        .getElement()
        .setAttribute('aria-label', `${props.lake.name || 'Lake'} approximate location`)
      map.on('load', () => {
        clearTimeout(timeout)
        loading.value = false
        error.value = ''
      })
      map.on('error', () => {
        clearTimeout(timeout)
        loading.value = false
        error.value = 'The map couldn’t load. Please try again.'
      })
      timeout = setTimeout(() => {
        loading.value = false
        error.value = 'The map is taking too long to load. Please try again.'
      }, 15000)
      observer = new ResizeObserver(() => map.resize())
      observer.observe(element)
    } catch {
      if (!disposed) {
        loading.value = false
        error.value = 'The map couldn’t load in this browser. Please try again.'
      }
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="map-frame">
    <div v-if="!coordinates || !accessToken" class="map-message">
      <MapPin :size="36" aria-hidden="true" />
      <h3>{{ !coordinates ? 'Location not recorded' : 'Map unavailable' }}</h3>
      <p>
        {{
          !coordinates
            ? 'Coordinates haven’t been added for this lake.'
            : 'The interactive map is not available yet.'
        }}
      </p>
    </div>
    <template v-else>
      <div
        ref="container"
        class="map-canvas"
        role="region"
        :aria-label="`Map of ${lake.name || 'lake'} location`"
      />
      <div v-if="loading || error" class="map-overlay" :role="error ? 'alert' : 'status'">
        <p>{{ error || 'Loading lake map…' }}</p>
        <AppButton v-if="error" variant="secondary" @click="attempt++">Retry map</AppButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.map-frame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #edf2f7;
}
.map-canvas,
.map-message {
  width: 100%;
  height: 420px;
}
.map-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  text-align: center;
  color: var(--muted);
}
.map-message p {
  font-size: 13px;
  line-height: 1.7;
}
.map-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 56px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  font-size: 13px;
  box-shadow: 0 3px 12px #192b431a;
}
.map-overlay .button {
  margin-top: 12px;
}
@media (max-width: 600px) {
  .map-canvas,
  .map-message {
    height: 330px;
  }
}
</style>

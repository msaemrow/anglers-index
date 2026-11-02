<script setup>
import { LABELS, EVENTS } from '@/constants'

import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { lakeCoordinates } from '@/api/lakes'
import { currentPosition } from '@/utils/geolocation'

const props = defineProps({
  latitude: { type: [Number, String], default: '' },
  longitude: { type: [Number, String], default: '' },
  disabled: Boolean,
  locationLabel: { type: String, default: 'lake' },
  fallbackCoordinates: { type: Array, default: null },
  useDeviceLocation: Boolean,
})
const emit = defineEmits([EVENTS.SELECT])
const coordinates = computed(() => lakeCoordinates(props))
const container = ref(null)
const loading = ref(false)
const error = ref('')
const centering = ref(false)
const centerMessage = ref('')
let centerController
const attempt = ref(0)
const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim()
let map
let marker
let mapbox
function updateMarker() {
  if (!map || !mapbox) return
  if (!coordinates.value) {
    marker?.remove()
    marker = null
    return
  }
  if (!marker) {
    marker = new mapbox.Marker({ color: '#082f6b', draggable: !props.disabled })
      .setLngLat(coordinates.value)
      .addTo(map)
    marker.getElement().setAttribute('aria-label', `Selected ${props.locationLabel} location`)
    marker.on('dragend', () => select(marker.getLngLat()))
  } else marker.setLngLat(coordinates.value)
}
function select(point) {
  if (props.disabled) return
  const wrapped = point.wrap()
  emit(EVENTS.SELECT, {
    latitude: Number(wrapped.lat.toFixed(6)),
    longitude: Number(wrapped.lng.toFixed(6)),
  })
}
function selectCenter() {
  if (map) select(map.getCenter())
}
watch(coordinates, () => {
  if (coordinates.value) centerController?.abort()
  updateMarker()
  if (coordinates.value && map && !map.getBounds().contains(coordinates.value))
    map.easeTo({ center: coordinates.value, duration: 0 })
})
watch(
  () => props.disabled,
  (value) => marker?.setDraggable(!value),
)
watch(
  [container, attempt],
  async ([element], _, onCleanup) => {
    if (!element || !accessToken) return
    let disposed = false
    let instance
    let observer
    let timeout
    const current = new AbortController()
    centerController = current
    onCleanup(() => {
      disposed = true
      current.abort()
      if (centerController === current) centerController = null
      clearTimeout(timeout)
      observer?.disconnect()
      marker?.remove()
      marker = null
      instance?.remove()
      if (map === instance) map = null
    })
    loading.value = true
    error.value = centerMessage.value = ''
    centering.value = false
    try {
      async function initialCenter() {
        if (coordinates.value) return coordinates.value
        if (props.useDeviceLocation) {
          centering.value = true
          try {
            const position = await currentPosition({ signal: current.signal })
            if (!disposed && !coordinates.value) {
              centerMessage.value =
                'Map centered on your current device position. Place a pin or use the map center to select a catch location.'
              return [position.longitude, position.latitude]
            }
          } catch {
            if (!disposed && !coordinates.value)
              centerMessage.value = props.fallbackCoordinates
                ? 'Device location is unavailable. The map starts at the associated lake. Place a pin to select the catch location.'
                : 'Device and lake locations are unavailable. Navigate the map or enter coordinates.'
          } finally {
            if (!disposed) centering.value = false
          }
        }
        return coordinates.value || props.fallbackCoordinates
      }
      const [module, , center] = await Promise.all([
        import('mapbox-gl/esm'),
        import('mapbox-gl/dist/mapbox-gl.css'),
        initialCenter(),
      ])
      if (disposed) return
      mapbox = module
      instance = new mapbox.Map({
        container: element,
        accessToken,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: coordinates.value || center || [-96, 39],
        zoom: coordinates.value || center ? 12 : 3,
        cooperativeGestures: true,
      })
      map = instance
      instance.addControl(new mapbox.NavigationControl(), 'top-right')
      instance.addControl(
        new mapbox.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
        }),
        'top-right',
      )
      instance.getCanvas().style.cursor = 'crosshair'
      instance.on('click', (event) => select(event.lngLat))
      instance.on('load', () => {
        clearTimeout(timeout)
        loading.value = false
        error.value = ''
        instance.resize()
      })
      instance.on('error', () => {
        clearTimeout(timeout)
        loading.value = false
        error.value = 'The map couldn’t load. Retry or enter coordinates below.'
      })
      timeout = setTimeout(() => {
        loading.value = false
        error.value = 'The map is taking too long to load. Retry or enter coordinates below.'
      }, 15000)
      updateMarker()
      observer = new ResizeObserver(() => instance.resize())
      observer.observe(element)
    } catch {
      if (!disposed) {
        loading.value = false
        error.value = 'The map is unavailable in this browser. You can enter coordinates below.'
      }
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <section class="coordinate-picker" :aria-label="`Choose ${locationLabel} coordinates`">
    <p class="hint">
      Click or tap the {{ locationLabel }} location to place a pin. Drag the pin to adjust it, then
      save.
    </p>
    <p v-if="!accessToken" class="map-message" role="status">
      The map is unavailable. You can enter coordinates below.
    </p>
    <template v-else>
      <div class="map-frame">
        <div
          ref="container"
          class="map-canvas"
          role="region"
          :aria-label="`${locationLabel} location map. Use arrow keys to pan, plus and minus to zoom, then select Use map center.`"
        />
        <div v-if="loading || error" class="map-message" :role="error ? 'alert' : 'status'">
          <p>{{ error || (centering ? 'Finding a starting location…' : 'Loading map…') }}</p>
          <AppButton v-if="error" variant="secondary" :disabled="disabled" @click="attempt++">{{
            LABELS.RETRY_MAP
          }}</AppButton>
        </div>
      </div>
      <p v-if="centerMessage" class="hint" role="status">{{ centerMessage }}</p>
      <div class="map-actions">
        <AppButton
          variant="secondary"
          :disabled="disabled || loading || !!error"
          @click="selectCenter"
          >Use map center</AppButton
        >
        <span aria-live="polite">{{
          coordinates ? 'Location selected' : 'No location selected'
        }}</span>
      </div>
    </template>
  </section>
</template>
<style scoped>
.coordinate-picker {
  margin: 4px 0 16px;
}
.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 10px;
}
.map-frame {
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  overflow: hidden;
}
.map-canvas {
  width: 100%;
  height: 280px;
}
.map-message {
  padding: 12px;
  background: var(--surface);
  color: var(--muted);
  font-size: 13px;
}
.map-frame .map-message {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 50px;
  border-radius: 6px;
}
.map-message .button {
  margin-top: 8px;
}
.map-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}
</style>

<script setup>
import { computed, ref, watch } from 'vue'
import { MapPin } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { catchFeatures, accuracyFeature, catchBounds, catchesAtPoint } from '@/utils/catchMap'

const props = defineProps({
  reference: { type: Array, default: null },
  points: { type: Array, default: () => [] },
  label: { type: String, default: 'Fishing location map' },
  referenceLabel: { type: String, default: 'Approximate lake location' },
  showAccuracy: Boolean,
})
const emit = defineEmits(['select'])
const container = ref(null)
const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim()
const hasPosition = computed(() => props.points.length > 0 || !!props.reference)
const loading = ref(false)
const error = ref('')
const selectionError = ref('')
const attempt = ref(0)
let refresh
watch([() => props.points, () => props.reference], () => refresh?.())

watch(
  [container, attempt],
  async ([element], _, onCleanup) => {
    if (!element || !accessToken) return
    let disposed = false
    let map
    let marker
    let observer
    let timeout
    let revision = 0
    onCleanup(() => {
      disposed = true
      revision++
      refresh = null
      clearTimeout(timeout)
      observer?.disconnect()
      marker?.remove()
      map?.remove()
    })
    loading.value = true
    error.value = selectionError.value = ''
    try {
      const [mapbox] = await Promise.all([
        import('mapbox-gl/esm'),
        import('mapbox-gl/dist/mapbox-gl.css'),
      ])
      if (disposed) return
      const first = props.points[0]
      map = new mapbox.Map({
        container: element,
        accessToken,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: first ? [first.longitude, first.latitude] : props.reference,
        zoom: first ? 14 : 11,
        cooperativeGestures: true,
      })
      map.addControl(new mapbox.NavigationControl(), 'top-right')
      function update() {
        revision++
        selectionError.value = ''
        map.getSource('catches').setData(catchFeatures(props.points))
        const accuracy = accuracyFeature(props.showAccuracy ? props.points[0] : null)
        map.getSource('accuracy').setData(accuracy)
        marker?.remove()
        marker = null
        if (props.reference) {
          marker = new mapbox.Marker({ color: '#28496d' }).setLngLat(props.reference).addTo(map)
          marker.getElement().setAttribute('aria-label', props.referenceLabel)
        }
        const ring = accuracy.features[0]?.geometry.coordinates[0]
        const bounds = catchBounds(
          ring ? ring.map(([longitude, latitude]) => ({ longitude, latitude })) : props.points,
        )
        if (bounds) map.fitBounds(bounds, { padding: 55, maxZoom: 15, duration: 0 })
        else if (props.reference) map.jumpTo({ center: props.reference, zoom: 11 })
      }
      map.on('load', () => {
        if (disposed) return
        clearTimeout(timeout)
        map.addSource('accuracy', { type: 'geojson', data: accuracyFeature(null) })
        map.addLayer({
          id: 'accuracy-fill',
          type: 'fill',
          source: 'accuracy',
          paint: { 'fill-color': '#2878bd', 'fill-opacity': 0.16 },
        })
        map.addLayer({
          id: 'accuracy-outline',
          type: 'line',
          source: 'accuracy',
          paint: { 'line-color': '#2878bd', 'line-width': 1 },
        })
        map.addSource('catches', {
          type: 'geojson',
          data: catchFeatures([]),
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 45,
        })
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'catches',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#b75d19',
            'circle-radius': ['step', ['get', 'point_count'], 19, 10, 24, 50, 30],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        })
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'catches',
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
          paint: { 'text-color': '#fff' },
        })
        map.addLayer({
          id: 'catch-points',
          type: 'circle',
          source: 'catches',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#b75d19',
            'circle-radius': 8,
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        })
        map.on('click', 'catch-points', (event) => {
          // Rendered tile geometry can be quantized; select by stable ID first.
          const id = Number(event.features?.[0]?.properties.catch_id)
          const point = props.points.find((fish) => fish.id === id)
          if (point)
            emit(
              'select',
              catchesAtPoint(props.points, [point.longitude, point.latitude]).map(
                (fish) => fish.id,
              ),
            )
        })
        map.on('click', 'clusters', (event) => {
          const feature = event.features?.[0]
          if (!feature) return
          const version = revision
          const source = map.getSource('catches')
          source.getClusterLeaves(
            feature.properties.cluster_id,
            feature.properties.point_count,
            0,
            (failure, leaves) => {
              if (disposed || revision !== version) return
              if (failure) {
                selectionError.value =
                  'This group could not open. Try again or use the catch list below.'
                return
              }
              emit(
                'select',
                leaves.map((leaf) => leaf.properties.catch_id),
              )
            },
          )
          source.getClusterExpansionZoom(feature.properties.cluster_id, (failure, zoom) => {
            if (!failure && !disposed && revision === version)
              map.easeTo({ center: feature.geometry.coordinates, zoom: Math.min(zoom, 19) })
          })
        })
        for (const layer of ['clusters', 'catch-points']) {
          map.on('mouseenter', layer, () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', layer, () => {
            map.getCanvas().style.cursor = ''
          })
        }
        refresh = update
        update()
        loading.value = false
        error.value = ''
      })
      map.on('error', () => {
        if (!disposed) {
          clearTimeout(timeout)
          loading.value = false
          error.value = 'The map couldn’t load. Please try again.'
        }
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
    <div v-if="!hasPosition || !accessToken" class="map-message" role="status">
      <MapPin :size="36" aria-hidden="true" />
      <h3>{{ !hasPosition ? 'Location not recorded' : 'Map unavailable' }}</h3>
      <p>
        {{
          !hasPosition
            ? 'No saved coordinates are available for this map.'
            : 'The interactive map is not available. Saved catch details remain available below.'
        }}
      </p>
    </div>
    <template v-else>
      <div ref="container" class="map-canvas" role="region" :aria-label="label" />
      <div v-if="loading || error" class="map-overlay" :role="error ? 'alert' : 'status'">
        <p>{{ error || 'Loading map…' }}</p>
        <AppButton v-if="error" variant="secondary" @click="attempt++">Retry map</AppButton>
      </div>
    </template>
  </div>
  <p v-if="selectionError" class="error-message" role="status">{{ selectionError }}</p>
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
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

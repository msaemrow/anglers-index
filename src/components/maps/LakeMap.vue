<script setup>
import { computed } from 'vue'
import { lakeCoordinates } from '@/api/lakes'
import LocationMap from './LocationMap.vue'
const props = defineProps({ lake: { type: Object, required: true } })
const reference = computed(() => lakeCoordinates(props.lake))
</script>

<template>
  <LocationMap
    :reference="reference"
    :label="`Map of ${lake.name || 'lake'} location`"
    :reference-label="`${lake.name || 'Lake'} approximate location`"
  />
</template>

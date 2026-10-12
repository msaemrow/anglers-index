<script setup>
import { APP_NAME, LABELS, EVENTS } from '@/constants'

import logo from '@/assets/logo.png'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { LogOut, Menu, X } from '@lucide/vue'

defineProps({ user: { type: Object, default: null } })
const emit = defineEmits([EVENTS.SIGN_OUT])
const menuOpen = ref(false)
const navbar = ref(null)
const menuButton = ref(null)
const navId = 'primary-navigation'
function closeOnOutside(event) {
  if (!navbar.value?.contains(event.target)) menuOpen.value = false
}
function closeOnEscape(event) {
  if (event.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
    menuButton.value?.focus()
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', closeOnOutside)
  document.addEventListener('keydown', closeOnEscape)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOnOutside)
  document.removeEventListener('keydown', closeOnEscape)
})
function signOut() {
  menuOpen.value = false
  emit(EVENTS.SIGN_OUT)
}
</script>

<template>
  <header ref="navbar" class="navbar">
    <RouterLink class="brand" to="/dashboard" @click="menuOpen = false"
      ><span class="brand__mark"><img :src="logo" alt="" width="34" height="34" /></span
      >{{ APP_NAME }}</RouterLink
    >
    <template v-if="user">
      <button
        ref="menuButton"
        class="menu-toggle"
        :aria-expanded="menuOpen"
        :aria-controls="navId"
        aria-label="Toggle navigation"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="20" /><Menu v-else :size="20" />
      </button>
      <nav
        :id="navId"
        class="navigation"
        :class="{ 'navigation--open': menuOpen }"
        aria-label="Main navigation"
      >
        <RouterLink
          to="/dashboard"
          class="nav-link"
          active-class="nav-link--active"
          @click="menuOpen = false"
          >Dashboard</RouterLink
        >
        <RouterLink
          class="nav-link"
          active-class="nav-link--active"
          :to="{ name: 'fish-catches', params: { username: user.username } }"
          @click="menuOpen = false"
          >Catches</RouterLink
        >
        <RouterLink
          class="nav-link"
          active-class="nav-link--active"
          :to="{ name: 'catch-analysis', params: { username: user.username } }"
          @click="menuOpen = false"
          >Analysis</RouterLink
        >
        <RouterLink
          class="nav-link"
          active-class="nav-link--active"
          :to="{ name: 'trips', params: { username: user.username } }"
          @click="menuOpen = false"
          >Trips</RouterLink
        >
        <RouterLink
          class="nav-link"
          active-class="nav-link--active"
          :to="{ name: 'tackle-box', params: { username: user.username } }"
          @click="menuOpen = false"
          >Tackle box</RouterLink
        >
        <RouterLink
          to="/lure/all"
          class="nav-link"
          active-class="nav-link--active"
          @click="menuOpen = false"
          >Lures</RouterLink
        >
        <RouterLink
          to="/lakes/all"
          class="nav-link"
          active-class="nav-link--active"
          @click="menuOpen = false"
          >Lakes</RouterLink
        >
        <RouterLink
          to="/species/all"
          class="nav-link"
          active-class="nav-link--active"
          @click="menuOpen = false"
          >Species</RouterLink
        >
        <div class="nav-account">
          <span>{{ user.first_name || user.username }}</span
          ><button class="nav-link" @click="signOut">
            <LogOut :size="15" aria-hidden="true" />{{ LABELS.SIGN_OUT }}
          </button>
        </div>
      </nav>
    </template>
    <span v-else class="navbar__caption">Your fishing journal</span>
  </header>
</template>

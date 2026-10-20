<script setup>
import { APP_NAME, LABELS, EVENTS } from '@/constants'

import logo from '@/assets/logo.png'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Menu, X } from '@lucide/vue'

defineProps({ user: { type: Object, default: null } })
const emit = defineEmits([EVENTS.SIGN_OUT])
const router = useRouter()
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
  router.push('/')
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

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: var(--navbar-height);
  padding: 0 28px;
  background: var(--navy);
  color: #e7eef8;
  border-bottom: 1px solid #2b405c;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.45px;
}
.brand__mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #334e70;
}
.brand__mark img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.navigation {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #c7d5e6;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.nav-link:hover {
  background: #29405f;
  color: var(--surface);
}
.nav-link--active {
  background: #344e6d;
  color: var(--surface);
}
.nav-account {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 14px;
  padding-left: 18px;
  border-left: 1px solid #40526b;
  font-size: 12px;
}
.nav-account > span {
  max-width: 95px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.navbar__caption {
  font-size: 12px;
  color: #b5c5d9;
}
.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: transparent;
  border: 1px solid #506581;
  border-radius: var(--radius-control);
  color: var(--surface);
}
@media (max-width: 1100px) {
  .menu-toggle {
    display: flex;
  }
  .navigation {
    display: none;
    position: absolute;
    top: 72px;
    right: 16px;
    padding: 10px;
    background: var(--navy);
    border: 1px solid #40526b;
    border-radius: 10px;
    width: min(300px, calc(100vw - 32px));
    max-height: calc(100dvh - 90px);
    overflow-y: auto;
    box-shadow: 0 12px 28px #192b4326;
  }
  .navigation--open {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .nav-link {
    padding: 12px;
  }
  .nav-account {
    margin: 8px 0 0;
    padding: 10px 12px 0;
    border-left: none;
    border-top: 1px solid #40526b;
    justify-content: space-between;
  }
}
@media (max-width: 480px) {
  .navbar {
    padding: 0 18px;
  }
  .brand {
    font-size: 16px;
  }
  .navbar__caption {
    display: none;
  }
}
</style>

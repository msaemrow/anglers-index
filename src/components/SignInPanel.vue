<script setup>
import { ref } from 'vue'
import { Fish } from '@lucide/vue'
import AppButton from './ui/AppButton.vue'

defineProps({ busy: Boolean, error: { type: String, default: '' } })
const emit = defineEmits(['submit'])
const username = ref('')
const password = ref('')
function submit() {
  emit('submit', { username: username.value, password: password.value })
}
</script>

<template>
  <section class="sign-in" aria-labelledby="sign-in-title">
    <div class="sign-in__icon"><Fish :size="30" aria-hidden="true" /></div>
    <p class="eyebrow">Welcome back</p>
    <h1 id="sign-in-title">Your next chapter starts here.</h1>
    <p class="muted">Sign in with your Anglers Index account to see your fishing journal.</p>
    <form class="sign-in__form" @submit.prevent="submit">
      <label for="username">Username</label
      ><input
        id="username"
        v-model="username"
        autocomplete="username"
        required
        :disabled="busy"
      /><label for="password">Password</label
      ><input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        :disabled="busy"
      />
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <AppButton type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</AppButton>
    </form>
  </section>
</template>

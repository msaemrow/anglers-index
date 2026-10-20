<script setup>
import { APP_NAME, LABELS, EVENTS } from '@/constants'

import { ref } from 'vue'
import { Fish } from '@lucide/vue'
import AppButton from './ui/AppButton.vue'
import FormField from './ui/FormField.vue'

defineProps({ busy: Boolean, error: { type: String, default: '' } })
const emit = defineEmits([EVENTS.SUBMIT])
const username = ref('')
const password = ref('')
function submit() {
  emit(EVENTS.SUBMIT, { username: username.value, password: password.value })
}
</script>

<template>
  <section class="sign-in" aria-labelledby="sign-in-title">
    <div class="sign-in__icon"><Fish :size="30" aria-hidden="true" /></div>
    <p class="eyebrow">Welcome back</p>
    <h1 id="sign-in-title">Your next chapter starts here.</h1>
    <p class="muted">Sign in with your {{ APP_NAME }} account to see your fishing journal.</p>
    <form class="sign-in__form" @submit.prevent="submit">
      <FormField
        id="username"
        v-model="username"
        label="Username"
        autocomplete="username"
        required
        :disabled="busy"
      />
      <FormField
        id="password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        required
        :disabled="busy"
      />
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <AppButton type="submit" :disabled="busy">{{
        busy ? LABELS.SIGNING_IN : LABELS.SIGN_IN
      }}</AppButton>
    </form>
  </section>
</template>

<style scoped>
.sign-in {
  width: 100%;
  max-width: 440px;
  padding: 36px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}
.sign-in__icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin-bottom: 25px;
  border-radius: 15px;
  background: var(--surface-muted);
  color: #426080;
}
.sign-in h1 {
  font-size: 30px;
  line-height: 1.25;
}
.sign-in > .muted {
  font-size: 14px;
  line-height: 1.7;
  margin-top: 15px;
}
.sign-in__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 28px;
}
.sign-in__form :deep(.button) {
  min-height: 44px;
}
@media (max-width: 480px) {
  .sign-in {
    padding: 26px;
  }
}
</style>

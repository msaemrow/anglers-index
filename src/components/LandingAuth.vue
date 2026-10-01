<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useSession } from '@/composables/useSession'

const { user, signingIn, signIn, signUp } = useSession()
const router = useRouter()
const mode = ref('')
const error = ref('')
const root = ref(null)
const panel = ref(null)
const loginButton = ref(null)
const registerButton = ref(null)
const fields = reactive({
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  confirm: '',
})
let opener
async function open(nextMode, trigger) {
  if (signingIn.value) return
  opener = trigger || (nextMode === 'login' ? loginButton.value : registerButton.value)
  mode.value = mode.value === nextMode ? '' : nextMode
  error.value = ''
  fields.password = ''
  fields.confirm = ''
  await nextTick()
  panel.value?.querySelector('input')?.focus()
}
function close(restoreFocus = false) {
  mode.value = ''
  fields.password = ''
  fields.confirm = ''
  if (restoreFocus) opener?.focus()
}
function outside(event) {
  if (!root.value?.contains(event.target)) close()
}
function escape(event) {
  if (mode.value && event.key === 'Escape') close(true)
}
function blur(event) {
  if (event.relatedTarget && !root.value?.contains(event.relatedTarget)) close()
}
async function submit() {
  if (signingIn.value) return
  error.value = ''
  if (mode.value === 'register' && fields.password !== fields.confirm) {
    error.value = 'Passwords do not match.'
    return
  }
  try {
    if (mode.value === 'register') await signUp(fields)
    else await signIn(fields)
    await router.push('/dashboard')
  } catch (failure) {
    if (failure.name === 'AbortError') return
    error.value =
      failure.status === 401
        ? 'Incorrect username or password.'
        : failure.status === 400
          ? failure.message
          : 'Unable to connect. Please try again.'
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', outside)
  document.addEventListener('keydown', escape)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside)
  document.removeEventListener('keydown', escape)
})
defineExpose({ open })
</script>

<template>
  <div ref="root" class="landing-auth" @focusout="blur">
    <AppButton v-if="user" to="/dashboard">Your dashboard</AppButton>
    <template v-else>
      <div class="login-anchor">
        <button
          ref="loginButton"
          class="auth-login"
          type="button"
          :aria-expanded="mode === 'login'"
          aria-controls="landing-auth-panel"
          :disabled="signingIn"
          @click="open('login')"
        >
          Login <ChevronDown :size="15" :class="{ rotated: mode === 'login' }" aria-hidden="true" />
        </button>
        <Transition name="expand">
          <section
            v-if="mode"
            id="landing-auth-panel"
            ref="panel"
            class="auth-panel"
            :class="{ 'auth-panel--register': mode === 'register' }"
            aria-labelledby="auth-title"
            :aria-busy="signingIn"
          >
            <p class="eyebrow">
              {{ mode === 'login' ? 'BACK TO THE WATER' : 'YOUR NEXT CHAPTER' }}
            </p>
            <h2 id="auth-title">
              {{ mode === 'login' ? 'Welcome back.' : 'Create your account.' }}
            </h2>
            <form class="sign-in__form" @submit.prevent="submit">
              <label for="landing-username">Username</label
              ><input
                id="landing-username"
                v-model="fields.username"
                name="username"
                autocomplete="username"
                required
                :disabled="signingIn"
              />
              <template v-if="mode === 'register'">
                <label for="landing-first-name">First name</label
                ><input
                  id="landing-first-name"
                  v-model="fields.first_name"
                  name="first_name"
                  autocomplete="given-name"
                  required
                  :disabled="signingIn"
                />
                <label for="landing-last-name">Last name</label
                ><input
                  id="landing-last-name"
                  v-model="fields.last_name"
                  name="last_name"
                  autocomplete="family-name"
                  required
                  :disabled="signingIn"
                />
                <label for="landing-email">Email</label
                ><input
                  id="landing-email"
                  v-model="fields.email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  :disabled="signingIn"
                />
              </template>
              <label for="landing-password">Password</label
              ><input
                id="landing-password"
                v-model="fields.password"
                name="password"
                type="password"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                required
                :disabled="signingIn"
              />
              <template v-if="mode === 'register'"
                ><label for="landing-confirm">Confirm password</label
                ><input
                  id="landing-confirm"
                  v-model="fields.confirm"
                  name="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  :disabled="signingIn"
              /></template>
              <p v-if="error" role="alert" class="error-message">{{ error }}</p>
              <AppButton type="submit" :disabled="signingIn">{{
                signingIn ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'
              }}</AppButton>
            </form>
          </section>
        </Transition>
      </div>
      <button
        ref="registerButton"
        class="button button--primary"
        type="button"
        :aria-expanded="mode === 'register'"
        aria-controls="landing-auth-panel"
        :disabled="signingIn"
        @click="open('register')"
      >
        Register
      </button>
    </template>
  </div>
</template>

<style scoped>
.landing-auth {
  display: flex;
  align-items: center;
  gap: 12px;
}
.login-anchor {
  position: relative;
}
.auth-login {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 39px;
  padding: 9px 14px;
  border: 1px solid #c4d0da;
  border-radius: 8px;
  color: #253549;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
}
.auth-login:hover {
  background: #edf2f6;
}
.rotated {
  transform: rotate(180deg);
}
.auth-panel {
  position: absolute;
  top: calc(100% + 17px);
  right: 0;
  width: 350px;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 90px);
  overflow-y: auto;
  padding: 26px;
  border: 1px solid #d3dce4;
  border-radius: 12px;
  background: #fff;
  color: #253549;
  box-shadow: 0 20px 60px #162b4333;
  transform-origin: top right;
}
.auth-panel--register {
  right: -94px;
}
.auth-panel h2 {
  font-size: 25px;
}
.sign-in__form {
  margin-top: 22px;
  gap: 8px;
}
.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.96);
}
@media (max-width: 600px) {
  .landing-auth {
    gap: 6px;
  }
  .auth-panel,
  .auth-panel--register {
    position: fixed;
    top: 70px;
    right: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .expand-enter-active,
  .expand-leave-active {
    transition: none;
  }
}
</style>

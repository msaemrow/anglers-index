<script setup>
import { ref } from 'vue'
import { ArrowDown, ArrowUpRight, Fish, MapPin, NotebookPen, Trophy } from '@lucide/vue'
import LandingAuth from '@/components/LandingAuth.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useSession } from '@/composables/useSession'

const { user } = useSession()
const auth = ref(null)
const features = [
  {
    icon: NotebookPen,
    label: 'LOG YOUR CATCHES',
    title: 'Every catch has a story.',
    description:
      'Save the species, lake, lure, and details of your catch. Build a fishing journal you’ll want to look back on.',
  },
  {
    icon: MapPin,
    label: 'LEARN FROM YOUR WATER',
    title: 'Find your next good day.',
    description:
      'Explore your catch history and spot patterns in what’s working. Put your time on the water to work for your next trip.',
  },
  {
    icon: Trophy,
    label: 'CELEBRATE THE KEEPERS',
    title: 'Remember your best.',
    description:
      'Track your personal bests, grow your species list, and follow your progress toward Master Angler milestones.',
  },
]
</script>

<template>
  <div class="landing">
    <a class="skip-link" href="#home-content">Skip to content</a>
    <header class="landing-header">
      <RouterLink to="/" class="landing-brand"
        ><span><Fish :size="23" aria-hidden="true" /></span>Anglers Index</RouterLink
      >
      <nav aria-label="Account navigation"><LandingAuth ref="auth" /></nav>
    </header>
    <main id="home-content">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-content">
          <p class="hero-eyebrow">FOR THE DAYS YOU’D RATHER BE FISHING</p>
          <h1 id="home-title">Good days on the water.<br /><em>Great stories to keep.</em></h1>
          <p class="hero-intro">
            Your catches, your favorite spots, your next personal best. Keep your fishing story
            together with Anglers Index.
          </p>
          <div class="hero-actions">
            <AppButton v-if="user" to="/dashboard" class="hero-cta"
              >Open your dashboard <ArrowUpRight :size="18" aria-hidden="true"
            /></AppButton>
            <AppButton v-else class="hero-cta" @click="auth.open('register', $event.currentTarget)"
              >Start your fishing journal <ArrowUpRight :size="18" aria-hidden="true"
            /></AppButton>
            <a href="#features" class="explore"
              >Explore the features <ArrowDown :size="16" aria-hidden="true"
            /></a>
          </div>
        </div>
        <div class="hero-caption">
          <span>A LITTLE LESS GUESSWORK. A LOT MORE FISHING.</span
          ><span>MAKE EVERY CAST A MEMORY</span>
        </div>
      </section>
      <section id="features" class="features" aria-labelledby="features-title">
        <p class="eyebrow">MORE THAN A CATCH LOG</p>
        <h2 id="features-title">Your time on the water,<br />all in one place.</h2>
        <p class="features-intro">From the first cast to the fish you’ll talk about for years.</p>
        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.label" class="feature">
            <component
              :is="feature.icon"
              :size="27"
              :stroke-width="1.4"
              class="feature-icon"
              aria-hidden="true"
            />
            <p class="eyebrow">{{ feature.label }}</p>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      </section>
    </main>
    <footer class="landing-footer">
      <RouterLink to="/">Anglers Index</RouterLink>
      <p>For the love of fishing.</p>
      <a href="mailto:anglersindex@gmail.com">Get in touch ↗</a>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  background: #f7f9fa;
  color: #243c50;
}
.landing-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 clamp(16px, 6vw, 96px);
  background: #f7f9fa;
  border-bottom: 1px solid #d9e1e7;
}
.landing-brand {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.5px;
}
.landing-brand span {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  background: #28496d;
  color: white;
  border-radius: 10px;
}
.hero {
  min-height: min(780px, calc(100svh - 68px));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(72px, 10vw, 140px) clamp(24px, 7vw, 110px) 28px;
  background:
    linear-gradient(90deg, #102b35e8, #102b3599 60%, #102b3533),
    url('/images/homepage-background.jpg') center / cover;
  color: white;
}
.hero-content {
  max-width: 840px;
}
.hero-eyebrow {
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 2px;
  margin-bottom: 28px;
}
.hero h1 {
  font-size: clamp(40px, 5.3vw, 76px);
  font-weight: 550;
  line-height: 1.1;
  letter-spacing: -2.5px;
  margin-bottom: 26px;
}
.hero h1 em {
  font-family: Georgia, serif;
  font-weight: 400;
  color: #e3e8cb;
}
.hero-intro {
  max-width: 480px;
  font-size: 17px;
  line-height: 1.8;
  color: #e0e8e5;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 26px;
  margin: 34px 0 70px;
}
.hero-cta {
  background: #e0e9bc;
  border-color: #e0e9bc;
  color: #243c35;
  padding: 16px 22px;
  gap: 24px;
  font-size: 14px;
}
.hero-cta:hover {
  background: #eff6d6;
}
.explore {
  display: inline-flex;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ffffff66;
  font-size: 14px;
}
.hero-caption {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid #ffffff40;
  padding-top: 24px;
  font-size: 9px;
  letter-spacing: 1.8px;
  color: #d9e3dd;
}
.features {
  padding: 80px clamp(24px, 7vw, 110px) 90px;
  scroll-margin-top: 90px;
}
.features h2 {
  font-size: clamp(30px, 3.6vw, 46px);
  letter-spacing: -1.4px;
  font-weight: 550;
  line-height: 1.2;
  margin: 16px 0 18px;
}
.features-intro {
  color: #627080;
  line-height: 1.7;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 34px;
  margin-top: 44px;
}
.feature {
  border-top: 1px solid #cbd5df;
  padding-top: 28px;
}
.feature-icon {
  margin-bottom: 30px;
  color: #547062;
}
.feature h3 {
  font-size: 23px;
  letter-spacing: -0.7px;
  margin: 14px 0;
}
.feature > p:last-child {
  font-size: 14px;
  line-height: 1.85;
  color: #627080;
  max-width: 350px;
}
.landing-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid #d9e1e7;
  padding: 30px clamp(24px, 7vw, 110px);
  font-size: 13px;
}
.landing-footer > a:first-child {
  font-weight: 750;
}
.landing-footer p {
  color: #627080;
}
@media (max-width: 700px) {
  .hero {
    min-height: 650px;
  }
  .hero h1 {
    letter-spacing: -1.5px;
  }
  .hero-caption span:last-child {
    display: none;
  }
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .feature-icon {
    margin-bottom: 18px;
  }
  .features {
    padding-top: 52px;
    padding-bottom: 52px;
  }
  .feature > p:last-child {
    max-width: none;
  }
  .landing-footer p {
    display: none;
  }
}
@media (max-width: 420px) {
  .landing-brand {
    font-size: 15px;
  }
  .landing-brand span {
    display: none;
  }
}
</style>

<script setup>
import { computed, ref, watch } from 'vue'
import { Headphones, Video, BookOpen, ArrowRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import ResourceCard from '@/components/resources/ResourceCard.vue'
import { useSession } from '@/composables/useSession'
import { resources } from '@/data/resources'
const props = defineProps({ kind: { type: String, default: '' } })
const { user, signOut } = useSession()
const search = ref('')
watch(
  () => props.kind,
  () => {
    search.value = ''
  },
)
const categories = [
  {
    key: 'podcasts',
    title: 'Fishing podcasts',
    description: 'Conversations, interviews, and fishing advice.',
    icon: Headphones,
  },
  {
    key: 'channels',
    title: 'YouTube channels',
    description: 'Fishing trips, tactics, and on-the-water instruction.',
    icon: Video,
  },
  {
    key: 'how-to-videos',
    title: 'How-to videos',
    description: 'A collection of step-by-step fishing videos.',
    icon: Video,
    soon: true,
  },
  {
    key: 'blog',
    title: 'Blog',
    description: 'Fishing stories, guides, and ideas.',
    icon: BookOpen,
    soon: true,
  },
]
const category = computed(() => categories.find((item) => item.key === props.kind))
const rows = computed(() =>
  (resources[props.kind] ?? []).filter((item) =>
    `${item.name} ${item.topics ?? ''}`.toLowerCase().includes(search.value.trim().toLowerCase()),
  ),
)
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="signOut" />
  <main id="main-content" class="list-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Learn &amp; explore</p>
        <h1>{{ category?.title ?? 'Resources' }}</h1>
        <p class="muted">
          {{
            category?.description ?? 'Podcasts, videos, and channels from the fishing community.'
          }}
        </p>
      </div>
      <AppButton v-if="kind" to="/resources" variant="secondary">All resources</AppButton>
    </header>
    <div v-if="!kind" class="resource-grid">
      <RouterLink
        v-for="item in categories"
        :key="item.key"
        :to="`/resources/${item.key}`"
        class="category-card"
        ><component :is="item.icon" :size="26" aria-hidden="true" />
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
        <span
          >{{ item.soon ? 'Coming soon' : 'Explore'
          }}<ArrowRight :size="16" aria-hidden="true" /></span
      ></RouterLink>
    </div>
    <ContentPanel
      v-else-if="category?.soon"
      :title="`${category.title} — coming soon`"
      description="This collection hasn’t been added yet. Explore the podcasts and YouTube channels in the meantime."
      ><AppButton to="/resources" variant="secondary">Browse resources</AppButton></ContentPanel
    >
    <template v-else>
      <label class="resource-search"
        >Search {{ kind === 'podcasts' ? 'podcasts' : 'channels'
        }}<input v-model="search" type="search" placeholder="Search by name or topic"
      /></label>
      <div v-if="rows.length" class="resource-grid">
        <ResourceCard v-for="item in rows" :key="item.link" :resource="item" :kind="kind" />
      </div>
      <ContentPanel v-else title="No matching resources" description="Try another name or topic."
        ><AppButton variant="secondary" @click="search = ''">Clear search</AppButton></ContentPanel
      >
    </template>
  </main>
</template>
<style scoped>
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 18px;
}
.category-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 24px;
  border: 1px solid var(--border);
  border-top: 3px solid var(--blue);
  border-radius: 12px;
  background: white;
}
.category-card:hover {
  background: #f0f5fa;
  border-color: #8ea7be;
}
.category-card > svg {
  color: var(--blue);
}
.category-card p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}
.category-card span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--blue);
  font-size: 13px;
  font-weight: 600;
  margin-top: auto;
}
.resource-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 420px;
  font-size: 13px;
  font-weight: 600;
}
.resource-search input {
  padding: 11px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--navy);
  background: white;
  font: inherit;
}
@media (max-width: 650px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

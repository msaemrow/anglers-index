<script setup>
defineProps({ variant: { type: String, default: 'list' } })
</script>

<template>
  <main :class="variant === 'sign-in' ? 'sign-in-layout' : 'list-page'"><slot /></main>
</template>

<style scoped>
.list-page {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 36px clamp(20px, 5vw, 64px) 48px;
  display: flex;
  flex-direction: column;
  gap: var(--page-gap);
}
.list-page > :deep(.page-header) {
  padding-bottom: 22px;
  border-bottom: 2px solid #a9bdcf;
}
.list-page :deep(.panel) {
  border-top: 3px solid var(--blue);
  box-shadow: 0 3px 12px #192b430a;
}
.list-page :deep(.panel__header) {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
.list-page :deep(input::placeholder) {
  color: #65778a;
  opacity: 1;
}
.list-page :deep(input[type='checkbox']) {
  accent-color: var(--blue);
}
.sign-in-layout {
  display: grid;
  place-items: center;
  min-height: calc(100dvh - var(--navbar-height));
  padding: 36px 20px;
}
.list-page.compact-list {
  padding-top: 18px;
  gap: 12px;
}
.list-page.compact-list > :deep(.page-header) {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding-bottom: 10px;
  margin: 0;
  border-bottom-width: 1px;
}
.list-page.compact-list :deep(h1) {
  font-size: 24px;
  letter-spacing: -0.5px;
}
.list-page.compact-list :deep(.directory-count) {
  display: inline-block;
  margin-left: 6px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: normal;
}
.list-page.compact-list :deep(.page-header .button),
.list-page.compact-list :deep(.toolbar > .button),
.list-page.compact-list :deep(.filters > .button) {
  min-height: 34px;
  padding: 6px 10px;
  font-size: 12px;
}
.list-page.compact-list :deep(.page-actions),
.list-page.compact-list :deep(.page-header .actions) {
  gap: 6px;
}
.list-page.compact-list :deep(.panel) {
  padding: 16px;
}
.list-page.compact-list :deep(.summary) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px 22px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  font-size: 12px;
}
.list-page.compact-list :deep(.summary > div) {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.list-page.compact-list :deep(.summary dt) {
  font-size: 12px;
}
.list-page.compact-list :deep(.summary dd),
.list-page.compact-list :deep(.summary strong) {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}
.list-page.compact-list :deep(.toolbar),
.list-page.compact-list :deep(.filters) {
  flex-direction: row;
  align-items: end;
  gap: 10px 12px;
  margin-bottom: 12px;
}
.list-page.compact-list :deep(.toolbar label),
.list-page.compact-list :deep(.filters label) {
  gap: 4px;
  min-width: 0;
}
.list-page.compact-list :deep(.search) {
  flex: 1 1 220px;
  min-width: 0;
  max-width: 360px;
}
.list-page.compact-list :deep(.toolbar input:not([type='checkbox'])),
.list-page.compact-list :deep(.toolbar select),
.list-page.compact-list :deep(.filters input),
.list-page.compact-list :deep(.filters select) {
  min-height: 36px;
  padding: 7px 10px;
  font-size: 13px;
}
.list-page.compact-list :deep(.checkbox) {
  min-height: 36px;
}
@media (max-width: 650px) {
  .list-page.compact-list {
    padding: 12px 12px 32px;
    gap: 10px;
  }
  .list-page.compact-list :deep(h1) {
    font-size: 21px;
  }
  .list-page.compact-list :deep(.panel) {
    padding: 12px;
  }
  .list-page.compact-list :deep(.toolbar),
  .list-page.compact-list :deep(.filters) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 10px;
  }
  .list-page.compact-list :deep(.search) {
    grid-column: 1 / -1;
    max-width: none;
  }
  .list-page.compact-list :deep(.checkbox) {
    grid-column: 1 / -1;
  }
  .list-page.compact-list :deep(.page-header > .button) {
    font-size: 12px;
    gap: 6px;
  }
}
@media (pointer: coarse) {
  .list-page.compact-list :deep(.page-header .button),
  .list-page.compact-list :deep(.toolbar > .button),
  .list-page.compact-list :deep(.filters > .button),
  .list-page.compact-list :deep(.checkbox) {
    min-height: 44px;
  }
  .list-page.compact-list :deep(.toolbar input:not([type='checkbox'])),
  .list-page.compact-list :deep(.toolbar select),
  .list-page.compact-list :deep(.filters input),
  .list-page.compact-list :deep(.filters select) {
    min-height: 44px;
    font-size: 16px;
  }
}
.list-page.header-page {
  padding-top: 18px;
}
@media (max-width: 650px) {
  .list-page.header-page {
    padding: 12px 12px 32px;
  }
}
</style>

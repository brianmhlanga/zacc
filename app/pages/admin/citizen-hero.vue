<template>
  <NuxtLayout name="dashboard">
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Citizens Action (Hero)</h1>
          <p class="mt-2 text-gray-600">
            Homepage hero right column: surveys, announcements, links, and QR codes.
          </p>
        </div>
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          outlined
          severity="secondary"
          :loading="loading"
          @click="loadAll"
        />
      </div>

      <Card class="border-0 shadow-md">
        <template #title>Panel settings</template>
        <template #content>
          <div v-if="panel" class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2 flex items-center gap-3">
              <InputSwitch v-model="panelForm.isEnabled" inputId="panelEnabled" />
              <label for="panelEnabled" class="text-sm font-semibold text-zaccBlack">Show on website</label>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-zaccBlack mb-1">Panel title</label>
              <InputText v-model="panelForm.title" class="w-full" maxlength="200" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-zaccBlack mb-1">Subtitle</label>
              <Textarea v-model="panelForm.subtitle" rows="2" class="w-full" auto-resize />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-zaccBlack mb-1">Footer quote</label>
              <Textarea v-model="panelForm.footerText" rows="2" class="w-full" auto-resize />
            </div>
            <div>
              <label class="block text-sm font-semibold text-zaccBlack mb-1">Footer button label</label>
              <InputText v-model="panelForm.footerCtaLabel" class="w-full" maxlength="120" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-zaccBlack mb-1">Footer button URL</label>
              <InputText v-model="panelForm.footerCtaUrl" class="w-full" placeholder="/contact or https://..." />
            </div>
            <div class="md:col-span-2">
              <Button
                label="Save panel"
                icon="pi pi-check"
                :loading="savingPanel"
                style="background: #209341; border-color: #209341"
                @click="savePanel"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card class="border-0 shadow-md">
        <template #title>Actions list</template>
        <template #content>
          <div class="flex justify-end mb-4">
            <Button
              label="Add action"
              icon="pi pi-plus"
              style="background: #209341; border-color: #209341"
              @click="openCreate"
            />
          </div>
          <DataTable :value="actions" data-key="id" striped-rows class="text-sm" :loading="loading">
            <Column header="#" style="width: 3rem">
              <template #body="{ index }">
                {{ index + 1 }}
              </template>
            </Column>
            <Column field="title" header="Title" />
            <Column field="actionStyle" header="Style" />
            <Column field="isPublished" header="Published">
              <template #body="{ data }">
                <Tag :value="data.isPublished ? 'Yes' : 'No'" :severity="data.isPublished ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column header="Order" style="width: 8rem">
              <template #body="{ data, index }">
                <div class="flex gap-1">
                  <Button
                    icon="pi pi-arrow-up"
                    text
                    rounded
                    :disabled="index === 0 || reordering"
                    @click="move(index, -1)"
                  />
                  <Button
                    icon="pi pi-arrow-down"
                    text
                    rounded
                    :disabled="index === actions.length - 1 || reordering"
                    @click="move(index, 1)"
                  />
                </div>
              </template>
            </Column>
            <Column header="Actions" style="min-width: 8rem">
              <template #body="{ data }">
                <Button icon="pi pi-pencil" text rounded severity="warning" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded severity="danger" @click="removeRow(data)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <Dialog
        v-model:visible="dialogVisible"
        :header="editingId ? 'Edit action' : 'New action'"
        :modal="true"
        :style="{ width: '95vw', maxWidth: '560px' }"
        @hide="resetActionForm"
      >
        <div class="space-y-4 pt-2">
          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-1">Title *</label>
            <InputText v-model="actionForm.title" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-1">Description</label>
            <Textarea v-model="actionForm.description" rows="3" class="w-full" auto-resize />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-zaccBlack mb-1">Icon</label>
              <Dropdown
                v-model="actionForm.iconName"
                :options="iconOptions"
                option-label="label"
                option-value="value"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-zaccBlack mb-1">Icon tone</label>
              <Dropdown
                v-model="actionForm.iconTone"
                :options="toneOptions"
                option-label="label"
                option-value="value"
                class="w-full"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-1">Action style *</label>
            <Dropdown
              v-model="actionForm.actionStyle"
              :options="styleOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
            <p class="mt-1 text-xs text-gray-500">
              Button / link need label + URL. QR styles need an uploaded QR image.
            </p>
          </div>
          <div v-if="needsCta">
            <label class="block text-sm font-semibold text-zaccBlack mb-1">Button or link text *</label>
            <InputText v-model="actionForm.ctaLabel" class="w-full" placeholder="e.g. Participate →" />
          </div>
          <div v-if="needsCta">
            <label class="block text-sm font-semibold text-zaccBlack mb-1">URL *</label>
            <InputText v-model="actionForm.ctaUrl" class="w-full" placeholder="https://... or /report" />
          </div>
          <div v-if="needsQr">
            <label class="block text-sm font-semibold text-zaccBlack mb-1">QR code image</label>
            <div class="flex flex-wrap items-end gap-3">
              <input ref="qrInputRef" type="file" accept="image/*" class="hidden" @change="onQrFile" />
              <Button label="Upload image" icon="pi pi-upload" outlined @click="qrInputRef?.click()" />
              <img v-if="actionForm.qrImageUrl" :src="previewUrl(actionForm.qrImageUrl)" alt="QR" class="h-20 w-20 rounded border object-contain" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="actionForm.isPublished" inputId="pub" />
            <label for="pub" class="text-sm font-semibold text-zaccBlack">Published</label>
          </div>
          <p v-if="actionError" class="text-sm text-red-600">{{ actionError }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <Button label="Cancel" severity="secondary" outlined @click="dialogVisible = false" />
            <Button
              label="Save"
              icon="pi pi-check"
              :loading="savingAction"
              style="background: #209341; border-color: #209341"
              @click="saveAction"
            />
          </div>
        </div>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

useHead({ title: 'Citizens Action (Hero) - ZACC CMS' })

definePageMeta({ middleware: 'admin' })

const toast = useToast()
const qrInputRef = ref<HTMLInputElement | null>(null)

const loading = ref(false)
const savingPanel = ref(false)
const savingAction = ref(false)
const reordering = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const actionError = ref('')

const panel = ref<any>(null)
const actions = ref<any[]>([])

const panelForm = reactive({
  title: '',
  subtitle: '',
  footerText: '',
  footerCtaLabel: '',
  footerCtaUrl: '',
  isEnabled: true
})

const actionForm = reactive({
  title: '',
  description: '',
  iconName: 'users',
  iconTone: 'neutral',
  actionStyle: 'BUTTON' as 'BUTTON' | 'LINK' | 'QR' | 'BUTTON_QR',
  ctaLabel: '',
  ctaUrl: '',
  qrImageUrl: '',
  isPublished: true
})

const iconOptions = [
  { label: 'Users', value: 'users' },
  { label: 'Megaphone', value: 'megaphone' },
  { label: 'Chart', value: 'chart-bar' },
  { label: 'Comments', value: 'comments' },
  { label: 'Bullhorn', value: 'bullhorn' },
  { label: 'Document', value: 'file' },
  { label: 'PDF', value: 'file-pdf' },
  { label: 'Inbox', value: 'inbox' },
  { label: 'Flag', value: 'flag' },
  { label: 'QR', value: 'qrcode' }
]

const toneOptions = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Red', value: 'red' },
  { label: 'Emerald', value: 'emerald' },
  { label: 'Gold', value: 'gold' }
]

const styleOptions = [
  { label: 'Gold button', value: 'BUTTON' },
  { label: 'Text link', value: 'LINK' },
  { label: 'QR only', value: 'QR' },
  { label: 'Button + QR', value: 'BUTTON_QR' }
]

const needsCta = computed(
  () =>
    actionForm.actionStyle === 'BUTTON' ||
    actionForm.actionStyle === 'LINK' ||
    actionForm.actionStyle === 'BUTTON_QR'
)
const needsQr = computed(() => actionForm.actionStyle === 'QR' || actionForm.actionStyle === 'BUTTON_QR')

function previewUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return `/api${url}`
  return url
}

async function loadAll() {
  loading.value = true
  try {
    const data: any = await $fetch('/api/citizen-hero')
    panel.value = data.panel
    actions.value = data.actions || []
    panelForm.title = data.panel.title || ''
    panelForm.subtitle = data.panel.subtitle || ''
    panelForm.footerText = data.panel.footerText || ''
    panelForm.footerCtaLabel = data.panel.footerCtaLabel || ''
    panelForm.footerCtaUrl = data.panel.footerCtaUrl || ''
    panelForm.isEnabled = Boolean(data.panel.isEnabled)
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.data?.message || e?.message || 'Failed to load',
      life: 4000
    })
  } finally {
    loading.value = false
  }
}

async function savePanel() {
  savingPanel.value = true
  try {
    await $fetch('/api/citizen-hero', {
      method: 'PUT',
      body: { ...panelForm }
    })
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Panel updated', life: 2500 })
    await loadAll()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.data?.message || e?.message || 'Save failed',
      life: 4000
    })
  } finally {
    savingPanel.value = false
  }
}

function resetActionForm() {
  editingId.value = null
  actionError.value = ''
  actionForm.title = ''
  actionForm.description = ''
  actionForm.iconName = 'users'
  actionForm.iconTone = 'neutral'
  actionForm.actionStyle = 'BUTTON'
  actionForm.ctaLabel = ''
  actionForm.ctaUrl = ''
  actionForm.qrImageUrl = ''
  actionForm.isPublished = true
}

function openCreate() {
  resetActionForm()
  editingId.value = null
  dialogVisible.value = true
}

function openEdit(row: any) {
  resetActionForm()
  editingId.value = row.id
  actionForm.title = row.title
  actionForm.description = row.description || ''
  actionForm.iconName = row.iconName || 'users'
  actionForm.iconTone = row.iconTone || 'neutral'
  actionForm.actionStyle = row.actionStyle
  actionForm.ctaLabel = row.ctaLabel || ''
  actionForm.ctaUrl = row.ctaUrl || ''
  actionForm.qrImageUrl = row.qrImageUrl || ''
  actionForm.isPublished = Boolean(row.isPublished)
  dialogVisible.value = true
}

function validateClient(): boolean {
  actionError.value = ''
  if (needsCta.value) {
    if (!actionForm.ctaLabel?.trim() || !actionForm.ctaUrl?.trim()) {
      actionError.value = 'CTA label and URL are required for this style.'
      return false
    }
  }
  if (needsQr.value) {
    if (!actionForm.qrImageUrl?.trim()) {
      actionError.value = 'Upload a QR image for this style.'
      return false
    }
  }
  if (!actionForm.title?.trim()) {
    actionError.value = 'Title is required.'
    return false
  }
  return true
}

async function saveAction() {
  if (!validateClient()) return
  savingAction.value = true
  try {
    const body = {
      title: actionForm.title.trim(),
      description: actionForm.description?.trim() || null,
      iconName: actionForm.iconName,
      iconTone: actionForm.iconTone,
      actionStyle: actionForm.actionStyle,
      ctaLabel: actionForm.ctaLabel?.trim() || null,
      ctaUrl: actionForm.ctaUrl?.trim() || null,
      qrImageUrl: actionForm.qrImageUrl?.trim() || null,
      isPublished: actionForm.isPublished
    }
    if (editingId.value) {
      await $fetch(`/api/citizen-hero/actions/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/citizen-hero/actions', { method: 'POST', body })
    }
    toast.add({ severity: 'success', summary: 'Saved', life: 2500 })
    dialogVisible.value = false
    await loadAll()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.data?.statusMessage || e?.data?.message || e?.message || 'Save failed',
      life: 5000
    })
  } finally {
    savingAction.value = false
  }
}

async function removeRow(row: any) {
  if (!confirm(`Delete “${row.title}”?`)) return
  try {
    await $fetch(`/api/citizen-hero/actions/${row.id}`, { method: 'DELETE' })
    toast.add({ severity: 'success', summary: 'Deleted', life: 2500 })
    await loadAll()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.data?.message || e?.message,
      life: 4000
    })
  }
}

async function move(index: number, delta: number) {
  const j = index + delta
  if (j < 0 || j >= actions.value.length) return
  const copy = [...actions.value]
  const t = copy[index]
  copy[index] = copy[j]
  copy[j] = t
  const orderedIds = copy.map((a) => a.id)
  reordering.value = true
  try {
    await $fetch('/api/citizen-hero/reorder-actions', {
      method: 'PUT',
      body: { orderedIds }
    })
    await loadAll()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Reorder failed',
      detail: e?.data?.message || e?.message,
      life: 4000
    })
  } finally {
    reordering.value = false
  }
}

async function onQrFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res: any = await $fetch('/api/upload', { method: 'POST', body: fd })
    actionForm.qrImageUrl = res.path || ''
    toast.add({ severity: 'success', summary: 'Uploaded', life: 2000 })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Upload failed',
      detail: e?.data?.message || e?.message,
      life: 4000
    })
  }
}

onMounted(() => {
  loadAll()
})
</script>

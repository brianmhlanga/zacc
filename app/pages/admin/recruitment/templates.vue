<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="mb-6">
        <h1 class="text-3xl font-extrabold text-zaccBlack">Notification templates</h1>
        <p class="mt-2 text-gray-600">
          What candidates receive at each stage. Placeholders in <code>{{ OPEN }}braces{{ CLOSE }}</code>
          are filled in when the message is sent.
        </p>
      </div>

      <div class="flex gap-2 mb-5">
        <NuxtLink to="/admin/recruitment/stages"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Pipeline stages</NuxtLink>
        <NuxtLink to="/admin/recruitment/templates"
          class="px-4 py-2 rounded-lg text-sm font-semibold bg-zaccBlack/10 text-zaccGreen">Notification templates</NuxtLink>
        <NuxtLink to="/admin/recruitment/outbox"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Send queue</NuxtLink>
      </div>

      <div v-if="loading" class="py-16 text-center text-gray-500">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <Card v-else class="border-0 shadow-md">
        <template #content>
          <DataTable :value="templates" stripedRows dataKey="id">
            <Column field="name" header="Template">
              <template #body="{ data }">
                <div class="font-semibold text-zaccBlack">{{ data.name }}</div>
                <div class="text-xs text-gray-500">{{ data.description }}</div>
              </template>
            </Column>
            <Column field="key" header="Event">
              <template #body="{ data }">
                <code class="text-xs text-gray-600">{{ data.key }}</code>
              </template>
            </Column>
            <Column header="Used by">
              <template #body="{ data }">
                <span class="text-sm">{{ data._count.stages }} stage(s)</span>
                <div class="text-xs text-gray-500">{{ data._count.outbox }} sent/queued</div>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag :value="data.isActive ? 'Active' : 'Inactive'"
                  :severity="data.isActive ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column header="" style="width:80px">
              <template #body="{ data }">
                <Button icon="pi pi-pencil" text rounded @click="edit(data)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <Dialog v-model:visible="dialogVisible" :header="form.name" modal class="w-[95vw] max-w-5xl">
        <div class="grid lg:grid-cols-2 gap-5">
          <div>
            <label class="block mb-3">
              <span class="text-xs font-semibold text-gray-600">Subject</span>
              <InputText v-model="form.subject" class="w-full mt-1" />
            </label>

            <span class="text-xs font-semibold text-gray-600">Body</span>
            <Textarea v-model="form.bodyHtml" rows="18" class="w-full mt-1 font-mono text-xs" />

            <label class="flex items-center gap-2 text-sm mt-3">
              <Checkbox v-model="form.isActive" binary :disabled="editing?.isSystem" />
              Active
              <span v-if="editing?.isSystem" class="text-xs text-gray-400">
                — system templates cannot be deactivated
              </span>
            </label>
          </div>

          <div>
            <span class="text-xs font-semibold text-gray-600">Available placeholders</span>
            <div class="flex flex-wrap gap-1.5 mt-2 mb-4">
              <button v-for="t in availableTokens" :key="t" type="button"
                class="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-mono hover:border-zaccGreen"
                @click="insertToken(t)">
                {{ OPEN }}{{ t }}{{ CLOSE }}
              </button>
            </div>

            <span class="text-xs font-semibold text-gray-600">Preview</span>
            <div class="mt-1 rounded-lg border border-gray-200 overflow-hidden">
              <div class="bg-gray-50 px-3 py-2 text-xs border-b border-gray-200">
                <strong>Subject:</strong> {{ preview.subject || form.subject }}
              </div>
              <iframe v-if="preview.html" :srcdoc="preview.html" class="w-full h-[380px] bg-white"
                sandbox="" title="Email preview" />
              <div v-else class="p-6 text-center text-sm text-gray-400">
                Save to render a preview with sample values.
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Cancel" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="Save template" icon="pi pi-check" :loading="saving"
            style="background:#209341;border-color:#209341" @click="save" />
        </template>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Notification templates - ZACC CMS' })

const toast = useToast()

// Rendering literal braces inside an interpolation is a Vue parse error.
const OPEN = '{{'
const CLOSE = '}}'
const templates = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref<any>(null)
const preview = reactive<{ subject: string; html: string }>({ subject: '', html: '' })

const form = reactive<any>({
  id: '', name: '', description: '', subject: '', bodyHtml: '', bodyText: '', isActive: true
})

const COMMON_TOKENS = [
  'firstName', 'lastName', 'fullName', 'reference', 'status', 'statusDescription',
  'vacancy.title', 'vacancy.department', 'vacancy.grade', 'vacancy.closingDate',
  'commission.email', 'commission.siteUrl'
]

const availableTokens = computed(() => {
  const declared = Array.isArray(editing.value?.variables) ? editing.value.variables : []
  return [...new Set([...declared, ...COMMON_TOKENS])].sort()
})

const insertToken = (token: string) => {
  form.bodyHtml += `{{${token}}}`
}

const load = async () => {
  loading.value = true
  try {
    templates.value = await $fetch('/api/recruitment/config/templates')
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load templates', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const edit = (t: any) => {
  editing.value = t
  Object.assign(form, {
    id: t.id, name: t.name, description: t.description,
    subject: t.subject, bodyHtml: t.bodyHtml, bodyText: t.bodyText, isActive: t.isActive
  })
  preview.subject = ''
  preview.html = ''
  dialogVisible.value = true
}

const save = async () => {
  saving.value = true
  try {
    const res = await $fetch<any>('/api/recruitment/config/templates', { method: 'PUT', body: { ...form } })
    preview.subject = res.preview.subject
    preview.html = res.preview.html
    toast.add({ severity: 'success', summary: 'Saved', detail: res.message, life: 3000 })
    await load()
  } catch (e: any) {
    // The most useful failure here is an unknown placeholder, which the server
    // names explicitly rather than letting it reach a candidate as a blank.
    toast.add({
      severity: 'error', summary: 'Could not save',
      detail: e.data?.statusMessage || 'Failed', life: 8000
    })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

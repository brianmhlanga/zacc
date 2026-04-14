<template>
  <NuxtLayout name="dashboard">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-zaccBlack">Permissions</h1>
          <p class="text-sm text-zaccBlack/70">Assign per-user backoffice access for each module and action.</p>
        </div>
        <Button label="Refresh" icon="pi pi-refresh" outlined :loading="loading" @click="loadData" />
      </div>

      <Card>
        <template #content>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="md:col-span-2">
              <label class="text-sm font-semibold text-zaccBlack block mb-1">Select user</label>
              <Dropdown
                v-model="selectedUserId"
                :options="userOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                placeholder="Choose a user account"
                @change="onUserChange"
              />
            </div>
            <div v-if="selectedUser" class="rounded-lg border border-zaccBlack/10 p-3">
              <div class="text-xs text-zaccBlack/60">Role</div>
              <div class="font-semibold text-zaccBlack">{{ selectedUser.role }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card v-if="selectedUser">
        <template #content>
          <DataTable :value="modules" responsiveLayout="scroll" class="text-sm">
            <Column header="Module">
              <template #body="{ data }">
                <div class="flex items-center justify-between gap-2">
                  <span>{{ data.label }}</span>
                  <Checkbox
                    :modelValue="isRowAllSelected(data.key)"
                    binary
                    @update:modelValue="toggleRowAll(data.key, $event)"
                  />
                </div>
              </template>
            </Column>
            <Column header="View">
              <template #header>
                <div class="flex items-center justify-between gap-2 w-full">
                  <span>View</span>
                  <Checkbox
                    :modelValue="isColumnAllSelected('view')"
                    binary
                    @update:modelValue="toggleColumnAll('view', $event)"
                  />
                </div>
              </template>
              <template #body="{ data }">
                <Checkbox :modelValue="hasAction(data.key, 'view')" binary @update:modelValue="toggleAction(data.key, 'view', $event)" />
              </template>
            </Column>
            <Column header="Create">
              <template #header>
                <div class="flex items-center justify-between gap-2 w-full">
                  <span>Create</span>
                  <Checkbox
                    :modelValue="isColumnAllSelected('create')"
                    binary
                    @update:modelValue="toggleColumnAll('create', $event)"
                  />
                </div>
              </template>
              <template #body="{ data }">
                <Checkbox :modelValue="hasAction(data.key, 'create')" binary @update:modelValue="toggleAction(data.key, 'create', $event)" />
              </template>
            </Column>
            <Column header="Update">
              <template #header>
                <div class="flex items-center justify-between gap-2 w-full">
                  <span>Update</span>
                  <Checkbox
                    :modelValue="isColumnAllSelected('update')"
                    binary
                    @update:modelValue="toggleColumnAll('update', $event)"
                  />
                </div>
              </template>
              <template #body="{ data }">
                <Checkbox :modelValue="hasAction(data.key, 'update')" binary @update:modelValue="toggleAction(data.key, 'update', $event)" />
              </template>
            </Column>
            <Column header="Delete">
              <template #header>
                <div class="flex items-center justify-between gap-2 w-full">
                  <span>Delete</span>
                  <Checkbox
                    :modelValue="isColumnAllSelected('delete')"
                    binary
                    @update:modelValue="toggleColumnAll('delete', $event)"
                  />
                </div>
              </template>
              <template #body="{ data }">
                <Checkbox :modelValue="hasAction(data.key, 'delete')" binary @update:modelValue="toggleAction(data.key, 'delete', $event)" />
              </template>
            </Column>
          </DataTable>
          <div class="mt-4 flex justify-end gap-2">
            <Button label="Reset" severity="secondary" outlined @click="resetDraft" />
            <Button label="Save Permissions" icon="pi pi-save" :loading="saving" @click="savePermissions" />
          </div>
        </template>
      </Card>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Permissions - ZACC CMS' })

type Action = 'view' | 'create' | 'update' | 'delete'
type PermissionMap = Record<string, Action[]>

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const users = ref<any[]>([])
const modules = ref<Array<{ key: string; label: string }>>([])
const selectedUserId = ref('')
const draftPermissions = ref<PermissionMap>({})

const selectedUser = computed(() => users.value.find((u) => u.id === selectedUserId.value) || null)
const userOptions = computed(() =>
  users.value.map((u) => ({
    label: `${u.name || u.email} (${u.role})`,
    value: u.id
  }))
)

const normalizePermissions = (map: any): PermissionMap => {
  const out: PermissionMap = {}
  for (const [k, actions] of Object.entries(map || {})) {
    out[k] = Array.from(new Set((actions as Action[]).filter(Boolean)))
  }
  return out
}

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await $fetch('/api/permissions')
    users.value = res.users || []
    modules.value = res.modules || []
    if (!selectedUserId.value && users.value.length > 0) {
      selectedUserId.value = users.value[0].id
    }
    resetDraft()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Load failed',
      detail: error?.data?.statusMessage || 'Could not load permissions',
      life: 3500
    })
  } finally {
    loading.value = false
  }
}

const resetDraft = () => {
  draftPermissions.value = normalizePermissions(selectedUser.value?.permissions || {})
}

const onUserChange = () => {
  resetDraft()
}

const hasAction = (moduleKey: string, action: Action) => {
  return (draftPermissions.value[moduleKey] || []).includes(action)
}

const toggleAction = (moduleKey: string, action: Action, checked: boolean) => {
  const current = new Set(draftPermissions.value[moduleKey] || [])
  if (checked) current.add(action)
  else current.delete(action)
  draftPermissions.value[moduleKey] = Array.from(current)
}

const ACTIONS: Action[] = ['view', 'create', 'update', 'delete']

const isRowAllSelected = (moduleKey: string) => {
  return ACTIONS.every((a) => hasAction(moduleKey, a))
}

const toggleRowAll = (moduleKey: string, checked: boolean) => {
  draftPermissions.value[moduleKey] = checked ? [...ACTIONS] : []
}

const isColumnAllSelected = (action: Action) => {
  if (modules.value.length === 0) return false
  return modules.value.every((m) => hasAction(m.key, action))
}

const toggleColumnAll = (action: Action, checked: boolean) => {
  modules.value.forEach((m) => {
    toggleAction(m.key, action, checked)
  })
}

const savePermissions = async () => {
  if (!selectedUser.value) return
  saving.value = true
  try {
    await $fetch(`/api/permissions/${selectedUser.value.id}`, {
      method: 'PUT',
      body: {
        permissions: draftPermissions.value
      }
    })
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Permissions updated', life: 2200 })
    await loadData()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: error?.data?.statusMessage || 'Could not save permissions',
      life: 3500
    })
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

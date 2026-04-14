<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Tenders</h1>
          <p class="mt-2 text-gray-600">Manage tenders and RFQs with document uploads</p>
        </div>
        <Button label="Add tender" icon="pi pi-plus" @click="openCreate" style="background: #209341; border-color: #209341;" />
      </div>

      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable :value="items" :loading="loading" dataKey="id" paginator :rows="10" stripedRows class="text-sm">
            <Column field="title" header="Title" sortable />
            <Column field="type" header="Type" sortable />
            <Column field="category.name" header="Category" sortable />
            <Column field="closingDate" header="Closing" sortable>
              <template #body="{ data }">{{ formatDate(data.closingDate) }}</template>
            </Column>
            <Column field="_count.bids" header="Bids">
              <template #body="{ data }">{{ data._count?.bids || 0 }}</template>
            </Column>
            <Column field="isPublished" header="Published">
              <template #body="{ data }"><Tag :value="data.isPublished ? 'Yes' : 'No'" :severity="data.isPublished ? 'success' : 'warning'" /></template>
            </Column>
            <Column header="Actions" style="width: 220px">
              <template #body="{ data }">
                <Button icon="pi pi-eye" rounded text severity="secondary" @click="openViewBidsPage(data)" />
                <Button icon="pi pi-pencil" rounded text severity="info" :disabled="!data.canEdit" @click="openEdit(data)" />
                <Button icon="pi pi-trash" rounded text severity="danger" :disabled="!data.canDelete" @click="confirmDelete(data)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <Dialog v-model:visible="dialogVisible" :header="editId ? 'Edit tender' : 'New tender'" modal class="w-[96vw] max-w-6xl">
        <form class="space-y-4" @submit.prevent="save">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Title *</label>
              <InputText v-model="form.title" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Reference</label>
              <InputText v-model="form.reference" class="w-full" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Type *</label>
              <Dropdown v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Category *</label>
              <Dropdown v-model="form.categoryId" :options="categories" optionLabel="name" optionValue="id" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Closing date *</label>
              <Calendar v-model="form.closingDate" class="w-full" showTime hourFormat="24" showIcon />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Tender details *</label>
            <Editor v-model="form.details" editorStyle="height: 180px" />
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Tender documents (upload)</label>
            <FileUpload mode="basic" customUpload auto chooseLabel="Upload document" @uploader="uploadTenderDoc" />
            <ul class="mt-2 space-y-1 text-sm" v-if="form.documents.length">
              <li v-for="(d, i) in form.documents" :key="i" class="flex items-center justify-between">
                <a :href="d.fileUrl" target="_blank" class="text-zaccGreen hover:underline">{{ d.fileName }}</a>
                <Button icon="pi pi-times" text rounded severity="danger" @click="form.documents.splice(i, 1)" />
              </li>
            </ul>
          </div>

          <div v-if="form.type === 'RFQ'" class="rounded-xl border border-zaccGreen/20 bg-zaccGreen/5 p-4">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-semibold">RFQ Line items *</label>
              <Button label="Add line item" icon="pi pi-plus" size="small" @click="addLineItem" />
            </div>
            <p class="text-xs text-zaccBlack/70 mb-3">
              Add each requested item with optional quantity/unit. Suppliers will quote against these rows.
            </p>
            <div class="space-y-3">
              <div
                v-for="(li, idx) in form.lineItems"
                :key="idx"
                class="rounded-lg border border-zaccGreen/20 bg-white p-3"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zaccGreen text-white text-xs font-bold px-2">
                      {{ idx + 1 }}
                    </span>
                    <div class="font-semibold text-sm text-zaccBlack">Line item</div>
                  </div>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                      @click="form.lineItems.splice(idx, 1); renumberLineItems()"
                  />
                </div>
                <div class="grid grid-cols-12 gap-3">
                  <div class="col-span-12 md:col-span-6">
                    <label class="text-xs font-semibold text-zaccBlack/70 mb-1 block">Description</label>
                    <InputText v-model="li.description" class="w-full" placeholder="Line item description" />
                  </div>
                  <div class="col-span-6 md:col-span-3">
                    <label class="text-xs font-semibold text-zaccBlack/70 mb-1 block">Quantity</label>
                    <InputNumber v-model="li.quantity" class="w-full" placeholder="Qty" />
                  </div>
                  <div class="col-span-6 md:col-span-3">
                    <label class="text-xs font-semibold text-zaccBlack/70 mb-1 block">Unit</label>
                    <InputText v-model="li.unit" class="w-full" placeholder="e.g. pcs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Checkbox v-model="form.isPublished" binary inputId="pub" />
            <label for="pub">Published</label>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button label="Cancel" severity="secondary" outlined @click="dialogVisible = false" />
            <Button type="submit" label="Save" :loading="saving" style="background: #209341; border-color: #209341;" />
          </div>
        </form>
      </Dialog>
      <ConfirmDialog />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Tenders - ZACC CMS' })

const toast = useToast()
const confirm = useConfirm()

const items = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editId = ref<string | null>(null)

const typeOptions = [
  { label: 'Normal Tender', value: 'NORMAL' },
  { label: 'RFQ', value: 'RFQ' }
]

const form = reactive<any>({
  title: '',
  reference: '',
  details: '',
  type: 'NORMAL',
  categoryId: '',
  closingDate: null,
  isPublished: true,
  documents: [],
  lineItems: []
})

const formatDate = (d: string | Date) => new Date(d).toLocaleString()

const load = async () => {
  loading.value = true
  try {
    items.value = await $fetch('/api/tenders')
    categories.value = await $fetch('/api/tenders/categories')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.data?.message || 'Failed to load', life: 3000 })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  editId.value = null
  form.title = ''
  form.reference = ''
  form.details = ''
  form.type = 'NORMAL'
  form.categoryId = categories.value[0]?.id || ''
  form.closingDate = null
  form.isPublished = true
  form.documents = []
  form.lineItems = []
}

const renumberLineItems = () => {
  form.lineItems.forEach((li: any, idx: number) => {
    li.itemNo = idx + 1
  })
}

const addLineItem = () => {
  form.lineItems.push({ itemNo: form.lineItems.length + 1, description: '', quantity: null, unit: '' })
  renumberLineItems()
}

const uploadTenderDoc = async (event: any) => {
  const file = event.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  const res: any = await $fetch('/api/upload/document', { method: 'POST', body: fd })
  form.documents.push({ fileName: file.name, fileUrl: res.path, fileType: res.fileType || file.type || 'file', fileSize: file.size })
}

const openCreate = () => { resetForm(); dialogVisible.value = true }
const openViewBidsPage = (row: any) => {
  navigateTo(`/admin/bids-${row.id}`)
}

const openEdit = (row: any) => {
  editId.value = row.id
  form.title = row.title
  form.reference = row.reference || ''
  form.details = row.details || ''
  form.type = row.type
  form.categoryId = row.categoryId
  form.closingDate = row.closingDate ? new Date(row.closingDate) : null
  form.isPublished = row.isPublished
  form.documents = (row.documents || []).map((d: any) => ({ fileName: d.fileName, fileUrl: d.fileUrl, fileType: d.fileType, fileSize: d.fileSize }))
  form.lineItems = (row.lineItems || []).map((li: any) => ({ itemNo: li.itemNo, description: li.description, quantity: li.quantity, unit: li.unit }))
  dialogVisible.value = true
}

const save = async () => {
  if (!form.title?.trim() || !form.details?.trim() || !form.closingDate || !form.categoryId) {
    toast.add({ severity: 'warn', summary: 'Validation', detail: 'Title, details, category and closing date are required', life: 3000 })
    return
  }
  if (form.type === 'RFQ' && form.lineItems.length === 0) {
    toast.add({ severity: 'warn', summary: 'Validation', detail: 'RFQ requires line items', life: 3000 })
    return
  }

  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      reference: form.reference || null,
      details: form.details,
      type: form.type,
      categoryId: form.categoryId,
      closingDate: form.closingDate instanceof Date ? form.closingDate.toISOString() : form.closingDate,
      isPublished: form.isPublished,
      documents: form.documents,
      lineItems: form.type === 'RFQ' ? form.lineItems : []
    }
    if (editId.value) {
      await $fetch(`/api/tenders/${editId.value}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/tenders', { method: 'POST', body: payload })
    }
    dialogVisible.value = false
    await load()
    toast.add({ severity: 'success', summary: 'Saved', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.data?.message || 'Save failed', life: 3000 })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (row: any) => {
  confirm.require({
    message: `Delete tender "${row.title}"?`,
    header: 'Confirm',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await $fetch(`/api/tenders/${row.id}`, { method: 'DELETE' })
        await load()
        toast.add({ severity: 'success', summary: 'Deleted', life: 2000 })
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.data?.message || 'Delete failed', life: 3000 })
      }
    }
  })
}

onMounted(load)
</script>

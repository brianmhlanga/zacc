<template>
  <NuxtLayout name="dashboard">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-zaccBlack">Suppliers</h1>
          <p class="text-sm text-zaccBlack/70">View supplier profiles and manage supplier categories.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              v-model.trim="searchTerm"
              placeholder="Search suppliers..."
              class="w-64"
            />
          </span>
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            outlined
            :loading="loading"
            @click="loadAll"
          />
        </div>
      </div>

      <Card>
        <template #content>
          <DataTable
            :value="filteredSuppliers"
            dataKey="id"
            responsiveLayout="scroll"
            :loading="loading"
            v-model:expandedRows="expandedRows"
          >
            <template #empty>
              <div class="py-6 text-center text-zaccBlack/60">No suppliers found.</div>
            </template>

            <Column expander style="width: 3rem" />
            <Column field="companyName" header="Company" />
            <Column field="contactName" header="Contact" />
            <Column field="email" header="Email" />
            <Column header="Phone">
              <template #body="{ data }">
                {{ data.phone || '-' }}
              </template>
            </Column>
            <Column header="Categories">
              <template #body="{ data }">
                {{ data.approvals?.length || 0 }}
              </template>
            </Column>
            <Column header="Documents">
              <template #body="{ data }">
                {{ data.documents?.length || 0 }}
              </template>
            </Column>

            <template #expansion="{ data }">
              <div class="p-3 space-y-4 bg-zaccBlack/[0.02] rounded-lg">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-zaccBlack">Categories</h3>
                  <Button
                    label="Add/Update Category"
                    icon="pi pi-check-circle"
                    size="small"
                    @click="openApprovalDialog(data)"
                  />
                </div>

                <div v-if="data.approvals?.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    v-for="approval in data.approvals"
                    :key="approval.id"
                    class="rounded-lg border border-zaccBlack/10 p-3 bg-white space-y-2"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="font-medium text-zaccBlack">{{ approval.category?.name || 'Category' }}</div>
                      <Tag :value="approval.status" :severity="getStatusSeverity(approval.status)" />
                    </div>
                    <p v-if="approval.notes" class="text-sm text-zaccBlack/70">{{ approval.notes }}</p>
                    <Button
                      label="Edit"
                      size="small"
                      outlined
                      icon="pi pi-pencil"
                      @click="openApprovalDialog(data, approval.categoryId)"
                    />
                    <Button
                      label="Delete"
                      size="small"
                      text
                      severity="danger"
                      icon="pi pi-trash"
                      :loading="deletingCategoryKey === `${data.id}:${approval.categoryId}`"
                      @click="removeCategory(data.id, approval.categoryId)"
                    />
                  </div>
                </div>
                <div v-else class="text-sm text-zaccBlack/60">No categories set yet.</div>

                <div class="space-y-2">
                  <h4 class="font-semibold text-zaccBlack">Supplier documents</h4>
                  <div v-if="data.documents?.length" class="space-y-2">
                    <div
                      v-for="doc in data.documents"
                      :key="doc.id"
                      class="rounded border border-zaccBlack/10 bg-white p-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <span class="text-sm text-zaccBlack">{{ doc.fileName }}</span>
                      <div class="flex items-center gap-2">
                        <a :href="doc.fileUrl" target="_blank" class="text-xs text-zaccGreen hover:underline">View</a>
                        <a :href="doc.fileUrl" :download="doc.fileName" class="text-xs text-zaccGreen hover:underline">Download</a>
                        <Button
                          label="Delete"
                          icon="pi pi-trash"
                          size="small"
                          text
                          severity="danger"
                          :loading="deletingDocId === doc.id"
                          @click="removeDocument(data.id, doc.id)"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-zaccBlack/60">No documents uploaded yet.</div>
                </div>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>

    <Dialog
      v-model:visible="approvalDialogVisible"
      modal
      header="Manage Category"
      class="w-[92vw] max-w-xl"
    >
      <div v-if="activeSupplier" class="space-y-4">
        <div class="rounded-lg border border-zaccBlack/10 p-3 bg-zaccBlack/[0.02]">
          <div class="font-semibold text-zaccBlack">{{ activeSupplier.companyName }}</div>
          <div class="text-sm text-zaccBlack/70">{{ activeSupplier.email }}</div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-semibold text-zaccBlack">Category</label>
          <Dropdown
            v-model="approvalForm.categoryId"
            :options="categories"
            optionLabel="name"
            optionValue="id"
            class="w-full"
            placeholder="Select category"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-semibold text-zaccBlack">Status</label>
          <Dropdown
            v-model="approvalForm.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-semibold text-zaccBlack">Notes (optional)</label>
          <Textarea v-model="approvalForm.notes" rows="3" class="w-full" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" text @click="approvalDialogVisible = false" />
          <Button label="Save Category" :loading="savingApproval" @click="saveApproval" />
        </div>
      </template>
    </Dialog>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

type SupplierApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type Supplier = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string | null
  approvals: Array<{
    id: string
    categoryId: string
    status: SupplierApprovalStatus
    notes?: string | null
    category: { id: string; name: string }
  }>
  documents: Array<{ id: string; fileName: string; fileUrl: string }>
}

type Category = {
  id: string
  name: string
}

definePageMeta({
  middleware: ['admin']
})

const toast = useToast()
const loading = ref(false)
const savingApproval = ref(false)
const suppliers = ref<Supplier[]>([])
const searchTerm = ref('')
const categories = ref<Category[]>([])
const expandedRows = ref({})
const approvalDialogVisible = ref(false)
const activeSupplier = ref<Supplier | null>(null)
const deletingCategoryKey = ref('')
const deletingDocId = ref('')

const approvalForm = reactive<{
  categoryId: string
  status: SupplierApprovalStatus
  notes: string
}>({
  categoryId: '',
  status: 'PENDING',
  notes: ''
})

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' }
]

const getStatusSeverity = (status: SupplierApprovalStatus) => {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'warning'
}

const filteredSuppliers = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return suppliers.value
  return suppliers.value.filter((s) => {
    return [
      s.companyName,
      s.contactName,
      s.email,
      s.phone || ''
    ].some((v) => String(v || '').toLowerCase().includes(term))
  })
})

const loadAll = async () => {
  loading.value = true
  try {
    const [supplierRows, categoryRows] = await Promise.all([
      $fetch('/api/suppliers'),
      $fetch('/api/tenders/categories')
    ])
    suppliers.value = supplierRows as Supplier[]
    categories.value = categoryRows as Category[]
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Load failed',
      detail: error?.data?.statusMessage || 'Could not load suppliers',
      life: 4000
    })
  } finally {
    loading.value = false
  }
}

const openApprovalDialog = (supplier: Supplier, categoryId?: string) => {
  activeSupplier.value = supplier
  const existing = categoryId
    ? supplier.approvals.find((a) => a.categoryId === categoryId)
    : undefined
  approvalForm.categoryId = categoryId || categories.value[0]?.id || ''
  approvalForm.status = (existing?.status || 'PENDING') as SupplierApprovalStatus
  approvalForm.notes = existing?.notes || ''
  approvalDialogVisible.value = true
}

const saveApproval = async () => {
  if (!activeSupplier.value) return
  if (!approvalForm.categoryId) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Please select a category', life: 3000 })
    return
  }
  savingApproval.value = true
  try {
    await $fetch(`/api/suppliers/${activeSupplier.value.id}/approvals`, {
      method: 'PUT',
      body: {
        categoryId: approvalForm.categoryId,
        status: approvalForm.status,
        notes: approvalForm.notes?.trim() || null
      }
    })
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Category updated', life: 2500 })
    approvalDialogVisible.value = false
    await loadAll()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: error?.data?.statusMessage || 'Could not update category',
      life: 4000
    })
  } finally {
    savingApproval.value = false
  }
}

const removeCategory = async (supplierId: string, categoryId: string) => {
  deletingCategoryKey.value = `${supplierId}:${categoryId}`
  try {
    await $fetch(`/api/suppliers/${supplierId}/approvals/${categoryId}`, {
      method: 'DELETE'
    })
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Category removed', life: 2200 })
    await loadAll()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Delete failed',
      detail: error?.data?.statusMessage || 'Could not remove category',
      life: 4000
    })
  } finally {
    deletingCategoryKey.value = ''
  }
}

const removeDocument = async (supplierId: string, docId: string) => {
  deletingDocId.value = docId
  try {
    await $fetch(`/api/suppliers/${supplierId}/documents/${docId}`, {
      method: 'DELETE'
    })
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Document removed', life: 2200 })
    await loadAll()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Delete failed',
      detail: error?.data?.statusMessage || 'Could not remove document',
      life: 4000
    })
  } finally {
    deletingDocId.value = ''
  }
}

onMounted(loadAll)
</script>

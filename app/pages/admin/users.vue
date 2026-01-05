<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Users Management</h1>
          <p class="mt-2 text-gray-600">Manage system users and their permissions</p>
        </div>
        <Button
          label="Add User"
          icon="pi pi-plus"
          @click="openCreateDialog"
          style="background: #209341; border-color: #209341;"
        />
      </div>

      <!-- Users Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="users"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['name', 'email', 'role']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Users</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search users..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="name" header="Name" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-zaccGreen text-white font-semibold">
                    {{ getUserInitials(data.name) }}
                  </div>
                  <div>
                    <div class="font-semibold text-zaccBlack">{{ data.name || 'N/A' }}</div>
                    <div class="text-xs text-gray-500">{{ data.email }}</div>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="role" header="Role" sortable>
              <template #body="{ data }">
                <Tag :value="data.role.replace('_', ' ')" :severity="getRoleSeverity(data.role)" />
              </template>
            </Column>

            <Column field="isActive" header="Status" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isActive ? 'Active' : 'Inactive'"
                  :severity="data.isActive ? 'success' : 'danger'"
                />
              </template>
            </Column>

            <Column field="lastLoginAt" header="Last Login" sortable>
              <template #body="{ data }">
                {{ data.lastLoginAt ? formatDate(data.lastLoginAt) : 'Never' }}
              </template>
            </Column>

            <Column field="createdAt" header="Created" sortable>
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="min-width: 12rem">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    outlined
                    rounded
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit User'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    rounded
                    @click="confirmDelete(data)"
                    v-tooltip.top="'Delete User'"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-users text-4xl mb-4"></i>
                <p>No users found</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Create/Edit User Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit User' : 'Create New User'"
        :modal="true"
        :style="{ width: '500px' }"
        :closable="true"
        :draggable="false"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-semibold text-zaccBlack mb-2">
              Full Name
            </label>
            <InputText
              id="name"
              v-model="userForm.name"
              placeholder="Enter full name"
              class="w-full"
              :class="{ 'p-invalid': errors.name }"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <div>
            <label for="email" class="block text-sm font-semibold text-zaccBlack mb-2">
              Email Address
            </label>
            <InputText
              id="email"
              v-model="userForm.email"
              type="email"
              placeholder="user@example.com"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
              :disabled="isEditMode"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>

          <div>
            <label for="role" class="block text-sm font-semibold text-zaccBlack mb-2">
              Role
            </label>
            <Dropdown
              id="role"
              v-model="userForm.role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a role"
              class="w-full"
              :class="{ 'p-invalid': errors.role }"
            />
            <small v-if="errors.role" class="p-error">{{ errors.role }}</small>
          </div>

          <div v-if="!isEditMode">
            <label for="password" class="block text-sm font-semibold text-zaccBlack mb-2">
              Password
            </label>
            <Password
              id="password"
              v-model="userForm.password"
              placeholder="Enter password"
              :feedback="true"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <div v-else>
            <label for="password" class="block text-sm font-semibold text-zaccBlack mb-2">
              New Password (leave blank to keep current)
            </label>
            <Password
              id="password"
              v-model="userForm.password"
              placeholder="Enter new password"
              :feedback="true"
              toggleMask
              class="w-full"
            />
          </div>

          <div class="flex items-center gap-2">
            <Checkbox
              id="isActive"
              v-model="userForm.isActive"
              :binary="true"
            />
            <label for="isActive" class="text-sm font-semibold text-zaccBlack">
              Active User
            </label>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeDialog"
            />
            <Button
              type="submit"
              :label="isEditMode ? 'Update' : 'Create'"
              :loading="submitting"
              style="background: #209341; border-color: #209341;"
            />
          </div>
        </form>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

useHead({
  title: 'Users Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage system users and permissions'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const userForm = reactive({
  id: '',
  name: '',
  email: '',
  role: 'EDITOR',
  password: '',
  isActive: true
})

const errors = reactive({
  name: '',
  email: '',
  role: '',
  password: ''
})

const roleOptions = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Editor', value: 'EDITOR' },
  { label: 'Viewer', value: 'VIEWER' }
]

// Fetch users
const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/users')
    users.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load users',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Open create dialog
const openCreateDialog = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (user: any) => {
  isEditMode.value = true
  userForm.id = user.id
  userForm.name = user.name || ''
  userForm.email = user.email
  userForm.role = user.role
  userForm.password = ''
  userForm.isActive = user.isActive
  dialogVisible.value = true
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

// Reset form
const resetForm = () => {
  userForm.id = ''
  userForm.name = ''
  userForm.email = ''
  userForm.role = 'EDITOR'
  userForm.password = ''
  userForm.isActive = true
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

// Validate form
const validateForm = () => {
  let valid = true
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  if (!userForm.name?.trim()) {
    errors.name = 'Name is required'
    valid = false
  }

  if (!userForm.email?.trim()) {
    errors.email = 'Email is required'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
    errors.email = 'Invalid email format'
    valid = false
  }

  if (!userForm.role) {
    errors.role = 'Role is required'
    valid = false
  }

  if (!isEditMode.value && !userForm.password) {
    errors.password = 'Password is required'
    valid = false
  } else if (userForm.password && userForm.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    valid = false
  }

  return valid
}

// Handle form submit
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      name: userForm.name.trim(),
      email: userForm.email.trim().toLowerCase(),
      role: userForm.role,
      isActive: userForm.isActive
    }

    if (userForm.password) {
      payload.password = userForm.password
    }

    if (isEditMode.value) {
      await $fetch(`/api/users/${userForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/users', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User created successfully',
        life: 3000
      })
    }

    closeDialog()
    await fetchUsers()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || (isEditMode.value ? 'Failed to update user' : 'Failed to create user'),
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Confirm delete
const confirmDelete = (user: any) => {
  confirm.require({
    message: `Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`,
    header: 'Delete User',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: async () => {
      try {
        await $fetch(`/api/users/${user.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User deleted successfully',
          life: 3000
        })
        await fetchUsers()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete user',
          life: 3000
        })
      }
    }
  })
}

// Helper functions
const getUserInitials = (name: string | null) => {
  if (!name) return 'U'
  const names = name.split(' ')
  return names.length > 1
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0][0].toUpperCase()
}

const getRoleSeverity = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'danger'
    case 'ADMIN':
      return 'warning'
    case 'EDITOR':
      return 'info'
    case 'VIEWER':
      return 'secondary'
    default:
      return 'secondary'
  }
}

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch users on mount
onMounted(() => {
  fetchUsers()
})
</script>


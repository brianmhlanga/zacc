<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Menu Management</h1>
          <p class="mt-2 text-gray-600">Create and manage navigation menus</p>
        </div>
        <Button
          label="Create Menu"
          icon="pi pi-plus"
          @click="openCreateMenuDialog"
          style="background: #209341; border-color: #209341;"
        />
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left Panel: Menu List -->
        <Card class="lg:col-span-1 border-0 shadow-md">
          <template #header>
            <div class="p-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-zaccBlack">Menus</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-2">
              <div
                v-for="menu in menus"
                :key="menu.id"
                @click="selectMenu(menu)"
                class="p-3 rounded-lg cursor-pointer transition-colors"
                :class="selectedMenu?.id === menu.id ? 'bg-zaccGreen/10 border-l-4 border-zaccGreen' : 'hover:bg-gray-50 border-l-4 border-transparent'"
              >
                <div class="font-semibold text-zaccBlack">{{ menu.name }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ menu.location }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ (menu.items && Array.isArray(menu.items) ? menu.items.length : 0) }} items</div>
              </div>
              <div v-if="menus.length === 0" class="text-center py-8 text-gray-500">
                <p>No menus created yet</p>
                <Button
                  label="Create Menu"
                  icon="pi pi-plus"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="openCreateMenuDialog"
                  class="mt-4"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Right Panel: Menu Items -->
        <Card v-if="selectedMenu" class="lg:col-span-2 border-0 shadow-md">
          <template #header>
            <div class="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-zaccBlack">{{ selectedMenu.name }}</h2>
                <p class="text-sm text-gray-500">{{ selectedMenu.location }}</p>
              </div>
              <Button
                label="Add Item"
                icon="pi pi-plus"
                size="small"
                @click="openAddItemDialog"
                style="background: #209341; border-color: #209341;"
              />
            </div>
          </template>
          <template #content>
            <div v-if="selectedMenu.items && Array.isArray(selectedMenu.items) && selectedMenu.items.length > 0" class="space-y-2">
              <AdminMenuItem
                v-for="item in selectedMenu.items"
                :key="item.id"
                :item="item"
                :level="0"
                @edit="openEditItemDialog"
                @delete="handleDeleteItem"
                @move-up="moveItemUp"
                @move-down="moveItemDown"
                @indent="indentItem"
                @outdent="outdentItem"
              />
            </div>
            <div v-else class="text-center py-12 text-gray-500">
              <i class="pi pi-list text-4xl mb-4 text-gray-300"></i>
              <p>No menu items yet. Add your first item to get started.</p>
            </div>
          </template>
        </Card>

        <Card v-else class="lg:col-span-2 border-0 shadow-md">
          <template #content>
            <div class="text-center py-12 text-gray-500">
              <i class="pi pi-list text-4xl mb-4 text-gray-300"></i>
              <p>Select a menu to manage its items</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Create Menu Dialog -->
      <Dialog
        v-model:visible="createMenuDialogVisible"
        header="Create New Menu"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '500px' }"
      >
        <form @submit.prevent="handleCreateMenu" class="space-y-4">
          <div>
            <label for="menuName" class="block text-sm font-semibold text-zaccBlack mb-2">
              Menu Name <span class="text-red-500">*</span>
            </label>
            <InputText
              id="menuName"
              v-model="menuForm.name"
              placeholder="e.g., Main Menu"
              class="w-full"
              :class="{ 'p-invalid': errors.name }"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <div>
            <label for="menuLocation" class="block text-sm font-semibold text-zaccBlack mb-2">
              Location <span class="text-red-500">*</span>
            </label>
            <AutoComplete
              id="menuLocation"
              v-model="menuForm.location"
              :suggestions="locationSuggestions"
              @complete="searchLocation"
              placeholder="Type or select location"
              class="w-full"
              :class="{ 'p-invalid': errors.location }"
              dropdown
            />
            <small v-if="errors.location" class="p-error">{{ errors.location }}</small>
            <small class="text-gray-500">Common: header, footer, sidebar</small>
          </div>

          <div>
            <label for="menuDescription" class="block text-sm font-semibold text-zaccBlack mb-2">
              Description
            </label>
            <Textarea
              id="menuDescription"
              v-model="menuForm.description"
              placeholder="Optional description"
              :rows="2"
              class="w-full"
            />
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeCreateMenuDialog"
            />
            <Button
              type="submit"
              label="Create"
              :loading="creatingMenu"
              style="background: #209341; border-color: #209341;"
            />
          </div>
        </form>
      </Dialog>

      <!-- Add/Edit Menu Item Dialog -->
      <Dialog
        v-model:visible="itemDialogVisible"
        :header="isEditItemMode ? 'Edit Menu Item' : 'Add Menu Item'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '600px' }"
      >
        <form @submit.prevent="handleSaveItem" class="space-y-4">
          <div>
            <label for="itemLabel" class="block text-sm font-semibold text-zaccBlack mb-2">
              Label <span class="text-red-500">*</span>
            </label>
            <InputText
              id="itemLabel"
              v-model="itemForm.label"
              placeholder="Menu item label"
              class="w-full"
              :class="{ 'p-invalid': errors.label }"
            />
            <small v-if="errors.label" class="p-error">{{ errors.label }}</small>
          </div>

          <div>
            <label for="itemType" class="block text-sm font-semibold text-zaccBlack mb-2">
              Type <span class="text-red-500">*</span>
            </label>
            <Dropdown
              id="itemType"
              v-model="itemForm.type"
              :options="itemTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select type"
              class="w-full"
              :class="{ 'p-invalid': errors.type }"
              @change="handleTypeChange"
            />
            <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
          </div>

          <div v-if="itemForm.type === 'custom' || itemForm.type === 'url'">
            <label for="itemUrl" class="block text-sm font-semibold text-zaccBlack mb-2">
              URL <span class="text-red-500">*</span>
            </label>
            <InputText
              id="itemUrl"
              v-model="itemForm.url"
              :placeholder="itemForm.type === 'url' ? 'https://example.com' : '/page'"
              class="w-full"
              :class="{ 'p-invalid': errors.url }"
            />
            <small v-if="errors.url" class="p-error">{{ errors.url }}</small>
          </div>

          <div v-if="itemForm.type === 'page'">
            <label for="itemPage" class="block text-sm font-semibold text-zaccBlack mb-2">
              Page <span class="text-red-500">*</span>
            </label>
            <Dropdown
              id="itemPage"
              v-model="itemForm.pageId"
              :options="pageOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a page"
              class="w-full"
              :class="{ 'p-invalid': errors.pageId }"
              :loading="loadingPages"
              :disabled="loadingPages"
              showClear
            />
            <small v-if="pageOptions.length === 0 && !loadingPages" class="text-yellow-600">
              No pages available. Using default pages.
            </small>
            <small v-if="errors.pageId" class="p-error">{{ errors.pageId }}</small>
            <small v-else class="text-gray-500">Select an existing page</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="itemTarget" class="block text-sm font-semibold text-zaccBlack mb-2">
                Link Target
              </label>
              <Dropdown
                id="itemTarget"
                v-model="itemForm.target"
                :options="targetOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>

            <div>
              <label for="itemIcon" class="block text-sm font-semibold text-zaccBlack mb-2">
                Icon
              </label>
              <InputText
                id="itemIcon"
                v-model="itemForm.icon"
                placeholder="e.g., pi-home"
                class="w-full"
              />
            </div>
          </div>

          <div v-if="selectedMenu && selectedMenu.items && selectedMenu.items.length > 0">
            <label for="itemParent" class="block text-sm font-semibold text-zaccBlack mb-2">
              Parent Item
            </label>
            <Dropdown
              id="itemParent"
              v-model="itemForm.parentId"
              :options="parentItemOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="None (top level)"
              class="w-full"
              showClear
            />
            <small class="text-gray-500">Select a parent to create a submenu</small>
          </div>

          <div class="flex items-center gap-2">
            <Checkbox
              id="itemVisible"
              v-model="itemForm.isVisible"
              :binary="true"
            />
            <label for="itemVisible" class="text-sm font-semibold text-zaccBlack">
              Visible
            </label>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeItemDialog"
            />
            <Button
              type="submit"
              :label="isEditItemMode ? 'Update' : 'Add'"
              :loading="savingItem"
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
import AdminMenuItem from '~/components/admin/MenuItem.vue'

useHead({
  title: 'Menu Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Create and manage navigation menus'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const menus = ref([])
const selectedMenu = ref<any>(null)
const loading = ref(false)
const createMenuDialogVisible = ref(false)
const itemDialogVisible = ref(false)
const isEditItemMode = ref(false)
const creatingMenu = ref(false)
const savingItem = ref(false)

const menuForm = reactive({
  name: '',
  location: '',
  description: ''
})

const itemForm = reactive({
  id: '',
  label: '',
  type: 'custom',
  url: '',
  pageId: null as string | null,
  target: '_self',
  icon: '',
  parentId: null as string | null,
  isVisible: true
})

const errors = reactive({
  name: '',
  location: '',
  label: '',
  type: '',
  url: '',
  pageId: ''
})

const itemTypeOptions = [
  { label: 'Custom Link', value: 'custom' },
  { label: 'URL', value: 'url' },
  { label: 'Page', value: 'page' }
]

const targetOptions = [
  { label: 'Same Window', value: '_self' },
  { label: 'New Window', value: '_blank' }
]

const locationSuggestions = ref<string[]>([])
const commonLocations = ['header', 'footer', 'sidebar', 'mobile', 'topbar']
const pageOptions = ref<Array<{ label: string; value: string; pageKey: string }>>([])
const loadingPages = ref(false)

const searchLocation = (event: any) => {
  const query = event.query.toLowerCase()
  if (!query) {
    locationSuggestions.value = commonLocations
  } else {
    locationSuggestions.value = commonLocations.filter(loc => 
      loc.toLowerCase().includes(query)
    )
    if (!commonLocations.some(l => l.toLowerCase() === query)) {
      locationSuggestions.value.push(query)
    }
  }
}

// Computed
const parentItemOptions = computed(() => {
  if (!selectedMenu.value || !selectedMenu.value.items) return []
  
  const flattenItems = (items: any[], excludeId?: string, level = 0): any[] => {
    const result: any[] = []
    items.forEach(item => {
      if (item.id !== excludeId) {
        result.push({
          label: '  '.repeat(level) + item.label,
          value: item.id
        })
        if (item.children && item.children.length > 0) {
          result.push(...flattenItems(item.children, excludeId, level + 1))
        }
      }
    })
    return result
  }
  
  return flattenItems(selectedMenu.value.items, itemForm.id)
})

// Fetch menus
const fetchMenus = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/menus')
    menus.value = Array.isArray(data) ? data : []
    
    // Ensure items arrays are initialized for each menu
    menus.value.forEach((menu: any) => {
      if (!menu.items) {
        menu.items = []
      }
    })
    
    if (selectedMenu.value) {
      const updated = menus.value.find((m: any) => m.id === selectedMenu.value.id)
      if (updated) {
        selectedMenu.value = updated
      }
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load menus',
      life: 3000
    })
    menus.value = []
  } finally {
    loading.value = false
  }
}

// Menu handlers
const selectMenu = (menu: any) => {
  selectedMenu.value = menu
}

const openCreateMenuDialog = () => {
  menuForm.name = ''
  menuForm.location = ''
  menuForm.description = ''
  errors.name = ''
  errors.location = ''
  createMenuDialogVisible.value = true
}

const closeCreateMenuDialog = () => {
  createMenuDialogVisible.value = false
  menuForm.name = ''
  menuForm.location = ''
  menuForm.description = ''
  errors.name = ''
  errors.location = ''
}

const handleCreateMenu = async () => {
  errors.name = ''
  errors.location = ''

  if (!menuForm.name.trim()) {
    errors.name = 'Menu name is required'
    return
  }

  if (!menuForm.location.trim()) {
    errors.location = 'Location is required'
    return
  }

  creatingMenu.value = true
  try {
    await $fetch('/api/menus', {
      method: 'POST',
      body: {
        name: menuForm.name,
        location: menuForm.location,
        description: menuForm.description || null
      }
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Menu created successfully',
      life: 3000
    })

    // Fetch menus to get the updated list with the new menu
    await fetchMenus()
    
    // Find and select the newly created menu by name and location
    const newMenu = menus.value.find((m: any) => 
      m.name === menuForm.name && m.location === menuForm.location
    )
    if (newMenu) {
      selectedMenu.value = newMenu
    }
    
    closeCreateMenuDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to create menu',
      life: 3000
    })
  } finally {
    creatingMenu.value = false
  }
}

// Menu item handlers
const fetchPages = async () => {
  loadingPages.value = true
  try {
    const pages = await $fetch('/api/pages')
    console.log('Fetched pages:', pages) // Debug log
    if (Array.isArray(pages) && pages.length > 0) {
      pageOptions.value = pages
    } else {
      // Fallback to common pages if API returns empty
      pageOptions.value = [
        { label: 'Home', value: 'home', pageKey: 'home' },
        { label: 'About', value: 'about', pageKey: 'about' },
        { label: 'Contact', value: 'contact', pageKey: 'contact' },
        { label: 'Legislation', value: 'legislation', pageKey: 'legislation' },
        { label: 'Services', value: 'services', pageKey: 'services' },
        { label: 'Reports', value: 'reports', pageKey: 'reports' },
        { label: 'News', value: 'news', pageKey: 'news' },
        { label: 'Rulings', value: 'rulings', pageKey: 'rulings' },
        { label: 'Jobs', value: 'jobs', pageKey: 'jobs' },
        { label: 'Downloads', value: 'downloads', pageKey: 'downloads' }
      ]
    }
  } catch (error: any) {
    console.error('Failed to fetch pages:', error)
    // Use fallback pages on error
    pageOptions.value = [
      { label: 'Home', value: 'home', pageKey: 'home' },
      { label: 'About', value: 'about', pageKey: 'about' },
      { label: 'Contact', value: 'contact', pageKey: 'contact' },
      { label: 'Legislation', value: 'legislation', pageKey: 'legislation' },
      { label: 'Services', value: 'services', pageKey: 'services' },
      { label: 'Reports', value: 'reports', pageKey: 'reports' },
      { label: 'News', value: 'news', pageKey: 'news' },
      { label: 'Rulings', value: 'rulings', pageKey: 'rulings' },
      { label: 'Jobs', value: 'jobs', pageKey: 'jobs' },
      { label: 'Downloads', value: 'downloads', pageKey: 'downloads' }
    ]
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Using default pages. Some pages may not exist yet.',
      life: 3000
    })
  } finally {
    loadingPages.value = false
  }
}

const openAddItemDialog = async () => {
  if (!selectedMenu.value) return
  
  isEditItemMode.value = false
  itemForm.id = ''
  itemForm.label = ''
  itemForm.type = 'custom'
  itemForm.url = ''
  itemForm.pageId = null
  itemForm.target = '_self'
  itemForm.icon = ''
  itemForm.parentId = null
  itemForm.isVisible = true
  errors.label = ''
  errors.type = ''
  errors.url = ''
  errors.pageId = ''
  
  // Fetch pages if not already loaded
  if (pageOptions.value.length === 0) {
    await fetchPages()
  }
  
  itemDialogVisible.value = true
}

const openEditItemDialog = async (item: any) => {
  isEditItemMode.value = true
  itemForm.id = item.id
  itemForm.label = item.label
  itemForm.type = item.type
  itemForm.url = item.url || ''
  itemForm.pageId = item.pageId || null
  itemForm.target = item.target || '_self'
  itemForm.icon = item.icon || ''
  itemForm.parentId = item.parentId
  itemForm.isVisible = item.isVisible
  errors.label = ''
  errors.type = ''
  errors.url = ''
  errors.pageId = ''
  
  // Fetch pages if not already loaded
  if (pageOptions.value.length === 0) {
    await fetchPages()
  }
  
  itemDialogVisible.value = true
}

const closeItemDialog = () => {
  itemDialogVisible.value = false
  itemForm.id = ''
  itemForm.label = ''
  itemForm.type = 'custom'
  itemForm.url = ''
  itemForm.target = '_self'
  itemForm.icon = ''
  itemForm.parentId = null
  itemForm.isVisible = true
  errors.label = ''
  errors.type = ''
  errors.url = ''
}

const handleTypeChange = async () => {
  if (itemForm.type !== 'custom' && itemForm.type !== 'url') {
    itemForm.url = ''
  }
  if (itemForm.type === 'page') {
    // Always fetch pages when type changes to 'page' to ensure fresh data
    await fetchPages()
    itemForm.pageId = null
    console.log('Page options after fetch:', pageOptions.value) // Debug log
  } else {
    itemForm.pageId = null
  }
}

const handleSaveItem = async () => {
  errors.label = ''
  errors.type = ''
  errors.url = ''
  errors.pageId = ''

  if (!itemForm.label.trim()) {
    errors.label = 'Label is required'
    return
  }

  if (!itemForm.type) {
    errors.type = 'Type is required'
    return
  }

  if ((itemForm.type === 'custom' || itemForm.type === 'url') && !itemForm.url.trim()) {
    errors.url = 'URL is required'
    return
  }

  if (itemForm.type === 'page' && !itemForm.pageId) {
    errors.pageId = 'Page is required'
    return
  }

  savingItem.value = true
  try {
    if (isEditItemMode.value) {
      await $fetch(`/api/menus/items/${itemForm.id}`, {
        method: 'PUT',
        body: {
          label: itemForm.label,
          type: itemForm.type,
          url: itemForm.url || null,
          pageId: itemForm.pageId || null,
          target: itemForm.target,
          icon: itemForm.icon || null,
          parentId: itemForm.parentId,
          isVisible: itemForm.isVisible
        }
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Menu item updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/menus/items', {
        method: 'POST',
        body: {
          menuId: selectedMenu.value.id,
          label: itemForm.label,
          type: itemForm.type,
          url: itemForm.url || null,
          pageId: itemForm.pageId || null,
          target: itemForm.target,
          icon: itemForm.icon || null,
          order: selectedMenu.value.items?.length || 0,
          isVisible: itemForm.isVisible,
          parentId: itemForm.parentId
        }
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Menu item added successfully',
        life: 3000
      })
    }

    await fetchMenus()
    closeItemDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to save menu item',
      life: 3000
    })
  } finally {
    savingItem.value = false
  }
}

const handleDeleteItem = (item: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${item.label}"? This will also delete all submenu items.`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await $fetch(`/api/menus/items/${item.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Menu item deleted successfully',
          life: 3000
        })
        await fetchMenus()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete menu item',
          life: 3000
        })
      }
    }
  })
}

// Helper to flatten menu items for ordering
const flattenMenuItems = (items: any[], parentId: string | null = null): any[] => {
  const result: any[] = []
  items.forEach((item, index) => {
    result.push({
      id: item.id,
      order: index,
      parentId: parentId
    })
    if (item.children && item.children.length > 0) {
      result.push(...flattenMenuItems(item.children, item.id))
    }
  })
  return result
}

// Move handlers
const moveItemUp = async (item: any) => {
  if (!selectedMenu.value || !selectedMenu.value.items) return
  
  const findItemAndSibling = (items: any[], targetId: string, parentId: string | null = null): { item: any, sibling: any, items: any[], index: number } | null => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId && i > 0) {
        return { item: items[i], sibling: items[i - 1], items, index: i }
      }
      if (items[i].children) {
        const found = findItemAndSibling(items[i].children, targetId, items[i].id)
        if (found) return found
      }
    }
    return null
  }
  
  const found = findItemAndSibling(selectedMenu.value.items, item.id)
  if (found) {
    // Swap items
    const temp = found.items[found.index]
    found.items[found.index] = found.items[found.index - 1]
    found.items[found.index - 1] = temp
    
    // Update orders
    const allItems = flattenMenuItems(selectedMenu.value.items)
    try {
      await $fetch('/api/menus/items/bulk', {
        method: 'PUT',
        body: { items: allItems }
      })
      await fetchMenus()
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to reorder items',
        life: 3000
      })
    }
  }
}

const moveItemDown = async (item: any) => {
  if (!selectedMenu.value || !selectedMenu.value.items) return
  
  const findItemAndSibling = (items: any[], targetId: string, parentId: string | null = null): { item: any, sibling: any, items: any[], index: number } | null => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId && i < items.length - 1) {
        return { item: items[i], sibling: items[i + 1], items, index: i }
      }
      if (items[i].children) {
        const found = findItemAndSibling(items[i].children, targetId, items[i].id)
        if (found) return found
      }
    }
    return null
  }
  
  const found = findItemAndSibling(selectedMenu.value.items, item.id)
  if (found) {
    // Swap items
    const temp = found.items[found.index]
    found.items[found.index] = found.items[found.index + 1]
    found.items[found.index + 1] = temp
    
    // Update orders
    const allItems = flattenMenuItems(selectedMenu.value.items)
    try {
      await $fetch('/api/menus/items/bulk', {
        method: 'PUT',
        body: { items: allItems }
      })
      await fetchMenus()
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to reorder items',
        life: 3000
      })
    }
  }
}

const indentItem = async (item: any) => {
  // Find previous sibling to use as parent
  if (!selectedMenu.value || !selectedMenu.value.items) return
  
  const findItemIndex = (items: any[], targetId: string): number => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) return i
      if (items[i].children) {
        const childIndex = findItemIndex(items[i].children, targetId)
        if (childIndex !== -1) return i
      }
    }
    return -1
  }
  
  const index = findItemIndex(selectedMenu.value.items, item.id)
  if (index > 0) {
    const parentItem = selectedMenu.value.items[index - 1]
    try {
      await $fetch(`/api/menus/items/${item.id}`, {
        method: 'PUT',
        body: {
          parentId: parentItem.id
        }
      })
      await fetchMenus()
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to move item',
        life: 3000
      })
    }
  }
}

const outdentItem = async (item: any) => {
  try {
    await $fetch(`/api/menus/items/${item.id}`, {
      method: 'PUT',
      body: {
        parentId: null
      }
    })
    await fetchMenus()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to move item',
      life: 3000
    })
  }
}

// Lifecycle
onMounted(() => {
  fetchMenus()
})
</script>


<template>
  <div class="border border-gray-200 rounded-lg mb-2">
    <div 
      class="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors"
      :style="{ paddingLeft: (level * 24 + 12) + 'px' }"
    >
      <i class="pi pi-bars text-gray-400 cursor-move" title="Drag to reorder"></i>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-zaccBlack">{{ item.label }}</div>
        <div class="text-xs text-gray-500">
          <span class="px-1.5 py-0.5 bg-gray-100 rounded">{{ item.type }}</span>
          <span v-if="item.url" class="ml-2">{{ item.url }}</span>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <Button
          icon="pi pi-arrow-up"
          severity="secondary"
          rounded
          text
          size="small"
          @click="$emit('move-up', item)"
          v-tooltip.top="'Move up'"
        />
        <Button
          icon="pi pi-arrow-down"
          severity="secondary"
          rounded
          text
          size="small"
          @click="$emit('move-down', item)"
          v-tooltip.top="'Move down'"
        />
        <Button
          v-if="level === 0"
          icon="pi pi-indent"
          severity="secondary"
          rounded
          text
          size="small"
          @click="$emit('indent', item)"
          v-tooltip.top="'Make submenu'"
        />
        <Button
          v-if="level > 0"
          icon="pi pi-outdent"
          severity="secondary"
          rounded
          text
          size="small"
          @click="$emit('outdent', item)"
          v-tooltip.top="'Move to top level'"
        />
        <Button
          icon="pi pi-external-link"
          severity="success"
          rounded
          text
          size="small"
          @click="handlePreview"
          v-tooltip.top="'Preview'"
          :disabled="!previewUrl"
        />
        <Button
          icon="pi pi-pencil"
          severity="info"
          rounded
          text
          size="small"
          @click="$emit('edit', item)"
          v-tooltip.top="'Edit'"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          rounded
          text
          size="small"
          @click="$emit('delete', item)"
          v-tooltip.top="'Delete'"
        />
      </div>
    </div>
    <div v-if="item.children && item.children.length > 0" class="pl-4 border-l-2 border-gray-200">
      <MenuItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :level="level + 1"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @move-up="$emit('move-up', $event)"
        @move-down="$emit('move-down', $event)"
        @indent="$emit('indent', $event)"
        @outdent="$emit('outdent', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  item: any
  level: number
}>()

defineEmits<{
  edit: [item: any]
  delete: [item: any]
  'move-up': [item: any]
  'move-down': [item: any]
  indent: [item: any]
  outdent: [item: any]
  preview: [url: string]
}>()

// Compute preview URL based on item type
const previewUrl = computed(() => {
  if (props.item.type === 'url' || props.item.type === 'custom') {
    if (props.item.url) {
      // If it's a full URL, use it directly
      if (props.item.url.startsWith('http://') || props.item.url.startsWith('https://')) {
        return props.item.url
      }
      // If it's a relative URL, prepend with /
      return props.item.url.startsWith('/') ? props.item.url : `/${props.item.url}`
    }
    return null
  } else if (props.item.type === 'page' && props.item.pageId) {
    // For pages, use the pageId as the path
    return `/${props.item.pageId}`
  }
  return null
})

const handlePreview = () => {
  if (previewUrl.value) {
    const url = previewUrl.value
    // Open in new tab
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, props.item.target || '_blank')
    } else {
      // For relative URLs, open in new tab with current origin
      window.open(url, props.item.target || '_blank')
    }
  }
}
</script>


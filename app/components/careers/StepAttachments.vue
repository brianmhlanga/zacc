<template>
  <div>
    <h2 class="text-xl font-extrabold text-zaccBlack">7. Attachments</h2>
    <p class="text-sm text-zaccBlack/60 mt-1 mb-5">
      Academic documents must be certified. Uncertified copies are rejected at verification.
    </p>

    <div class="grid md:grid-cols-2 gap-4">
      <div v-for="slot in slots" :key="slot.key"
        class="rounded-xl border-2 border-dashed p-5 text-center transition-colors"
        :class="fileFor(slot.key)
          ? 'border-zaccGreen bg-zaccGreen/5'
          : slot.isMandatory ? 'border-gray-300' : 'border-gray-200'">
        <div class="text-[10px] font-bold uppercase tracking-wider mb-1"
          :class="slot.isMandatory ? 'text-red-500' : 'text-zaccBlack/40'">
          {{ slot.isMandatory ? 'Required' : 'Optional' }}
        </div>
        <h4 class="font-bold text-zaccBlack">{{ slot.label }}</h4>
        <p class="text-xs text-zaccBlack/50 mb-3">
          {{ (slot.allowedExtensions || []).join(', ').toUpperCase() }} ·
          max {{ Math.round(slot.maxSizeBytes / 1048576) }}MB
        </p>

        <div v-if="fileFor(slot.key)" class="text-sm">
          <p class="font-semibold text-zaccGreen break-all">
            <i class="pi pi-check-circle" /> {{ fileFor(slot.key).fileName }}
          </p>
          <Button label="Remove" text size="small" severity="danger" class="mt-1"
            @click="remove(slot.key)" />
        </div>

        <div v-else>
          <FileUpload mode="basic" customUpload auto chooseLabel="Choose file"
            :accept="(slot.allowedExtensions || []).map((e: string) => '.' + e).join(',')"
            :maxFileSize="slot.maxSizeBytes"
            @uploader="(e: any) => upload(slot, e)" />
          <p v-if="errors[slot.key]" class="mt-2 text-xs font-semibold text-red-600">
            {{ errors[slot.key] }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="!slots.length" class="rounded-xl border-2 border-dashed border-gray-300 p-10 text-center text-zaccBlack/50">
      No documents are required for this vacancy.
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ slots: any[]; documents: any[] }>()

const errors = reactive<Record<string, string>>({})
const documents = computed(() => props.documents)

const fileFor = (slotKey: string) => documents.value.find((d) => d.slotKey === slotKey)

const remove = (slotKey: string) => {
  const i = documents.value.findIndex((d) => d.slotKey === slotKey)
  if (i >= 0) documents.value.splice(i, 1)
}

const upload = async (slot: any, event: any) => {
  const file = event.files?.[0]
  if (!file) return
  errors[slot.key] = ''

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (slot.allowedExtensions?.length && !slot.allowedExtensions.includes(ext)) {
    errors[slot.key] = `That is a .${ext} file. This slot accepts ${slot.allowedExtensions.join(', ')}.`
    return
  }
  if (file.size > slot.maxSizeBytes) {
    errors[slot.key] = `${(file.size / 1048576).toFixed(1)}MB exceeds the ${Math.round(slot.maxSizeBytes / 1048576)}MB limit.`
    return
  }

  try {
    const fd = new FormData()
    fd.append('file', file)
    // Bytes go up first; only the metadata travels with the application, which
    // is the same two-phase pattern the tender documents use.
    const res: any = await $fetch('/api/public/candidates/documents', { method: 'POST', body: fd })

    remove(slot.key)
    documents.value.push({
      slotKey: slot.key,
      fileName: file.name,
      fileUrl: res.fileUrl,
      fileSize: file.size,
      fileType: ext,
      label: slot.label
    })
  } catch (e: any) {
    errors[slot.key] = e.data?.statusMessage || 'Upload failed. Please try again.'
  }
}
</script>

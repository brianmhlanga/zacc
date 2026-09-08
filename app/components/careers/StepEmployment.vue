<template>
  <div>
    <h2 class="text-xl font-extrabold text-zaccBlack">4. Employment history</h2>
    <p class="text-sm text-zaccBlack/60 mt-1 mb-5">
      Start with your current or most recent post, then work backwards.
    </p>

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <label class="block">
        <span class="lbl">Total years of relevant experience <b class="req">*</b></span>
        <InputNumber v-model="m.totalYears" :min="0" :max="60" :step="0.5" :maxFractionDigits="1"
          class="w-full mt-1" />
        <small class="hint">Scored against the minimum advertised for this post.</small>
      </label>
      <label class="block">
        <span class="lbl">Are you currently employed?</span>
        <Dropdown v-model="m.isCurrentlyEmployed" :options="yesNo" optionLabel="label"
          optionValue="value" class="w-full mt-1" placeholder="Select…" />
      </label>
    </div>

    <div class="space-y-4">
      <div v-for="(p, i) in m.positions" :key="i" class="rounded-xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-zaccBlack">
            {{ i === 0 ? 'Current or most recent position' : `Previous position ${i}` }}
          </h4>
          <Button icon="pi pi-trash" text rounded severity="danger" @click="m.positions.splice(i, 1)" />
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          <label class="block">
            <span class="lbl">Employer <b class="req">*</b></span>
            <InputText v-model="p.employer" class="w-full mt-1" />
          </label>
          <label class="block">
            <span class="lbl">Job title <b class="req">*</b></span>
            <InputText v-model="p.jobTitle" class="w-full mt-1" />
          </label>
        </div>

        <div class="grid md:grid-cols-3 gap-3 mt-3">
          <label class="block">
            <span class="lbl">From</span>
            <InputText v-model="p.fromMonth" type="month" class="w-full mt-1" />
          </label>
          <label class="block">
            <span class="lbl">To</span>
            <InputText v-model="p.toMonth" type="month" class="w-full mt-1" :disabled="p.isCurrent" />
            <label class="flex items-center gap-2 text-xs mt-1">
              <Checkbox v-model="p.isCurrent" binary /> I still work here
            </label>
          </label>
          <label class="block">
            <span class="lbl">Gross salary (USD/month)</span>
            <InputNumber v-model="p.salary" :min="0" class="w-full mt-1" />
          </label>
        </div>

        <label class="block mt-3">
          <span class="lbl">Key responsibilities <b class="req">*</b></span>
          <Textarea v-model="p.responsibilities" rows="4" autoResize class="w-full mt-1"
            placeholder="Describe the duties in your own words." />
          <small class="hint">
            Matched against the job description keywords — describing your work fully helps here.
          </small>
        </label>

        <div class="grid md:grid-cols-2 gap-3 mt-3">
          <label class="block">
            <span class="lbl">Reason for leaving</span>
            <Dropdown v-model="p.reasonForLeaving" :options="reasons" class="w-full mt-1"
              placeholder="Select…" showClear />
          </label>
          <label class="block">
            <span class="lbl">Notice period at this employer</span>
            <InputText v-model="p.noticePeriod" class="w-full mt-1" placeholder="1 month" />
          </label>
        </div>

        <div class="grid md:grid-cols-3 gap-3 mt-3">
          <label class="block">
            <span class="lbl">Supervisor's name</span>
            <InputText v-model="p.supervisorName" class="w-full mt-1" />
          </label>
          <label class="block">
            <span class="lbl">Supervisor's position</span>
            <InputText v-model="p.supervisorRole" class="w-full mt-1" />
          </label>
          <label class="block">
            <span class="lbl">Supervisor's contact</span>
            <InputText v-model="p.supervisorPhone" class="w-full mt-1" placeholder="Phone or email" />
          </label>
        </div>

        <p class="text-xs text-zaccBlack/50 mt-2">
          Referees are contacted only after shortlisting.
        </p>
      </div>

      <Button label="Add a position" icon="pi pi-plus" outlined class="w-full" @click="addPosition" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: any }>()
const emit = defineEmits<{ 'update:modelValue': [any] }>()

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const yesNo = [{ label: 'No', value: false }, { label: 'Yes', value: true }]
const reasons = [
  'Still employed', 'Contract ended', 'Career progression', 'Retrenchment',
  'Resignation', 'Dismissal', 'Other'
]

const addPosition = () => {
  m.value.positions.push({
    employer: '', jobTitle: '', fromMonth: '', toMonth: '', isCurrent: false,
    salary: null, responsibilities: '', reasonForLeaving: null, noticePeriod: '',
    supervisorName: '', supervisorRole: '', supervisorPhone: ''
  })
}

// Start with one row rather than an empty screen with a single button.
onMounted(() => { if (!m.value.positions.length) addPosition() })
</script>

<style scoped>
.lbl { @apply text-xs font-semibold text-zaccBlack/70; }
.req { @apply text-red-500; }
.hint { @apply block text-xs text-zaccBlack/50 mt-1; }
</style>

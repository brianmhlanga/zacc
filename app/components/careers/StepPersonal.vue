<template>
  <div>
    <h2 class="text-xl font-extrabold text-zaccBlack">1. Personal &amp; biographical data</h2>
    <p class="text-sm text-zaccBlack/60 mt-1 mb-5">As it appears on your identity document.</p>

    <div class="grid md:grid-cols-3 gap-4">
      <label class="block">
        <span class="lbl">First name <b class="req">*</b></span>
        <InputText v-model="m.firstName" class="w-full mt-1" />
      </label>
      <label class="block">
        <span class="lbl">Middle name</span>
        <InputText v-model="m.middleName" class="w-full mt-1" />
      </label>
      <label class="block">
        <span class="lbl">Surname <b class="req">*</b></span>
        <InputText v-model="m.surname" class="w-full mt-1" />
      </label>
    </div>

    <div class="grid md:grid-cols-3 gap-4 mt-4">
      <label class="block">
        <span class="lbl">Date of birth <b class="req">*</b></span>
        <DatePicker v-model="dob" dateFormat="dd M yy" class="w-full mt-1" showIcon
          :maxDate="new Date()" />
      </label>
      <label class="block">
        <span class="lbl">Age</span>
        <InputText :modelValue="age" readonly class="w-full mt-1 bg-gray-50" placeholder="—" />
      </label>
      <label class="block">
        <span class="lbl">Place of birth</span>
        <InputText v-model="m.placeOfBirth" class="w-full mt-1" />
      </label>
    </div>

    <div class="grid md:grid-cols-3 gap-4 mt-4">
      <label class="block">
        <span class="lbl">Identity document</span>
        <Dropdown v-model="m.nationalIdType" :options="['National ID', 'Passport']" class="w-full mt-1" />
      </label>
      <label class="block">
        <span class="lbl">Number <b class="req">*</b></span>
        <InputText v-model="m.nationalId" class="w-full mt-1" placeholder="63-1234567 X 42" />
        <small class="hint">Used for background and criminal-record verification.</small>
      </label>
      <label class="block">
        <span class="lbl">Nationality</span>
        <InputText v-model="m.nationality" class="w-full mt-1" />
      </label>
    </div>

    <div class="grid md:grid-cols-3 gap-4 mt-4">
      <label class="block">
        <span class="lbl">Gender <b class="req">*</b></span>
        <Dropdown v-model="m.gender" :options="['Female', 'Male', 'Prefer not to say']"
          class="w-full mt-1" placeholder="Select…" />
      </label>
      <label class="block">
        <span class="lbl">Do you live with a disability?</span>
        <Dropdown v-model="m.hasDisability" :options="yesNo" optionLabel="label" optionValue="value"
          class="w-full mt-1" placeholder="Select…" />
      </label>
      <label v-if="m.hasDisability === true" class="block">
        <span class="lbl">Accommodation needed <b class="req">*</b></span>
        <InputText v-model="m.disabilityDetail" class="w-full mt-1" />
      </label>
    </div>

    <p class="text-xs text-zaccBlack/50 mt-2">
      Gender and disability are collected for diversity reporting only and are hidden from
      shortlisting panels.
    </p>

    <div class="grid md:grid-cols-2 gap-4 mt-4">
      <label class="block">
        <span class="lbl">Current address <b class="req">*</b></span>
        <Textarea v-model="m.currentAddress" rows="3" class="w-full mt-1" autoResize />
      </label>
      <div>
        <label class="block">
          <span class="lbl">Permanent address</span>
          <Textarea v-model="m.permanentAddress" rows="3" class="w-full mt-1" autoResize
            :disabled="sameAddress" />
        </label>
        <label class="flex items-center gap-2 text-sm mt-2">
          <Checkbox v-model="sameAddress" binary /> Same as current address
        </label>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-4 mt-4">
      <label class="block">
        <span class="lbl">Province <b class="req">*</b></span>
        <Dropdown v-model="m.province" :options="provinces" class="w-full mt-1" placeholder="Select…" />
      </label>
      <label class="block">
        <span class="lbl">Primary contact number <b class="req">*</b></span>
        <InputText v-model="m.phone" class="w-full mt-1" placeholder="+263 77 000 0000" />
      </label>
      <label class="block">
        <span class="lbl">Alternative number</span>
        <InputText v-model="m.altPhone" class="w-full mt-1" />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [Record<string, any>] }>()

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const yesNo = [{ label: 'No', value: false }, { label: 'Yes', value: true }]

const provinces = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central', 'Mashonaland East',
  'Mashonaland West', 'Masvingo', 'Matabeleland North', 'Matabeleland South',
  'Midlands', 'Outside Zimbabwe'
]

/** DatePicker wants a Date; the answers payload stores an ISO string. */
const dob = computed({
  get: () => (m.value.dateOfBirth ? new Date(m.value.dateOfBirth) : null),
  set: (v: Date | null) => { m.value.dateOfBirth = v ? v.toISOString() : null }
})

const age = computed(() => {
  if (!m.value.dateOfBirth) return ''
  const d = new Date(m.value.dateOfBirth)
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  const monthDiff = now.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) a--
  return a >= 0 && a < 120 ? `${a} years` : 'Check the date'
})

const sameAddress = ref(false)
watch([sameAddress, () => m.value.currentAddress], () => {
  if (sameAddress.value) m.value.permanentAddress = m.value.currentAddress
})
</script>

<style scoped>
.lbl { @apply text-sm font-semibold text-zaccBlack; }
.req { @apply text-red-500; }
.hint { @apply block text-xs text-zaccBlack/50 mt-1; }
</style>

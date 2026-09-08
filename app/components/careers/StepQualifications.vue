<template>
  <div>
    <h2 class="text-xl font-extrabold text-zaccBlack">3. Academic &amp; professional qualifications</h2>
    <p class="text-sm text-zaccBlack/60 mt-1 mb-5">
      Tick each level you have attained. The highest one drives your qualification score.
    </p>

    <label class="block max-w-sm mb-5">
      <span class="text-sm font-semibold text-zaccBlack">Highest qualification attained</span>
      <Dropdown :modelValue="highestLevel" :options="levelOptions" optionLabel="label" optionValue="value"
        class="w-full mt-1" placeholder="Select…" showClear @update:modelValue="selectHighest" />
      <small class="block text-xs text-zaccBlack/50 mt-1">
        Choosing here ticks that level below; ticking below keeps this in step.
      </small>
    </label>

    <div class="space-y-2">
      <div v-for="level in LEVELS" :key="level.level"
        class="rounded-xl border overflow-hidden transition-colors"
        :class="isTicked(level.level) ? 'border-zaccGreen shadow-sm' : 'border-gray-200'">
        <label class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
          <Checkbox :modelValue="isTicked(level.level)" binary
            @update:modelValue="toggle(level.level, $event as boolean)" />
          <span class="font-semibold text-zaccBlack flex-1">{{ level.label }}</span>
          <span class="text-xs text-zaccBlack/40 font-semibold">{{ level.points }} pts</span>
        </label>

        <div v-if="isTicked(level.level)" class="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <!-- School levels record a result rather than a field of study. -->
          <div v-if="level.isSchoolLevel" class="grid md:grid-cols-3 gap-3">
            <label class="block">
              <span class="lbl">School</span>
              <InputText :modelValue="entry(level.level).institution" class="w-full mt-1"
                @update:modelValue="set(level.level, 'institution', $event)" />
            </label>
            <label class="block">
              <span class="lbl">Year completed</span>
              <Dropdown :modelValue="entry(level.level).yearObtained" :options="YEARS" filter showClear
                placeholder="Year" class="w-full mt-1"
                @update:modelValue="set(level.level, 'yearObtained', $event)" />
            </label>
            <label class="block">
              <span class="lbl">{{ level.level === 'GRADE_7' ? 'Units' : 'Subjects passed / points' }}</span>
              <InputText :modelValue="entry(level.level).result" class="w-full mt-1"
                :placeholder="resultPlaceholder(level.level)"
                @update:modelValue="set(level.level, 'result', $event)" />
            </label>
          </div>

          <div v-else>
            <div class="grid md:grid-cols-2 gap-3">
              <label class="block">
                <span class="lbl">Field of study</span>
                <InputText :modelValue="entry(level.level).fieldOfStudy" class="w-full mt-1"
                  @update:modelValue="set(level.level, 'fieldOfStudy', $event)" />
              </label>
              <label class="block">
                <span class="lbl">Institution <b class="req">*</b></span>
                <InputText :modelValue="entry(level.level).institution" class="w-full mt-1"
                  @update:modelValue="set(level.level, 'institution', $event)" />
              </label>
            </div>
            <div class="grid md:grid-cols-3 gap-3 mt-3">
              <label class="block">
                <span class="lbl">Country</span>
                <InputText :modelValue="entry(level.level).country" class="w-full mt-1"
                  @update:modelValue="set(level.level, 'country', $event)" />
              </label>
              <label class="block">
                <span class="lbl">Year completed</span>
                <Dropdown :modelValue="entry(level.level).yearObtained" :options="YEARS" filter showClear
                  placeholder="Year" class="w-full mt-1"
                  @update:modelValue="set(level.level, 'yearObtained', $event)" />
              </label>
              <label class="block">
                <span class="lbl">Class / grade</span>
                <InputText :modelValue="entry(level.level).classGrade" class="w-full mt-1"
                  placeholder="2.1, Distinction"
                  @update:modelValue="set(level.level, 'classGrade', $event)" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <h3 class="font-bold text-zaccBlack mt-7 mb-3 pt-4 border-t border-gray-200">
      Professional body membership
    </h3>
    <div class="space-y-3">
      <div v-for="(b, i) in memberships" :key="i" class="rounded-xl border border-gray-200 p-4">
        <div class="grid md:grid-cols-3 gap-3">
          <label class="block">
            <span class="lbl">Body / institute</span>
            <InputText v-model="b.bodyName" class="w-full mt-1" placeholder="ACCA, Law Society of Zimbabwe" />
          </label>
          <label class="block">
            <span class="lbl">Registration number</span>
            <InputText v-model="b.registrationNumber" class="w-full mt-1" />
          </label>
          <label class="block">
            <span class="lbl">Status</span>
            <Dropdown v-model="b.status" :options="['Current', 'Lapsed', 'Not applicable']"
              class="w-full mt-1" />
          </label>
        </div>
        <div class="flex justify-end mt-2">
          <Button icon="pi pi-trash" text rounded severity="danger" @click="memberships.splice(i, 1)" />
        </div>
      </div>
      <Button label="Add professional body" icon="pi pi-plus" outlined class="w-full"
        @click="memberships.push({ bodyName: '', registrationNumber: '', status: 'Current' })" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { QUALIFICATION_LEVELS, highestQualification } from '#shared/recruitment/qualifications'
import type { QualificationLevel } from '#shared/recruitment/qualifications'

const props = defineProps<{ qualifications: any[]; memberships: any[] }>()

const LEVELS = QUALIFICATION_LEVELS
const YEARS = yearOptions()
const levelOptions = LEVELS.map((l) => ({ label: l.label, value: l.level }))

const qualifications = computed(() => props.qualifications)
const memberships = computed(() => props.memberships)

const isTicked = (level: string) => qualifications.value.some((q) => q.level === level)

const entry = (level: string) =>
  qualifications.value.find((q) => q.level === level) ?? {}

const set = (level: string, field: string, value: any) => {
  const row = qualifications.value.find((q) => q.level === level)
  if (row) row[field] = value
}

const toggle = (level: string, on: boolean) => {
  const idx = qualifications.value.findIndex((q) => q.level === level)
  if (on && idx === -1) {
    const def = LEVELS.find((l) => l.level === level)!
    qualifications.value.push({
      level, levelLabel: def.label, isSchoolLevel: def.isSchoolLevel,
      fieldOfStudy: '', institution: '', country: 'Zimbabwe',
      yearObtained: null, classGrade: '', result: ''
    })
  } else if (!on && idx >= 0) {
    qualifications.value.splice(idx, 1)
  }
}

const highestLevel = computed(() =>
  highestQualification(qualifications.value.map((q) => q.level as QualificationLevel))
)

/**
 * Selecting a highest qualification ticks it. This is one-directional on
 * purpose: the dropdown is derived from the ticks, so there is no second watcher
 * to ping-pong with.
 */
const selectHighest = (level: string | null) => {
  if (!level) return
  toggle(level, true)
}

const resultPlaceholder = (level: string) =>
  level === 'A_LEVEL' ? 'e.g. 3 A Levels, 12 points'
    : level === 'O_LEVEL' ? 'e.g. 8 subjects incl. English & Maths'
      : 'e.g. 6 units'
</script>

<style scoped>
.lbl { @apply text-xs font-semibold text-zaccBlack/70; }
.req { @apply text-red-500; }
</style>

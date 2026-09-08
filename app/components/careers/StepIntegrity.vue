<template>
  <div>
    <h2 class="text-xl font-extrabold text-zaccBlack">5. Integrity &amp; compliance declarations</h2>
    <p class="text-sm text-zaccBlack/60 mt-1 mb-5">
      The Commission holds its staff to the standard it enforces. A false declaration is grounds
      for disqualification or dismissal.
    </p>

    <div class="space-y-4">
      <div v-for="d in DECLARATIONS" :key="d.key" class="rounded-xl border p-4 transition-colors"
        :class="isAdverse(d.key) ? 'border-red-300 bg-red-50/40' : 'border-gray-200'">
        <p class="font-semibold text-zaccBlack mb-3">
          {{ d.question }} <b class="text-red-500">*</b>
        </p>

        <SelectButton :modelValue="answerOf(d.key)" :options="yesNo" optionLabel="label"
          optionValue="value" :allowEmpty="false"
          @update:modelValue="setAnswer(d.key, $event)" />

        <!-- Conditional explanation, mandatory where the shared rule says so. -->
        <div v-if="needsExplanation(d.key)" class="mt-4 pt-4 border-t border-dashed border-gray-300">
          <label class="block">
            <span class="text-sm font-semibold text-zaccBlack">
              Explanation <b class="text-red-500">*</b>
            </span>
            <Textarea :modelValue="model[d.key]?.explanation ?? ''" rows="3" autoResize
              class="w-full mt-1" :placeholder="d.helpText"
              @update:modelValue="setExplanation(d.key, $event as string)" />
          </label>
        </div>

        <p v-if="d.key === 'vetting' && answerOf(d.key) === false"
          class="mt-3 text-sm font-semibold text-red-600">
          Vetting is a condition of employment. An application declining it cannot be processed.
        </p>

        <p v-else-if="d.helpText && !needsExplanation(d.key)"
          class="mt-2 text-xs text-zaccBlack/50">{{ d.helpText }}</p>
      </div>
    </div>

    <label class="flex items-start gap-3 mt-6 rounded-xl border border-gray-200 p-4">
      <Checkbox v-model="truth" binary class="mt-0.5" />
      <span class="text-sm text-zaccBlack/80">
        I declare that the information given in this application is true and complete, and I
        consent to ZACC verifying it with the institutions, employers and authorities I have named.
        <b class="text-red-500">*</b>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { DECLARATIONS, isAdverseDeclaration, requiresExplanation } from '#shared/recruitment/declarations'

const props = defineProps<{
  modelValue: Record<string, any>
  truthDeclaration: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [Record<string, any>]
  'update:truthDeclaration': [boolean]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const truth = computed({
  get: () => props.truthDeclaration,
  set: (v) => emit('update:truthDeclaration', v)
})

const yesNo = [{ label: 'No', value: false }, { label: 'Yes', value: true }]

const answerOf = (key: string) => model.value[key]?.answer ?? null

const setAnswer = (key: string, answer: boolean) => {
  model.value[key] = { ...(model.value[key] ?? {}), answer }
}
const setExplanation = (key: string, explanation: string) => {
  model.value[key] = { ...(model.value[key] ?? { answer: null }), explanation }
}

const needsExplanation = (key: string) => {
  const a = answerOf(key)
  return a !== null && requiresExplanation(key, a)
}

/** Used only for the visual highlight; the authoritative check is server-side. */
const isAdverse = (key: string) => {
  const a = answerOf(key)
  return a !== null && isAdverseDeclaration(key, a)
}

// Seed every declaration so the wizard can tell "unanswered" from "answered no".
onMounted(() => {
  for (const d of DECLARATIONS) {
    if (!model.value[d.key]) model.value[d.key] = { answer: null, explanation: '' }
  }
})
</script>

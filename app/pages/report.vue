<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
      <div class="absolute inset-0">
        <img src="/gavel.jpg" alt="Report corruption" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccBlack/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Report Corruption</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Your report helps us build a corruption-free Zimbabwe. All reports are treated with strict confidentiality.
          </p>
          <p class="mt-4">
            <NuxtLink
              to="/track"
              class="inline-flex items-center gap-2 text-zaccGold font-semibold hover:underline"
            >
              Already submitted? Track your report status
              <i class="pi pi-arrow-right text-sm"></i>
            </NuxtLink>
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="relative py-20">
      <div
        class="absolute inset-0 -z-10 opacity-20"
        style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
      ></div>
      <div class="mx-auto max-w-4xl px-6">
        <!-- Information Cards -->
        <Card
          v-if="lastSuccessReportNumber"
          class="mb-10 border-2 border-zaccGold shadow-lg"
        >
          <template #content>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-zaccGreen uppercase tracking-wide">Submission received</p>
                <p class="mt-1 text-zaccBlack">
                  Save your reference:
                  <span class="font-mono font-bold text-lg">{{ lastSuccessReportNumber }}</span>
                </p>
              </div>
              <NuxtLink
                :to="{ path: '/track', query: { ref: lastSuccessReportNumber } }"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-zaccBlack px-5 py-2.5 text-sm font-semibold text-white hover:bg-zaccBlack/90"
              >
                Track status
                <i class="pi pi-external-link text-xs"></i>
              </NuxtLink>
            </div>
          </template>
        </Card>

        <div class="grid gap-6 mb-12 sm:grid-cols-3">
          <Card class="border-l-4 border-l-zaccGreen">
            <template #content>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-zaccBlack/10 flex items-center justify-center mx-auto mb-3">
                  <i class="pi pi-lock text-zaccGreen text-2xl"></i>
                </div>
                <div class="font-semibold text-sm mb-1">Confidential</div>
                <div class="text-xs text-zaccBlack/70">Your identity is protected</div>
              </div>
            </template>
          </Card>
          <Card class="border-l-4 border-l-zaccGold">
            <template #content>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-3">
                  <i class="pi pi-shield text-zaccGold text-2xl"></i>
                </div>
                <div class="font-semibold text-sm mb-1">Safe</div>
                <div class="text-xs text-zaccBlack/70">Secure reporting system</div>
              </div>
            </template>
          </Card>
          <Card class="border-l-4 border-l-zaccGreen">
            <template #content>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-zaccBlack/10 flex items-center justify-center mx-auto mb-3">
                  <i class="pi pi-bolt text-zaccGreen text-2xl"></i>
                </div>
                <div class="font-semibold text-sm mb-1">Fast</div>
                <div class="text-xs text-zaccBlack/70">Quick response time</div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Report Form -->
        <Card class="shadow-lg">
          <template #header>
            <div class="bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 px-8 py-6 border-b border-zaccGreen/20">
              <h2 class="text-2xl font-extrabold mb-2">Corruption Report Form</h2>
              <p class="text-sm text-zaccBlack/70">
                Please provide as much detail as possible. All information will be kept confidential and used for investigation purposes only.
              </p>
            </div>
          </template>
          <template #content>
            <form @submit.prevent="handleSubmit" class="space-y-8">
              <!-- Anonymous Reporting Toggle -->
              <div class="rounded-xl bg-zaccBlack/5 p-6 border border-zaccGreen/20">
                <div class="flex items-start gap-4">
                  <Checkbox
                    v-model="form.isAnonymous"
                    inputId="anonymous"
                    :binary="true"
                    class="mt-1"
                  />
                  <label for="anonymous" class="flex-1 cursor-pointer">
                    <div class="font-semibold text-zaccBlack mb-1">Report Anonymously</div>
                    <div class="text-sm text-zaccBlack/70">
                      By default, your report will be anonymous. Uncheck this box if you wish to provide your contact details for follow-up.
                    </div>
                  </label>
                </div>
              </div>

              <!-- Personal Details Section (shown when not anonymous) -->
              <Panel v-if="!form.isAnonymous" header="Your Contact Information (Optional)" class="mb-6" toggleable>
                <template #icons>
                  <i class="pi pi-user text-zaccGold"></i>
                </template>
                <div class="grid gap-6 sm:grid-cols-2 mt-4">
                  <div>
                    <label for="name" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Full Name <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="name"
                      v-model="form.name"
                      placeholder="Enter your full name"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label for="email" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Email Address <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="email"
                      v-model="form.email"
                      type="email"
                      placeholder="your.email@example.com"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label for="phone" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Phone Number <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="phone"
                      v-model="form.phone"
                      type="tel"
                      placeholder="+263 XX XXX XXXX"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label for="organization" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Organization <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="organization"
                      v-model="form.organization"
                      placeholder="Your organization (if applicable)"
                      class="w-full"
                    />
                  </div>
                </div>
              </Panel>

              <!-- Type of Corruption -->
              <div>
                <label for="corruptionType" class="block text-sm font-semibold text-zaccBlack mb-2">
                  Type of Corruption <span class="text-red-500">*</span>
                </label>
                <Dropdown
                  id="corruptionType"
                  v-model="form.corruptionType"
                  :options="corruptionTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select type of corruption"
                  class="w-full"
                  :class="{ 'p-invalid': !form.corruptionType && submitted }"
                />
                <small v-if="!form.corruptionType && submitted" class="p-error">Type of corruption is required.</small>
              </div>

              <!-- Incident Details - Using Editor -->
              <div>
                <label for="incidentDescription" class="block text-sm font-semibold text-zaccBlack mb-2">
                  Describe the Incident <span class="text-red-500">*</span>
                </label>
                <Editor
                  id="incidentDescription"
                  ref="incidentDescriptionEditor"
                  v-model="form.incidentDescription"
                  editorStyle="height: 300px"
                  :class="{ 'p-invalid': !form.incidentDescription && submitted }"
                >
                  <template #toolbar>
                    <span class="ql-formats">
                      <button class="ql-bold"></button>
                      <button class="ql-italic"></button>
                      <button class="ql-underline"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-list" value="ordered"></button>
                      <button class="ql-list" value="bullet"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-link"></button>
                    </span>
                  </template>
                </Editor>
                <small v-if="!form.incidentDescription && submitted" class="p-error">Incident description is required.</small>
                <div class="mt-1 text-xs text-zaccBlack/60">Be as specific as possible. Include dates, amounts, and names if known.</div>
              </div>

              <!-- Location: province → district → place -->
              <div class="space-y-6">
                <div>
                  <label for="province" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Province <span class="text-red-500">*</span>
                  </label>
                  <Dropdown
                    id="province"
                    v-model="form.province"
                    :options="provinceOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select province"
                    class="w-full"
                    :class="{ 'p-invalid': !form.province && submitted }"
                  />
                  <small v-if="!form.province && submitted" class="p-error">Province is required.</small>
                </div>
                <div class="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label for="district" class="block text-sm font-semibold text-zaccBlack mb-2">
                      District <span class="text-red-500">*</span>
                    </label>
                    <Dropdown
                      id="district"
                      v-model="form.district"
                      :options="districtOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select district"
                      class="w-full"
                      :disabled="!form.province"
                      :class="{ 'p-invalid': form.province && !form.district && submitted }"
                    />
                    <small v-if="form.province && !form.district && submitted" class="p-error">District is required.</small>
                  </div>
                  <div>
                    <label for="settlement" class="block text-sm font-semibold text-zaccBlack mb-2">
                      City / town / place <span class="text-red-500">*</span>
                    </label>
                    <Dropdown
                      id="settlement"
                      v-model="form.settlement"
                      :options="settlementOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select place within district"
                      class="w-full"
                      filter
                      showClear
                      :disabled="!form.district"
                      :class="{ 'p-invalid': form.district && !form.settlement && submitted }"
                    />
                    <small v-if="form.district && !form.settlement && submitted" class="p-error">Please select a place.</small>
                    <small v-else class="text-zaccBlack/60 text-xs mt-1 block">Use the filter box to search the list.</small>
                  </div>
                </div>
                <div v-if="form.settlement === REPORT_LOCATION_OTHER">
                  <label for="placeOther" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Specify place <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    id="placeOther"
                    v-model="form.placeOther"
                    placeholder="Village, township, farm, or other place name"
                    class="w-full"
                    :class="{ 'p-invalid': form.settlement === REPORT_LOCATION_OTHER && !form.placeOther?.trim() && submitted }"
                  />
                  <small
                    v-if="form.settlement === REPORT_LOCATION_OTHER && !form.placeOther?.trim() && submitted"
                    class="p-error"
                  >
                    Please name the place.
                  </small>
                </div>
                <div>
                  <label for="locationDetail" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Street, building, or landmark <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                  </label>
                  <InputText
                    id="locationDetail"
                    v-model="form.locationDetail"
                    placeholder="e.g. stand number, office block, school name"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Date and Time -->
              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label for="incidentDate" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Date of Incident <span class="text-zaccBlack/50 font-normal">(If known)</span>
                  </label>
                  <Calendar
                    id="incidentDate"
                    v-model="form.incidentDate"
                    dateFormat="yy-mm-dd"
                    showIcon
                    iconDisplay="input"
                    inputId="incidentDate"
                    class="w-full"
                  />
                </div>
                <div>
                  <label for="incidentTime" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Time of Incident <span class="text-zaccBlack/50 font-normal">(If known)</span>
                  </label>
                  <Calendar
                    id="incidentTime"
                    v-model="form.incidentTime"
                    timeOnly
                    hourFormat="24"
                    showIcon
                    iconDisplay="input"
                    inputId="incidentTime"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- People Involved -->
              <div>
                <label class="block text-sm font-semibold text-zaccBlack mb-2">
                  People Involved <span class="text-zaccBlack/50 font-normal">(If known)</span>
                </label>
                <div class="space-y-3">
                  <div
                    v-for="(person, idx) in form.peopleList"
                    :key="idx"
                    class="rounded-lg border border-zaccBlack/10 p-3 bg-zaccBlack/[0.02]"
                  >
                    <div class="mb-2 flex items-center justify-between">
                      <div class="text-xs font-semibold text-zaccBlack/70 uppercase">Person {{ idx + 1 }}</div>
                      <Button
                        v-if="form.peopleList.length > 1"
                        type="button"
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        @click="removePerson(idx)"
                      />
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Name</label>
                        <InputText v-model="person.name" class="w-full" placeholder="First name" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Surname</label>
                        <InputText v-model="person.surname" class="w-full" placeholder="Surname" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Position</label>
                        <InputText v-model="person.position" class="w-full" placeholder="Position (if known)" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Organization</label>
                        <InputText v-model="person.organization" class="w-full" placeholder="Organization (if known)" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-3">
                  <Button
                    type="button"
                    label="Add another person"
                    icon="pi pi-plus"
                    size="small"
                    outlined
                    @click="addPerson"
                  />
                </div>
                <small class="text-zaccBlack/60">Add each person separately for clearer investigation records.</small>
              </div>

              <!-- Evidence Upload -->
              <div>
                <label class="block text-sm font-semibold text-zaccBlack mb-2">
                  Evidence / Supporting Documents <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                </label>
                <FileUpload
                  mode="basic"
                  :multiple="true"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                  :maxFileSize="10000000"
                  :auto="false"
                  chooseLabel="Upload Files"
                  @select="onFileSelect"
                  class="w-full"
                />
                <div v-if="form.files.length > 0" class="mt-4 space-y-2">
                  <div
                    v-for="(file, index) in form.files"
                    :key="index"
                    class="flex items-center justify-between rounded-lg bg-zaccBlack/5 p-3 border border-zaccGreen/20"
                  >
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <i class="pi pi-file text-zaccGreen"></i>
                      <span class="text-sm text-zaccBlack truncate">{{ file.name }}</span>
                      <span class="text-xs text-zaccBlack/60">({{ formatFileSize(file.size) }})</span>
                    </div>
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      @click="removeFile(index)"
                      aria-label="Remove file"
                    />
                  </div>
                </div>
                <small class="text-zaccBlack/60">PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max 10MB per file)</small>
              </div>

              <!-- Voice note (optional) -->
              <div class="rounded-xl border border-zaccBlack/10 p-4 bg-zaccBlack/[0.02]">
                <label class="block text-sm font-semibold text-zaccBlack mb-2">
                  Voice note <span class="text-zaccBlack/50 font-normal">(Optional, max 3 minutes)</span>
                </label>
                <p class="text-xs text-zaccBlack/60 mb-3">
                  Only the masked file is attached to your report; the raw browser capture is not kept on the server. Record a short message about the incident. Requires microphone permission.
                </p>
                <div v-if="!canUseMic" class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Recording is not available in this browser or context (try HTTPS / a modern browser).
                </div>
                <div v-else class="flex flex-wrap items-center gap-3">
                  <Button
                    v-if="!isRecording && !audioBlob"
                    type="button"
                    label="Start recording"
                    icon="pi pi-microphone"
                    severity="danger"
                    outlined
                    @click="startRecording"
                  />
                  <template v-if="isRecording">
                    <span class="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                      <span class="h-2 w-2 rounded-full bg-red-600 animate-pulse" aria-hidden="true" />
                      Recording {{ formatRecordingClock(recordingElapsedMs) }} / 03:00
                    </span>
                    <Button
                      type="button"
                      label="Stop"
                      icon="pi pi-stop"
                      severity="danger"
                      @click="stopRecordingClick"
                    />
                  </template>
                  <template v-if="audioBlob && !isRecording">
                    <div v-if="maskedPreviewLoading" class="flex w-full flex-wrap items-center gap-2 text-sm text-zaccBlack/70">
                      <i class="pi pi-spin pi-spinner text-zaccGreen" aria-hidden="true" />
                      <span>Building masked preview on the server…</span>
                    </div>
                    <template v-else-if="maskedPreviewUrl">
                      <p class="w-full text-xs font-medium text-zaccBlack/70 mb-1">
                        Masked preview (this is what will be saved)
                      </p>
                      <audio
                        :src="maskedPreviewUrl"
                        controls
                        playsinline
                        preload="auto"
                        class="voice-preview-audio max-w-full flex-1 min-w-[220px]"
                      />
                    </template>
                    <div v-else-if="maskedPreviewError" class="w-full space-y-2">
                      <p class="text-sm text-amber-800">
                        Masked preview failed. Check the server console for the error; this repo ships a bundled ffmpeg via npm when none is on PATH. You can also install ffmpeg on PATH or set FFMPEG_PATH. Retry or submit — masking runs again on submit.
                      </p>
                      <Button
                        type="button"
                        label="Retry masked preview"
                        icon="pi pi-refresh"
                        size="small"
                        outlined
                        @click="() => loadMaskedPreview({ silent: false })"
                      />
                      <p class="text-xs text-zaccBlack/55">Temporary raw preview (browser only):</p>
                      <audio
                        :src="audioPreviewUrl || undefined"
                        controls
                        playsinline
                        preload="auto"
                        class="voice-preview-audio max-w-full flex-1 min-w-[220px]"
                      />
                    </div>
                    <Button
                      type="button"
                      label="Remove recording"
                      icon="pi pi-trash"
                      severity="secondary"
                      text
                      class="mt-1"
                      @click="discardAudio"
                    />
                  </template>
                </div>
              </div>

              <!-- Additional Information - Using Editor -->
              <div>
                <label for="additionalInfo" class="block text-sm font-semibold text-zaccBlack mb-2">
                  Additional Information <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                </label>
                <Editor
                  id="additionalInfo"
                  ref="additionalInfoEditor"
                  v-model="form.additionalInfo"
                  editorStyle="height: 200px"
                >
                  <template #toolbar>
                    <span class="ql-formats">
                      <button class="ql-bold"></button>
                      <button class="ql-italic"></button>
                      <button class="ql-underline"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-list" value="ordered"></button>
                      <button class="ql-list" value="bullet"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-link"></button>
                    </span>
                  </template>
                </Editor>
              </div>

              <!-- Privacy Notice -->
              <Message severity="info" :closable="false">
                <template #icon>
                  <i class="pi pi-info-circle"></i>
                </template>
                <div>
                  <div class="font-semibold mb-1">Privacy & Confidentiality</div>
                  <p class="text-sm">
                    Your report will be treated with strict confidentiality. If you choose to report anonymously, your identity will not be disclosed. 
                    All information provided will be used solely for investigation purposes and in accordance with the Anti-Corruption Commission Act.
                  </p>
                </div>
              </Message>

              <!-- Submit Button -->
              <div class="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-zaccBlack/10">
                <div class="text-sm text-zaccBlack/70">
                  <span class="text-red-500">*</span> Required fields
                </div>
                <Button
                  type="submit"
                  label="Submit Report"
                  icon="pi pi-send"
                  :loading="isSubmitting"
                  class="w-full sm:w-auto"
                  style="background: #209341; border-color: #209341;"
                />
              </div>

              <Card
                v-if="lastSuccessReportNumber"
                class="border-2 border-zaccGold shadow-lg"
              >
                <template #content>
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p class="text-sm font-semibold text-zaccGreen uppercase tracking-wide">Submission received</p>
                      <p class="mt-1 text-zaccBlack">
                        Save your reference:
                        <span class="font-mono font-bold text-lg">{{ lastSuccessReportNumber }}</span>
                      </p>
                    </div>
                    <NuxtLink
                      :to="{ path: '/track', query: { ref: lastSuccessReportNumber } }"
                      class="inline-flex items-center justify-center gap-2 rounded-lg bg-zaccBlack px-5 py-2.5 text-sm font-semibold text-white hover:bg-zaccBlack/90"
                    >
                      Track status
                      <i class="pi pi-external-link text-xs"></i>
                    </NuxtLink>
                  </div>
                </template>
              </Card>
            </form>
          </template>
        </Card>

        <!-- Alternative Contact Methods -->
        <div class="mt-12 rounded-2xl bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
          <h3 class="text-xl font-extrabold mb-4 text-center">Alternative Ways to Report</h3>
          <div class="grid gap-6 sm:grid-cols-3">
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i class="pi pi-phone text-zaccGreen text-2xl"></i>
              </div>
              <div class="font-semibold mb-1">Phone</div>
              <div class="text-sm text-zaccBlack/70">Call our hotline</div>
              <a href="tel:+263242000000" class="text-zaccGreen hover:text-zaccGreen/80 text-sm font-semibold mt-2 inline-block">
                +263 24 200 0000
              </a>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i class="pi pi-envelope text-zaccGreen text-2xl"></i>
              </div>
              <div class="font-semibold mb-1">Email</div>
              <div class="text-sm text-zaccBlack/70">Send us an email</div>
              <a href="mailto:report@zacc.org.zw" class="text-zaccGreen hover:text-zaccGreen/80 text-sm font-semibold mt-2 inline-block">
                report@zacc.org.zw
              </a>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i class="pi pi-map-marker text-zaccGreen text-2xl"></i>
              </div>
              <div class="font-semibold mb-1">In Person</div>
              <div class="text-sm text-zaccBlack/70">Visit our offices</div>
              <NuxtLink to="/contact" class="text-zaccGreen hover:text-zaccGreen/80 text-sm font-semibold mt-2 inline-block">
                View Address
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Emergency Notice -->
        <Message severity="warn" :closable="false" class="mt-8">
          <template #icon>
            <i class="pi pi-exclamation-triangle"></i>
          </template>
          <div>
            <div class="font-semibold mb-1">Emergency Situation?</div>
            <p class="text-sm">
              If you are in immediate danger or facing a life-threatening situation, please contact local law enforcement (Police) first at <strong>999</strong> or <strong>+263 4 703 631</strong> before submitting this report.
            </p>
          </div>
        </Message>

        <!-- Back to Home -->
        <div class="text-center pt-8">
          <Button
            label="Back to Home"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            @click="navigateTo('/')"
          />
        </div>
      </div>
    </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useToast } from 'primevue/usetoast'
import {
  zimbabweReportProvinces,
  getDistrictsForProvince,
  getPlacesForDistrict,
  REPORT_LOCATION_OTHER,
  type ZimbabweProvinceSlug
} from '~/data/zimbabweReportLocations'

useHead({
  title: 'Report Corruption - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Report corruption confidentially and securely. Your identity is protected. Help us build a corruption-free Zimbabwe.'
    }
  ]
})

const toast = useToast()
const createEmptyPerson = () => ({
  name: '',
  surname: '',
  position: '',
  organization: ''
})

// Editor refs
const incidentDescriptionEditor = ref()
const additionalInfoEditor = ref()

const form = reactive({
  isAnonymous: true,
  name: '',
  email: '',
  phone: '',
  organization: '',
  corruptionType: null,
  incidentDescription: '',
  province: null as ZimbabweProvinceSlug | null,
  district: null as string | null,
  settlement: null as string | null,
  placeOther: '',
  locationDetail: '',
  incidentDate: null,
  incidentTime: null,
  peopleList: [createEmptyPerson()],
  files: [],
  additionalInfo: ''
})

const corruptionTypes = [
  { label: 'Bribery', value: 'bribery' },
  { label: 'Embezzlement', value: 'embezzlement' },
  { label: 'Fraud', value: 'fraud' },
  { label: 'Nepotism / Favoritism', value: 'nepotism' },
  { label: 'Extortion', value: 'extortion' },
  { label: 'Abuse of Power', value: 'abuse-of-power' },
  { label: 'Conflict of Interest', value: 'conflict-of-interest' },
  { label: 'Procurement Fraud', value: 'procurement-fraud' },
  { label: 'Money Laundering', value: 'money-laundering' },
  { label: 'Other', value: 'other' }
]

const provinceOptions = zimbabweReportProvinces.map((p) => ({ label: p.label, value: p.value }))

const districtOptions = computed(() =>
  getDistrictsForProvince(form.province as ZimbabweProvinceSlug | null).map((d) => ({
    label: d.name,
    value: d.name
  }))
)

const settlementOptions = computed(() => {
  const raw = getPlacesForDistrict(form.province as ZimbabweProvinceSlug | null, form.district)
  return raw.map((s) => ({ label: s, value: s }))
})

watch(
  () => form.province,
  () => {
    form.district = null
    form.settlement = null
    form.placeOther = ''
  }
)

watch(
  () => form.district,
  () => {
    form.settlement = null
    form.placeOther = ''
  }
)

const isSubmitting = ref(false)
const submitted = ref(false)
const lastSuccessReportNumber = ref('')

const MAX_AUDIO_MS = 3 * 60 * 1000
const audioBlob = ref<Blob | null>(null)
const audioPreviewUrl = ref<string | null>(null)
const maskedPreviewBlob = ref<Blob | null>(null)
const maskedPreviewUrl = ref<string | null>(null)
const maskedPreviewLoading = ref(false)
const maskedPreviewError = ref(false)
const isRecording = ref(false)
const recordingElapsedMs = ref(0)
let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let recordChunks: Blob[] = []
let recordInterval: ReturnType<typeof setInterval> | null = null
let recordStartedAt = 0

const canUseMic = computed(
  () => import.meta.client && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
)

function clearMaskedPreviewState() {
  if (maskedPreviewUrl.value) {
    URL.revokeObjectURL(maskedPreviewUrl.value)
    maskedPreviewUrl.value = null
  }
  maskedPreviewBlob.value = null
  maskedPreviewError.value = false
  maskedPreviewLoading.value = false
}

watch(audioBlob, (blob) => {
  if (audioPreviewUrl.value) {
    URL.revokeObjectURL(audioPreviewUrl.value)
    audioPreviewUrl.value = null
  }
  if (blob) {
    audioPreviewUrl.value = URL.createObjectURL(blob)
  } else {
    clearMaskedPreviewState()
  }
})

async function loadMaskedPreview(opts?: { silent?: boolean }) {
  if (!audioBlob.value) return
  maskedPreviewLoading.value = true
  maskedPreviewError.value = false
  if (maskedPreviewUrl.value) {
    URL.revokeObjectURL(maskedPreviewUrl.value)
    maskedPreviewUrl.value = null
  }
  maskedPreviewBlob.value = null
  try {
    const fd = new FormData()
    fd.append('audio', audioBlob.value, 'preview.webm')
    const blob = await $fetch<Blob>('/api/public/reports/voice-preview', {
      method: 'POST',
      body: fd,
      responseType: 'blob'
    })
    if (!blob || blob.size < 32) {
      throw new Error('empty masked response')
    }
    maskedPreviewBlob.value = blob
    maskedPreviewUrl.value = URL.createObjectURL(blob)
  } catch {
    maskedPreviewError.value = true
    if (!opts?.silent) {
      toast.add({
        severity: 'warn',
        summary: 'Masked preview unavailable',
        detail:
          'The server could not mask audio (install ffmpeg on PATH, or set FFMPEG_PATH). Retry here or submit — masking runs again on submit.',
        life: 8000
      })
    }
  } finally {
    maskedPreviewLoading.value = false
  }
}

function formatRecordingClock(ms: number) {
  const s = Math.min(Math.floor(ms / 1000), 3 * 60)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function clearRecordInterval() {
  if (recordInterval) {
    clearInterval(recordInterval)
    recordInterval = null
  }
}

function stopMediaStream() {
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
}

function discardAudio() {
  if (isRecording.value && mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = () => {
      clearRecordInterval()
      stopMediaStream()
      isRecording.value = false
      mediaRecorder = null
      recordChunks = []
    }
    mediaRecorder.stop()
    return
  }
  audioBlob.value = null
  recordChunks = []
}

async function startRecording() {
  if (!canUseMic.value || isRecording.value) return
  clearMaskedPreviewState()
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Microphone blocked',
      detail: 'Allow microphone access in your browser settings to record a voice note.',
      life: 6000
    })
    return
  }

  recordChunks = []
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''
  try {
    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Recording failed',
      detail: 'This browser cannot record audio in a supported format.',
      life: 6000
    })
    stopMediaStream()
    return
  }

  recordingElapsedMs.value = 0
  recordStartedAt = Date.now()

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordChunks.push(e.data)
  }

  mediaRecorder.onstop = () => {
    clearRecordInterval()
    stopMediaStream()
    isRecording.value = false
    const mime = mediaRecorder?.mimeType || 'audio/webm'
    mediaRecorder = null
    if (recordChunks.length) {
      audioBlob.value = new Blob(recordChunks, { type: mime })
      void loadMaskedPreview({ silent: true })
    }
  }

  recordInterval = setInterval(() => {
    recordingElapsedMs.value = Date.now() - recordStartedAt
    if (recordingElapsedMs.value >= MAX_AUDIO_MS) {
      stopRecordingClick()
    }
  }, 250)

  mediaRecorder.start(500)
  isRecording.value = true
}

function stopRecordingClick() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    clearRecordInterval()
    return
  }
  mediaRecorder.stop()
}

onBeforeUnmount(() => {
  clearRecordInterval()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop()
    } catch {
      /* ignore */
    }
  }
  stopMediaStream()
  if (audioPreviewUrl.value) {
    URL.revokeObjectURL(audioPreviewUrl.value)
  }
  if (maskedPreviewUrl.value) {
    URL.revokeObjectURL(maskedPreviewUrl.value)
  }
})

// Form reset helper (must run after `form` and `submitted` exist)
const resetForm = async () => {
  form.isAnonymous = true
  form.name = ''
  form.email = ''
  form.phone = ''
  form.organization = ''
  form.corruptionType = null
  form.incidentDescription = ''
  form.province = null
  form.district = null
  form.settlement = null
  form.placeOther = ''
  form.locationDetail = ''
  form.incidentDate = null
  form.incidentTime = null
  form.peopleList = [createEmptyPerson()]
  form.files = []
  form.additionalInfo = ''
  submitted.value = false
  discardAudio()

  await nextTick()
  if (incidentDescriptionEditor.value) {
    incidentDescriptionEditor.value.setContent('')
  }
  if (additionalInfoEditor.value) {
    additionalInfoEditor.value.setContent('')
  }
}

const onFileSelect = (event: { files: File[] | FileList }) => {
  const list = Array.from(event.files || [])
  const seen = new Set(form.files.map((f: File) => `${f.name}|${f.size}|${f.lastModified}`))
  for (const file of list) {
    if (file.size > 10 * 1024 * 1024) {
      toast.add({
        severity: 'warn',
        summary: 'File too large',
        detail: `${file.name} exceeds 10MB and was skipped.`,
        life: 5000
      })
      continue
    }
    const key = `${file.name}|${file.size}|${file.lastModified}`
    if (seen.has(key)) continue
    seen.add(key)
    form.files.push(file)
  }
}

const removeFile = (index) => {
  form.files.splice(index, 1)
}
const addPerson = () => {
  form.peopleList.push(createEmptyPerson())
}
const removePerson = (index) => {
  form.peopleList.splice(index, 1)
}

function isLocationComplete() {
  if (!form.province || !form.district || !form.settlement) return false
  if (form.settlement === REPORT_LOCATION_OTHER && !form.placeOther?.trim()) return false
  return true
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleSubmit = async () => {
  submitted.value = true
  
  if (!form.corruptionType || !form.incidentDescription || !isLocationComplete()) {
    return
  }

  isSubmitting.value = true

  try {
    // Prepare form data
    const formData = new FormData()
    
    // Add form fields
    formData.append('isAnonymous', form.isAnonymous.toString())
    formData.append('corruptionType', form.corruptionType)
    formData.append('incidentDescription', form.incidentDescription)
    const provinceLabel =
      provinceOptions.find((p) => p.value === form.province)?.label || String(form.province)
    const placeLabel =
      form.settlement === REPORT_LOCATION_OTHER
        ? form.placeOther.trim()
        : String(form.settlement)
    let locationLine = `Place: ${placeLabel}; District: ${form.district}; Province: ${provinceLabel}`
    if (form.locationDetail?.trim()) {
      locationLine += `; Details: ${form.locationDetail.trim()}`
    }
    formData.append('location', locationLine)
    formData.append('province', form.province)
    
    if (form.incidentDate) {
      formData.append('incidentDate', form.incidentDate instanceof Date 
        ? form.incidentDate.toISOString() 
        : new Date(form.incidentDate).toISOString())
    }
    
    if (form.incidentTime) {
      formData.append('incidentTime', typeof form.incidentTime === 'string' 
        ? form.incidentTime 
        : form.incidentTime.toString())
    }
    
    const peopleInvolvedText = form.peopleList
      .map((p) => ({
        name: p.name?.trim(),
        surname: p.surname?.trim(),
        position: p.position?.trim(),
        organization: p.organization?.trim()
      }))
      .filter((p) => p.name || p.surname || p.position || p.organization)
      .map((p, i) => {
        const fullName = [p.name, p.surname].filter(Boolean).join(' ').trim()
        const parts = [fullName || 'Unknown name']
        if (p.position) parts.push(`Position: ${p.position}`)
        if (p.organization) parts.push(`Organization: ${p.organization}`)
        return `${i + 1}. ${parts.join(' | ')}`
      })
      .join('\n')
    if (peopleInvolvedText) {
      formData.append('peopleInvolved', peopleInvolvedText)
    }
    
    if (form.additionalInfo) {
      formData.append('additionalInfo', form.additionalInfo)
    }
    
    // Add contact info only if not anonymous
    if (!form.isAnonymous) {
      if (form.name) formData.append('name', form.name)
      if (form.email) formData.append('email', form.email)
      if (form.phone) formData.append('phone', form.phone)
      if (form.organization) formData.append('organization', form.organization)
    }
    
    form.files.forEach((file: File) => {
      formData.append('files', file, file.name)
    })

    if (maskedPreviewBlob.value) {
      formData.append('audio', maskedPreviewBlob.value, 'voice-masked.ogg')
    } else if (audioBlob.value) {
      const mime = audioBlob.value.type || 'audio/webm'
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm'
      formData.append('audio', audioBlob.value, `report-voice-note.${ext}`)
    }

    const response = await $fetch<{
      reportNumber: string
      audioProcessingFailed?: boolean
    }>('/api/public/reports', {
      method: 'POST',
      body: formData,
      timeout: 120000
    })

    // Reset form first
    resetForm()

    lastSuccessReportNumber.value = response.reportNumber
    // Show success message with report number
    await nextTick()
    toast.add({
      severity: 'success',
      summary: 'Report Submitted Successfully',
      detail: `Your report has been received. Reference: ${response.reportNumber}. You can track status anytime from this page.`,
      life: 10000
    })
    if (response.audioProcessingFailed) {
      toast.add({
        severity: 'warn',
        summary: 'Voice note not saved',
        detail:
          'The report was saved, but your voice note could not be processed. The server needs ffmpeg (e.g. apt install ffmpeg). You can submit again with a new recording if needed.',
        life: 14000
      })
    }
    
    // Scroll to top to show success message
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  } catch (error: any) {
    console.error('Error submitting form:', error)
    await nextTick()
    const msg =
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.statusMessage ||
      error?.message ||
      'There was an error submitting your report. Please try again or contact us directly.'
    toast.add({
      severity: 'error',
      summary: 'Submission Failed',
      detail: msg,
      life: 8000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
:deep(.p-card) {
  box-shadow: 0 10px 30px 0 rgba(41, 61, 102, 0.2);
}

:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-fileupload) {
  width: 100%;
}

:deep(.p-editor-container) {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

:deep(.p-editor-container .p-editor-toolbar) {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

:deep(.p-editor-container .ql-editor) {
  min-height: 200px;
}

:deep(.p-panel-header) {
  background: rgba(212, 175, 55, 0.05);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

:deep(.p-button) {
  font-weight: 600;
}

:deep(.p-message) {
  border-radius: 0.75rem;
}

/* Voice preview: avoid ultra-short control bar; helps perceived clarity on small layouts */
.voice-preview-audio {
  min-height: 2.75rem;
  width: 100%;
}
</style>

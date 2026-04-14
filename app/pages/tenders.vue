<template>
  <NuxtLayout name="main">
    <div>
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img src="/harare.JPG" alt="" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6 text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">Tenders</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">Procurement notices and RFQs published by ZACC.</p>
        </div>
      </section>

      <section class="relative py-16">
        <div class="mx-auto max-w-7xl px-6">
          <Card v-if="!supplierProfile" class="mb-8 border border-zaccGold/30 shadow-md">
            <template #content>
              <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 class="text-xl font-bold text-zaccBlack">Supplier portal</h2>
                  <p class="text-sm text-zaccBlack/70 mt-1">
                    Register as a supplier or sign in to submit bids and manage your profile.
                  </p>
                </div>
                <div class="flex gap-2">
                  <Button label="Supplier signup" icon="pi pi-user-plus" @click="signupVisible = true" />
                  <Button label="Supplier login" icon="pi pi-sign-in" outlined @click="loginVisible = true" />
                </div>
              </div>
            </template>
          </Card>

          <Card v-else class="mb-8 border border-zaccGreen/30 shadow-md">
            <template #content>
              <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 class="text-xl font-bold text-zaccBlack">Supplier dashboard</h2>
                  <p class="text-sm text-zaccBlack/70">
                    Signed in as {{ supplierProfile.companyName }} ({{ supplierProfile.email }})
                  </p>
                </div>
                <Button label="Logout" icon="pi pi-sign-out" severity="secondary" outlined @click="logoutSupplier" />
              </div>

              <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div class="lg:col-span-3 rounded-lg border border-zaccBlack/10 p-2">
                  <button
                    class="w-full rounded-md px-3 py-2 text-left text-sm"
                    :class="supplierSection === 'overview' ? 'bg-zaccGreen text-white' : 'hover:bg-zaccBlack/5 text-zaccBlack'"
                    @click="supplierSection = 'overview'"
                  >
                    Overview
                  </button>
                  <button
                    class="mt-1 w-full rounded-md px-3 py-2 text-left text-sm"
                    :class="supplierSection === 'profile' ? 'bg-zaccGreen text-white' : 'hover:bg-zaccBlack/5 text-zaccBlack'"
                    @click="supplierSection = 'profile'"
                  >
                    Profile
                  </button>
                  <button
                    class="mt-1 w-full rounded-md px-3 py-2 text-left text-sm"
                    :class="supplierSection === 'categories' ? 'bg-zaccGreen text-white' : 'hover:bg-zaccBlack/5 text-zaccBlack'"
                    @click="supplierSection = 'categories'"
                  >
                    Categories
                  </button>
                  <button
                    class="mt-1 w-full rounded-md px-3 py-2 text-left text-sm"
                    :class="supplierSection === 'documents' ? 'bg-zaccGreen text-white' : 'hover:bg-zaccBlack/5 text-zaccBlack'"
                    @click="supplierSection = 'documents'"
                  >
                    Documents
                  </button>
                  <button
                    class="mt-1 w-full rounded-md px-3 py-2 text-left text-sm"
                    :class="supplierSection === 'tenders' ? 'bg-zaccGreen text-white' : 'hover:bg-zaccBlack/5 text-zaccBlack'"
                    @click="supplierSection = 'tenders'"
                  >
                    Tenders
                  </button>
                  <button
                    class="mt-1 w-full rounded-md px-3 py-2 text-left text-sm"
                    :class="supplierSection === 'myBids' ? 'bg-zaccGreen text-white' : 'hover:bg-zaccBlack/5 text-zaccBlack'"
                    @click="supplierSection = 'myBids'"
                  >
                    My Bids
                  </button>
                </div>

                <div class="lg:col-span-9 rounded-lg border border-zaccBlack/10 p-4">
                  <div v-if="supplierSection === 'overview'" class="space-y-4">
                    <h3 class="font-semibold text-zaccBlack">Overview</h3>
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Selected categories</div>
                        <div class="mt-1 text-2xl font-bold text-zaccBlack">{{ supplierStats.totalCategories }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Approved categories</div>
                        <div class="mt-1 text-2xl font-bold text-zaccGreen">{{ supplierStats.approvedCategories }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Pending categories</div>
                        <div class="mt-1 text-2xl font-bold text-amber-600">{{ supplierStats.pendingCategories }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Rejected categories</div>
                        <div class="mt-1 text-2xl font-bold text-red-600">{{ supplierStats.rejectedCategories }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Uploaded documents</div>
                        <div class="mt-1 text-2xl font-bold text-zaccBlack">{{ supplierStats.documents }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Open tenders now</div>
                        <div class="mt-1 text-2xl font-bold text-zaccBlack">{{ supplierStats.openTenders }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Total bids</div>
                        <div class="mt-1 text-2xl font-bold text-zaccBlack">{{ supplierStats.totalBids }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Submitted bids</div>
                        <div class="mt-1 text-2xl font-bold text-zaccGreen">{{ supplierStats.submittedBids }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Bids on open tenders</div>
                        <div class="mt-1 text-2xl font-bold text-amber-600">{{ supplierStats.bidsOnOpenTenders }}</div>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 bg-zaccBlack/[0.02] p-3">
                        <div class="text-xs font-semibold text-zaccBlack/60">Bids on closed tenders</div>
                        <div class="mt-1 text-2xl font-bold text-zaccBlack">{{ supplierStats.bidsOnClosedTenders }}</div>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div class="rounded-lg border border-zaccBlack/10 p-3">
                        <div class="text-sm font-semibold text-zaccBlack">Eligible open tenders</div>
                        <div class="mt-1 text-2xl font-bold text-zaccGreen">{{ supplierStats.eligibleOpenTenders }}</div>
                        <p class="mt-1 text-xs text-zaccBlack/60">
                          Based on your currently approved categories.
                        </p>
                      </div>
                      <div class="rounded-lg border border-zaccBlack/10 p-3">
                        <div class="text-sm font-semibold text-zaccBlack">Nearest closing tender</div>
                        <p v-if="nextClosingTender" class="mt-1 text-sm text-zaccBlack">
                          <span class="font-semibold">{{ nextClosingTender.title }}</span>
                          closes in {{ formatCountdown(Math.max(getCountdownMs(nextClosingTender), 0)) }}
                        </p>
                        <p v-else class="mt-1 text-sm text-zaccBlack/60">No open tenders at the moment.</p>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="supplierSection === 'profile'" class="space-y-3">
                    <h3 class="font-semibold text-zaccBlack">Profile</h3>
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Company name</label>
                        <InputText v-model="supplierForm.companyName" class="w-full" />
                      </div>
                      <div>
                        <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Contact person</label>
                        <InputText v-model="supplierForm.contactPerson" class="w-full" />
                      </div>
                      <div>
                        <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Phone</label>
                        <InputText v-model="supplierForm.phone" class="w-full" />
                      </div>
                      <div>
                        <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Address</label>
                        <InputText v-model="supplierForm.address" class="w-full" />
                      </div>
                    </div>
                    <Button label="Save profile" icon="pi pi-save" :loading="savingProfile" @click="saveSupplierProfile" />
                  </div>

                  <div v-else-if="supplierSection === 'categories'" class="space-y-3">
                    <h3 class="font-semibold text-zaccBlack">Categories</h3>
                    <div>
                      <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Select categories</label>
                      <MultiSelect
                        v-model="supplierCategoryIds"
                        :options="categories"
                        optionLabel="name"
                        optionValue="id"
                        display="chip"
                        filter
                        class="w-full"
                        placeholder="Select categories"
                      />
                    </div>
                    <Button
                      label="Save categories"
                      icon="pi pi-save"
                      :loading="savingCategories"
                      @click="saveSupplierCategories"
                    />
                    <div v-if="supplierProfile.approvals?.length" class="space-y-2">
                      <div
                        v-for="ap in supplierProfile.approvals"
                        :key="ap.id"
                        class="flex items-center justify-between rounded border border-zaccBlack/10 px-2 py-1"
                      >
                        <span class="text-sm text-zaccBlack">{{ ap.category?.name }}</span>
                        <Tag :value="ap.status" :severity="approvalSeverity(ap.status)" />
                      </div>
                    </div>
                    <p v-else class="text-sm text-zaccBlack/60">No categories selected yet.</p>
                  </div>

                  <div v-else-if="supplierSection === 'documents'" class="space-y-3">
                    <div class="mb-1 flex items-center justify-between">
                      <h3 class="font-semibold text-zaccBlack">Supplier documents</h3>
                      <FileUpload mode="basic" customUpload auto chooseLabel="Upload document" @uploader="uploadSupplierDocument" />
                    </div>
                    <div v-if="supplierProfile.documents?.length" class="grid grid-cols-1 gap-2">
                      <div
                        v-for="doc in supplierProfile.documents"
                        :key="doc.id"
                        class="rounded border border-zaccBlack/10 bg-white p-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                      >
                        <span class="text-sm text-zaccBlack">{{ doc.fileName }}</span>
                        <div class="flex items-center gap-2">
                          <a :href="doc.fileUrl" target="_blank" class="text-xs text-zaccGreen hover:underline">View</a>
                          <a :href="doc.fileUrl" :download="doc.fileName" class="text-xs text-zaccGreen hover:underline">Download</a>
                          <Button
                            icon="pi pi-trash"
                            label="Delete"
                            size="small"
                            text
                            severity="danger"
                            :loading="deletingSupplierDocId === doc.id"
                            @click="removeSupplierDocument(doc.id)"
                          />
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-sm text-zaccBlack/60">No documents uploaded yet.</p>
                  </div>

                  <div v-else-if="supplierSection === 'tenders'" class="space-y-4">
                    <h3 class="font-semibold text-zaccBlack">Tenders</h3>
                    <div class="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label class="text-sm font-semibold text-zaccBlack">Category</label>
                        <select v-model="selectedCategory" class="mt-1 w-full rounded-lg border px-4 py-2.5" @change="fetchTenders">
                          <option value="">All categories</option>
                          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                      </div>
                    </div>

                    <div v-if="loading" class="text-center py-8 text-zaccBlack/60">Loading tenders...</div>
                    <div v-else-if="tenders.length === 0" class="text-center py-8 text-zaccBlack/60">No tenders available.</div>
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card v-for="t in tenders" :key="t.id" class="border border-zaccGreen/20 shadow-md rounded-xl overflow-hidden">
                        <template #content>
                          <div class="flex h-full flex-col gap-3">
                            <div class="flex flex-wrap items-center gap-2 justify-between">
                              <h4 class="text-lg font-extrabold text-zaccBlack">{{ t.title }}</h4>
                              <Tag :value="t.type" severity="info" />
                              <Tag :value="t.category?.name" severity="secondary" />
                            </div>
                            <p v-if="t.reference" class="text-sm text-zaccBlack/60">Ref: {{ t.reference }}</p>
                            <p class="text-sm text-zaccBlack/80 line-clamp-3">{{ summarizeDetails(t.details) }}</p>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div class="rounded-lg bg-zaccBlack/[0.04] px-3 py-2 text-zaccBlack/80">
                                <span class="font-semibold">Closes:</span> {{ formatDate(t.closingDate) }}
                              </div>
                              <div v-if="isTenderOpen(t)" class="rounded-lg bg-zaccGreen/10 px-3 py-2 text-zaccGreen font-semibold">
                                Countdown: {{ formatCountdown(getCountdownMs(t)) }}
                              </div>
                              <div v-else class="rounded-lg bg-red-50 px-3 py-2 text-red-600 font-semibold">
                                Closed
                              </div>
                            </div>

                            <div class="pt-2 mt-auto border-t border-zaccBlack/10 flex items-center gap-2 flex-wrap">
                              <Button label="View details" icon="pi pi-eye" text @click="openTenderDetail(t)" />
                              <Button
                                :label="getBidButtonLabel(t)"
                                icon="pi pi-send"
                                :disabled="!canBidForTender(t)"
                                @click="openBidDialog(t)"
                              />
                              <p v-if="hasExistingBid(t) && isTenderOpen(t)" class="text-xs text-zaccBlack/60">
                                You can edit this bid until tender closes.
                              </p>
                              <p v-else-if="hasExistingBid(t)" class="text-xs text-zaccBlack/60">
                                You have already bid on this tender.
                              </p>
                              <p v-else-if="!isApprovedForTender(t)" class="text-xs text-amber-700">
                                Your account is not yet approved for this category.
                              </p>
                            </div>
                          </div>
                        </template>
                      </Card>
                    </div>
                  </div>

                  <div v-else class="space-y-4">
                    <h3 class="font-semibold text-zaccBlack">My Bids</h3>
                    <div v-if="!supplierProfile?.bids?.length" class="text-sm text-zaccBlack/60">
                      You have not submitted any bids yet.
                    </div>
                    <div v-else class="space-y-3">
                      <div
                        v-for="b in supplierProfile.bids"
                        :key="b.id"
                        class="rounded-lg border border-zaccBlack/10 p-3 bg-white"
                      >
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div class="font-semibold text-zaccBlack">{{ b.tender?.title || 'Tender' }}</div>
                            <div class="text-xs text-zaccBlack/60">
                              Submitted: {{ formatDate(b.createdAt) }}
                            </div>
                          </div>
                          <Tag :value="isTenderOpen(b.tender) ? 'OPEN' : 'CLOSED'" :severity="isTenderOpen(b.tender) ? 'success' : 'danger'" />
                        </div>
                        <div class="mt-2 text-sm text-zaccBlack/70">
                          Amount: {{ b.totalAmount != null ? formatAmount(b.totalAmount) : '-' }} | Documents: {{ b.documents?.length || 0 }}
                        </div>
                        <div class="mt-3 flex items-center gap-2">
                          <Button
                            label="View tender"
                            icon="pi pi-eye"
                            text
                            @click="openTenderDetailById(b.tenderId)"
                          />
                          <Button
                            label="Edit Bid"
                            icon="pi pi-pencil"
                            :disabled="!isTenderOpen(b.tender) || !isApprovedForTender(b.tender)"
                            @click="openBidDialogByBid(b)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <div v-if="!supplierProfile" class="mb-8 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-semibold text-zaccBlack">Category</label>
              <select v-model="selectedCategory" class="mt-1 w-full rounded-lg border px-4 py-2.5" @change="fetchTenders">
                <option value="">All categories</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <div v-if="!supplierProfile && loading" class="text-center py-16 text-zaccBlack/60">Loading tenders...</div>
          <div v-else-if="!supplierProfile && tenders.length === 0" class="text-center py-16 text-zaccBlack/60">No tenders available.</div>
          <div v-else-if="!supplierProfile" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card v-for="t in tenders" :key="t.id" class="border border-zaccGreen/20 shadow-lg rounded-xl overflow-hidden">
              <template #content>
                <div class="flex h-full flex-col gap-3">
                  <div class="flex flex-wrap items-center gap-2 justify-between">
                    <h2 class="text-xl font-extrabold text-zaccBlack">{{ t.title }}</h2>
                    <Tag :value="t.type" severity="info" />
                    <Tag :value="t.category?.name" severity="secondary" />
                  </div>
                  <p v-if="t.reference" class="text-sm text-zaccBlack/60">Ref: {{ t.reference }}</p>
                  <p class="text-sm text-zaccBlack/80 line-clamp-3">{{ summarizeDetails(t.details) }}</p>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div class="rounded-lg bg-zaccBlack/[0.04] px-3 py-2 text-zaccBlack/80">
                      <span class="font-semibold">Closes:</span> {{ formatDate(t.closingDate) }}
                    </div>
                    <div v-if="isTenderOpen(t)" class="rounded-lg bg-zaccGreen/10 px-3 py-2 text-zaccGreen font-semibold">
                      Countdown: {{ formatCountdown(getCountdownMs(t)) }}
                    </div>
                    <div v-else class="rounded-lg bg-red-50 px-3 py-2 text-red-600 font-semibold">
                      Closed
                    </div>
                  </div>

                  <div class="pt-2 mt-auto border-t border-zaccBlack/10 flex items-center gap-2 flex-wrap">
                    <Button label="View details" icon="pi pi-eye" text @click="openTenderDetail(t)" />
                    <Button
                      :label="getBidButtonLabel(t)"
                      icon="pi pi-send"
                      :disabled="!canBidForTender(t)"
                      @click="openBidDialog(t)"
                    />
                    <p v-if="!supplierProfile" class="mt-2 text-xs text-zaccBlack/60">Login as supplier to bid.</p>
                    <p v-else-if="hasExistingBid(t) && isTenderOpen(t)" class="mt-2 text-xs text-zaccBlack/60">
                      You can edit this bid until tender closes.
                    </p>
                    <p v-else-if="hasExistingBid(t)" class="mt-2 text-xs text-zaccBlack/60">
                      You have already bid on this tender.
                    </p>
                    <p v-else-if="!isApprovedForTender(t)" class="mt-2 text-xs text-amber-700">
                      Your account is not yet approved for this category.
                    </p>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </section>

      <Dialog
        v-model:visible="detailVisible"
        modal
        :header="detailTender ? detailTender.title : 'Tender details'"
        class="w-[95vw] max-w-4xl"
      >
        <div v-if="detailTender" class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <Tag :value="detailTender.type" severity="info" />
            <Tag :value="detailTender.category?.name" severity="secondary" />
            <span v-if="detailTender.reference" class="text-sm text-zaccBlack/60">Ref: {{ detailTender.reference }}</span>
          </div>
          <div class="prose prose-sm max-w-none text-zaccBlack" v-html="detailTender.details"></div>
          <div class="text-sm text-zaccBlack/80">
            <span class="font-semibold">Closes:</span> {{ formatDate(detailTender.closingDate) }}
            <span class="ml-3" v-if="isTenderOpen(detailTender)">
              <span class="font-semibold">Countdown:</span> {{ formatCountdown(getCountdownMs(detailTender)) }}
            </span>
            <span class="ml-3 text-red-600 font-semibold" v-else>Closed</span>
          </div>
          <div v-if="detailTender.documents?.length" class="space-y-1">
            <a
              v-for="d in detailTender.documents"
              :key="d.id"
              :href="d.fileUrl"
              target="_blank"
              class="block text-sm text-zaccGreen hover:underline"
            >
              {{ d.fileName }}
            </a>
          </div>
          <div v-if="detailTender.type === 'RFQ' && detailTender.lineItems?.length" class="rounded-lg bg-gray-50 p-3">
            <h4 class="font-semibold mb-2 text-zaccBlack">RFQ Line items</h4>
            <ul class="text-sm space-y-1">
              <li v-for="li in detailTender.lineItems" :key="li.id">{{ li.itemNo }}. {{ li.description }} <span v-if="li.quantity">({{ li.quantity }} {{ li.unit || '' }})</span></li>
            </ul>
          </div>
        </div>
      </Dialog>

      <Dialog v-model:visible="signupVisible" modal header="Supplier signup" class="w-[95vw] max-w-2xl">
        <form class="space-y-3" @submit.prevent="signupSupplier">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Email *</label>
              <InputText v-model="signupForm.email" type="email" class="w-full" />
            </div>
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Password *</label>
              <Password v-model="signupForm.password" toggleMask :feedback="false" class="w-full" inputClass="w-full" />
            </div>
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Company name *</label>
              <InputText v-model="signupForm.companyName" class="w-full" />
            </div>
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Contact person</label>
              <InputText v-model="signupForm.contactPerson" class="w-full" />
            </div>
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Phone</label>
              <InputText v-model="signupForm.phone" class="w-full" />
            </div>
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Address</label>
              <InputText v-model="signupForm.address" class="w-full" />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Categories of interest</label>
            <MultiSelect
              v-model="signupForm.categoryIds"
              :options="categories"
              optionLabel="name"
              optionValue="id"
              display="chip"
              filter
              class="w-full"
              placeholder="Select categories"
            />
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <Button label="Cancel" text @click="signupVisible = false" />
            <Button type="submit" label="Create supplier account" :loading="signupLoading" />
          </div>
        </form>
      </Dialog>

      <Dialog v-model:visible="loginVisible" modal header="Supplier login" class="w-[95vw] max-w-md">
        <form class="space-y-3" @submit.prevent="loginSupplier">
          <div>
            <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Email</label>
            <InputText v-model="loginForm.email" type="email" class="w-full" />
          </div>
          <div>
            <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Password</label>
            <Password v-model="loginForm.password" toggleMask :feedback="false" class="w-full" inputClass="w-full" />
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <Button label="Cancel" text @click="loginVisible = false" />
            <Button type="submit" label="Login" :loading="loginLoading" />
          </div>
        </form>
      </Dialog>

      <Dialog
        v-model:visible="bidVisible"
        modal
        :header="activeTender ? `Bid: ${activeTender.title}` : 'Submit bid'"
        class="w-[95vw] max-w-4xl"
      >
        <form class="space-y-3" @submit.prevent="submitBid">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Total amount (optional)</label>
              <InputNumber v-model="bidForm.totalAmount" class="w-full" />
            </div>
            <div>
              <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Bid documents</label>
              <FileUpload mode="basic" customUpload auto chooseLabel="Upload bid document" @uploader="uploadBidDocument" />
            </div>
          </div>
          <div v-if="bidForm.documents.length" class="space-y-1">
            <a v-for="(d, i) in bidForm.documents" :key="i" :href="d.fileUrl" target="_blank" class="mr-3 text-sm text-zaccGreen hover:underline">
              {{ d.fileName }}
            </a>
          </div>
          <div>
            <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Notes</label>
            <Textarea v-model="bidForm.notes" rows="3" class="w-full" />
          </div>

          <div v-if="activeTender?.type === 'RFQ' && bidForm.lineItems.length" class="rounded-lg border border-zaccBlack/10 p-3">
            <h3 class="font-semibold mb-2 text-zaccBlack">RFQ pricing</h3>
            <div class="space-y-2">
              <div v-for="item in bidForm.lineItems" :key="item.tenderItemId" class="grid grid-cols-12 gap-2 items-end">
                <div class="col-span-12 md:col-span-7 text-sm text-zaccBlack">
                  {{ item.itemNo }}. {{ item.description }}
                  <span v-if="item.quantity" class="text-zaccBlack/60">({{ item.quantity }} {{ item.unit || '' }})</span>
                </div>
                <div class="col-span-12 md:col-span-5">
                  <label class="text-xs font-semibold text-zaccBlack/70 block mb-1">Unit price</label>
                  <InputNumber v-model="item.unitPrice" class="w-full" />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <Button label="Cancel" text @click="bidVisible = false" />
            <Button type="submit" label="Submit bid" :loading="bidLoading" />
          </div>
        </form>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const tenders = ref<any[]>([])
const categories = ref<any[]>([])
const selectedCategory = ref('')
const loading = ref(true)
const toast = useToast()

const signupVisible = ref(false)
const loginVisible = ref(false)
const bidVisible = ref(false)
const signupLoading = ref(false)
const loginLoading = ref(false)
const savingProfile = ref(false)
const savingCategories = ref(false)
const bidLoading = ref(false)
const deletingSupplierDocId = ref('')
const nowMs = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null
const detailVisible = ref(false)
const detailTender = ref<any | null>(null)

const supplierToken = ref<string>('')
const supplierProfile = ref<any>(null)
const supplierSection = ref<'overview' | 'profile' | 'categories' | 'documents' | 'tenders' | 'myBids'>('overview')
const activeTender = ref<any>(null)
const supplierCategoryIds = ref<string[]>([])

const signupForm = reactive({
  email: '',
  password: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  address: '',
  categoryIds: [] as string[]
})

const loginForm = reactive({
  email: '',
  password: ''
})

const supplierForm = reactive({
  companyName: '',
  contactPerson: '',
  phone: '',
  address: ''
})

const bidForm = reactive({
  notes: '',
  totalAmount: null as number | null,
  documents: [] as Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>,
  lineItems: [] as Array<{
    tenderItemId: string
    itemNo: number
    description: string
    quantity: number | null
    unit: string
    unitPrice: number | null
  }>
})

const formatDate = (d: string | Date) => new Date(d).toLocaleString()
const formatAmount = (value: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
const formatCountdown = (ms: number) => {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.max(0, s % 60)
  return `${d}d ${h}h ${m}m ${sec}s`
}
const getCountdownMs = (t: any) => {
  const closesAt = t?.closingDate ? new Date(t.closingDate).getTime() : 0
  return closesAt - nowMs.value
}
const isTenderOpen = (t: any) => getCountdownMs(t) > 0
const summarizeDetails = (html: string) => {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
const openTenderDetail = (t: any) => {
  detailTender.value = t
  detailVisible.value = true
}

const authHeaders = () =>
  supplierToken.value
    ? { Authorization: `Bearer ${supplierToken.value}` }
    : undefined

const approvalSeverity = (status: string) => {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'warning'
}

const approvedCategoryIds = computed(() =>
  (supplierProfile.value?.approvals || [])
    .filter((a: any) => a.status === 'APPROVED')
    .map((a: any) => a.categoryId)
)

const supplierStats = computed(() => {
  const approvals = supplierProfile.value?.approvals || []
  const documents = supplierProfile.value?.documents || []
  const bids = supplierProfile.value?.bids || []
  const openTenders = tenders.value.filter((t: any) => isTenderOpen(t))
  const eligibleOpenTenders = openTenders.filter((t: any) => approvedCategoryIds.value.includes(t.categoryId))
  const now = nowMs.value
  const bidsOnOpenTenders = bids.filter((b: any) => {
    const closing = b?.tender?.closingDate ? new Date(b.tender.closingDate).getTime() : 0
    return closing > now
  }).length
  const bidsOnClosedTenders = bids.length - bidsOnOpenTenders

  return {
    totalCategories: approvals.length,
    approvedCategories: approvals.filter((a: any) => a.status === 'APPROVED').length,
    pendingCategories: approvals.filter((a: any) => a.status === 'PENDING').length,
    rejectedCategories: approvals.filter((a: any) => a.status === 'REJECTED').length,
    documents: documents.length,
    openTenders: openTenders.length,
    eligibleOpenTenders: eligibleOpenTenders.length,
    totalBids: bids.length,
    submittedBids: bids.filter((b: any) => b.status === 'SUBMITTED').length,
    bidsOnOpenTenders,
    bidsOnClosedTenders
  }
})

const nextClosingTender = computed(() => {
  const open = tenders.value
    .filter((t: any) => isTenderOpen(t))
    .sort((a: any, b: any) => getCountdownMs(a) - getCountdownMs(b))
  return open[0] || null
})

const isApprovedForTender = (t: any) => approvedCategoryIds.value.includes(t.categoryId)
const hasExistingBid = (t: any) =>
  Boolean((supplierProfile.value?.bids || []).some((b: any) => b.tenderId === t.id))
const getBidButtonLabel = (t: any) => {
  if (!hasExistingBid(t)) return 'Submit Bid'
  if (isTenderOpen(t)) return 'Edit Bid'
  return 'You have already bid'
}
const canBidForTender = (t: any) =>
  Boolean(supplierProfile.value && isTenderOpen(t) && isApprovedForTender(t))

const loadSupplierProfile = async () => {
  if (!supplierToken.value) return
  try {
    const profile: any = await $fetch('/api/public/suppliers/profile', {
      headers: authHeaders()
    })
    supplierProfile.value = profile
    supplierForm.companyName = profile.companyName || ''
    supplierForm.contactPerson = profile.contactPerson || ''
    supplierForm.phone = profile.phone || ''
    supplierForm.address = profile.address || ''
    supplierCategoryIds.value = (profile.approvals || []).map((a: any) => a.categoryId)
  } catch {
    supplierToken.value = ''
    supplierProfile.value = null
    if (process.client) localStorage.removeItem('supplierToken')
  }
}

const signupSupplier = async () => {
  signupLoading.value = true
  try {
    await $fetch('/api/public/suppliers/register', {
      method: 'POST',
      body: {
        email: signupForm.email.trim(),
        password: signupForm.password,
        companyName: signupForm.companyName.trim(),
        contactPerson: signupForm.contactPerson.trim() || null,
        phone: signupForm.phone.trim() || null,
        address: signupForm.address.trim() || null,
        categoryIds: signupForm.categoryIds
      }
    })
    signupVisible.value = false
    toast.add({ severity: 'success', summary: 'Account created', detail: 'Please login as supplier', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Signup failed', detail: e?.data?.statusMessage || 'Could not create supplier account', life: 4000 })
  } finally {
    signupLoading.value = false
  }
}

const loginSupplier = async () => {
  loginLoading.value = true
  try {
    const res: any = await $fetch('/api/public/suppliers/login', {
      method: 'POST',
      body: {
        email: loginForm.email.trim(),
        password: loginForm.password
      }
    })
    supplierToken.value = res.token
    if (process.client) localStorage.setItem('supplierToken', res.token)
    loginVisible.value = false
    await loadSupplierProfile()
    toast.add({ severity: 'success', summary: 'Welcome', detail: 'Supplier login successful', life: 2500 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Login failed', detail: e?.data?.statusMessage || 'Invalid credentials', life: 3500 })
  } finally {
    loginLoading.value = false
  }
}

const logoutSupplier = async () => {
  try {
    await $fetch('/api/public/suppliers/logout', { method: 'POST', headers: authHeaders() })
  } catch {
    // Intentionally ignore: local session cleanup still needed.
  } finally {
    supplierToken.value = ''
    supplierProfile.value = null
    if (process.client) localStorage.removeItem('supplierToken')
    toast.add({ severity: 'info', summary: 'Logged out', detail: 'Supplier session ended', life: 2000 })
  }
}

const saveSupplierProfile = async () => {
  if (!supplierToken.value) return
  savingProfile.value = true
  try {
    await $fetch('/api/public/suppliers/profile', {
      method: 'PUT',
      headers: authHeaders(),
      body: {
        companyName: supplierForm.companyName.trim(),
        contactPerson: supplierForm.contactPerson.trim() || null,
        phone: supplierForm.phone.trim() || null,
        address: supplierForm.address.trim() || null
      }
    })
    await loadSupplierProfile()
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated', life: 2200 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Save failed', detail: e?.data?.statusMessage || 'Could not update profile', life: 3500 })
  } finally {
    savingProfile.value = false
  }
}

const saveSupplierCategories = async () => {
  if (!supplierToken.value) return
  savingCategories.value = true
  try {
    await $fetch('/api/public/suppliers/categories', {
      method: 'PUT',
      headers: authHeaders(),
      body: {
        categoryIds: supplierCategoryIds.value
      }
    })
    await loadSupplierProfile()
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Categories updated', life: 2200 })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: e?.data?.statusMessage || 'Could not update categories',
      life: 3500
    })
  } finally {
    savingCategories.value = false
  }
}

const uploadFile = async (event: any) => {
  const file = event.files?.[0]
  if (!file) return null
  const fd = new FormData()
  fd.append('file', file)
  const res: any = await $fetch('/api/upload/document', {
    method: 'POST',
    headers: authHeaders(),
    body: fd
  })
  return {
    fileName: file.name,
    fileUrl: res.path,
    fileType: res.fileType || file.type || 'file',
    fileSize: file.size
  }
}

const uploadSupplierDocument = async (event: any) => {
  if (!supplierToken.value) return
  try {
    const doc = await uploadFile(event)
    if (!doc) return
    await $fetch('/api/public/suppliers/documents', {
      method: 'POST',
      headers: authHeaders(),
      body: doc
    })
    await loadSupplierProfile()
    toast.add({ severity: 'success', summary: 'Uploaded', detail: 'Supplier document added', life: 2200 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Upload failed', detail: e?.data?.statusMessage || 'Could not upload document', life: 3500 })
  }
}

const removeSupplierDocument = async (docId: string) => {
  if (!supplierToken.value) return
  deletingSupplierDocId.value = docId
  try {
    await $fetch(`/api/public/suppliers/documents/${docId}`, {
      method: 'DELETE',
      headers: authHeaders()
    })
    await loadSupplierProfile()
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Document removed', life: 2200 })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Delete failed',
      detail: e?.data?.statusMessage || 'Could not delete document',
      life: 3500
    })
  } finally {
    deletingSupplierDocId.value = ''
  }
}

const openBidDialog = (tender: any) => {
  activeTender.value = tender
  const existingBid = (supplierProfile.value?.bids || []).find((b: any) => b.tenderId === tender.id)
  bidForm.notes = ''
  bidForm.totalAmount = null
  bidForm.documents = []
  bidForm.lineItems = (tender.lineItems || []).map((li: any) => ({
    tenderItemId: li.id,
    itemNo: li.itemNo,
    description: li.description,
    quantity: li.quantity ?? null,
    unit: li.unit || '',
    unitPrice: null
  }))
  if (existingBid) {
    bidForm.notes = existingBid.notes || ''
    bidForm.totalAmount = existingBid.totalAmount ?? null
    bidForm.documents = (existingBid.documents || []).map((d: any) => ({
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      fileSize: d.fileSize
    }))
    const priceMap = new Map((existingBid.lineItems || []).map((li: any) => [li.tenderItemId, li]))
    bidForm.lineItems = bidForm.lineItems.map((li: any) => {
      const old = priceMap.get(li.tenderItemId)
      return old ? { ...li, unitPrice: old.unitPrice ?? null } : li
    })
  }
  bidVisible.value = true
}

const openTenderDetailById = (tenderId: string) => {
  const tender = tenders.value.find((t: any) => t.id === tenderId)
  if (tender) openTenderDetail(tender)
}

const openBidDialogByBid = (bid: any) => {
  const tender = tenders.value.find((t: any) => t.id === bid.tenderId)
  if (tender) openBidDialog(tender)
}

const uploadBidDocument = async (event: any) => {
  try {
    const doc = await uploadFile(event)
    if (!doc) return
    bidForm.documents.push(doc)
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Upload failed', detail: e?.data?.statusMessage || 'Could not upload bid document', life: 3500 })
  }
}

const submitBid = async () => {
  if (!activeTender.value || !supplierToken.value) return
  bidLoading.value = true
  try {
    const lineItemsPayload = bidForm.lineItems
      .filter((li) => li.unitPrice != null)
      .map((li) => ({
        tenderItemId: li.tenderItemId,
        unitPrice: Number(li.unitPrice),
        quantity: li.quantity,
        totalPrice: li.quantity != null ? Number(li.unitPrice) * Number(li.quantity) : null
      }))
    await $fetch(`/api/tenders/${activeTender.value.id}/bids`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        notes: bidForm.notes.trim() || null,
        totalAmount: bidForm.totalAmount,
        documents: bidForm.documents,
        lineItems: lineItemsPayload
      }
    })
    bidVisible.value = false
    await loadSupplierProfile()
    toast.add({ severity: 'success', summary: 'Bid submitted', detail: 'Your bid was saved successfully', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Bid failed', detail: e?.data?.statusMessage || 'Could not submit bid', life: 4000 })
  } finally {
    bidLoading.value = false
  }
}

const fetchTenders = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    tenders.value = await $fetch('/api/public/tenders', { params })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)

  if (process.client) {
    supplierToken.value = localStorage.getItem('supplierToken') || ''
  }
  await loadSupplierProfile()
  categories.value = await $fetch('/api/public/tenders/categories')
  await fetchTenders()
})

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = null
})

useHead({ title: 'Tenders - ZACC', meta: [{ name: 'description', content: 'ZACC procurement tenders and RFQs.' }] })
</script>

<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Tender Bids</h1>
          <p class="mt-2 text-gray-600">
            {{ tenderTitle ? `Viewing bids for: ${tenderTitle}` : 'Viewing submitted bids' }}
          </p>
        </div>
        <Button label="Back to tenders" icon="pi pi-arrow-left" outlined @click="navigateTo('/admin/tenders')" />
      </div>

      <Card v-if="tenderInfo" class="mb-6 border-0 shadow-md">
        <template #content>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <Tag :value="tenderInfo.type" severity="info" />
              <Tag v-if="tenderInfo.category?.name" :value="tenderInfo.category.name" severity="secondary" />
              <span v-if="tenderInfo.reference" class="text-sm text-zaccBlack/60">Ref: {{ tenderInfo.reference }}</span>
            </div>
            <div class="text-sm text-zaccBlack/80">
              <span class="font-semibold">Closing date:</span> {{ formatDate(tenderInfo.closingDate) }}
            </div>
            <div class="prose prose-sm max-w-none text-zaccBlack" v-html="tenderInfo.details"></div>
            <div v-if="tenderInfo.documents?.length" class="flex flex-wrap gap-2">
              <a
                v-for="doc in tenderInfo.documents"
                :key="doc.id"
                :href="doc.fileUrl"
                target="_blank"
                class="text-sm text-zaccGreen hover:underline"
              >
                {{ doc.fileName }}
              </a>
            </div>
          </div>
        </template>
      </Card>

      <Card class="border-0 shadow-md">
        <template #content>
          <div v-if="loading" class="py-10 text-center text-zaccBlack/60">Loading bids...</div>
          <div v-else-if="errorMessage" class="py-10 text-center text-zaccBlack/70">{{ errorMessage }}</div>
          <div v-else-if="bids.length === 0" class="py-10 text-center text-zaccBlack/60">No bids submitted yet.</div>
          <div v-else class="space-y-3">
            <div v-for="bid in bids" :key="bid.id" class="rounded-lg border border-zaccBlack/10 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div class="font-semibold text-zaccBlack">{{ bid.supplier?.companyName || 'Supplier' }}</div>
                  <div class="text-xs text-zaccBlack/60">
                    {{ bid.supplier?.email }}<span v-if="bid.supplier?.contactPerson"> - {{ bid.supplier?.contactPerson }}</span>
                  </div>
                </div>
                <div class="text-sm text-zaccBlack/70">
                  Submitted: {{ formatDate(bid.createdAt) }}
                </div>
              </div>
              <p v-if="bid.notes" class="mt-2 text-sm text-zaccBlack/80">{{ bid.notes }}</p>
              <div class="mt-2 text-sm text-zaccBlack/70">
                Total amount: {{ bid.totalAmount ?? '-' }} | Documents: {{ bid.documents?.length || 0 }}
              </div>
              <div class="mt-3">
                <Button label="View detail" icon="pi pi-eye" text @click="openBidDetail(bid)" />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Dialog
        v-model:visible="detailDialogVisible"
        modal
        :header="selectedBid ? `Bid Detail - ${selectedBid.supplier?.companyName || 'Supplier'}` : 'Bid Detail'"
        class="w-[95vw] max-w-4xl"
      >
        <div v-if="selectedBid" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span class="font-semibold text-zaccBlack">Supplier:</span>
              <span class="text-zaccBlack/80 ml-1">{{ selectedBid.supplier?.companyName || '-' }}</span>
            </div>
            <div>
              <span class="font-semibold text-zaccBlack">Email:</span>
              <span class="text-zaccBlack/80 ml-1">{{ selectedBid.supplier?.email || '-' }}</span>
            </div>
            <div>
              <span class="font-semibold text-zaccBlack">Contact:</span>
              <span class="text-zaccBlack/80 ml-1">{{ selectedBid.supplier?.contactPerson || '-' }}</span>
            </div>
            <div>
              <span class="font-semibold text-zaccBlack">Submitted:</span>
              <span class="text-zaccBlack/80 ml-1">{{ formatDate(selectedBid.createdAt) }}</span>
            </div>
            <div>
              <span class="font-semibold text-zaccBlack">Total amount:</span>
              <span class="text-zaccBlack/80 ml-1">{{ selectedBid.totalAmount ?? '-' }}</span>
            </div>
            <div>
              <span class="font-semibold text-zaccBlack">Status:</span>
              <span class="text-zaccBlack/80 ml-1">{{ selectedBid.status || '-' }}</span>
            </div>
          </div>

          <div v-if="selectedBid.notes" class="rounded border border-zaccBlack/10 p-3">
            <div class="text-sm font-semibold text-zaccBlack mb-1">Notes</div>
            <p class="text-sm text-zaccBlack/80 whitespace-pre-wrap">{{ selectedBid.notes }}</p>
          </div>

          <div v-if="selectedBid.documents?.length" class="rounded border border-zaccBlack/10 p-3">
            <div class="text-sm font-semibold text-zaccBlack mb-2">Bid documents</div>
            <div class="space-y-1">
              <a
                v-for="doc in selectedBid.documents"
                :key="doc.id"
                :href="doc.fileUrl"
                target="_blank"
                class="block text-sm text-zaccGreen hover:underline"
              >
                {{ doc.fileName }}
              </a>
            </div>
          </div>

          <div v-if="selectedBid.lineItems?.length" class="rounded border border-zaccBlack/10 p-3">
            <div class="text-sm font-semibold text-zaccBlack mb-2">RFQ line-item prices</div>
            <div class="space-y-2">
              <div
                v-for="li in selectedBid.lineItems"
                :key="li.id"
                class="flex flex-wrap items-center justify-between rounded bg-zaccBlack/[0.03] px-3 py-2 text-sm"
              >
                <div class="text-zaccBlack/80">
                  <span class="font-semibold">
                    {{ li.tenderItem?.itemNo != null ? `${li.tenderItem.itemNo}.` : '-' }}
                  </span>
                  {{ li.tenderItem?.description || `Tender item: ${li.tenderItemId}` }}
                  <span v-if="li.tenderItem?.quantity" class="text-zaccBlack/60">
                    ({{ li.tenderItem.quantity }} {{ li.tenderItem.unit || '' }})
                  </span>
                </div>
                <span class="font-semibold text-zaccBlack">Unit: {{ li.unitPrice }} | Total: {{ li.totalPrice ?? '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useHead({ title: 'Tender Bids - ZACC CMS' })

const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
const bids = ref<any[]>([])
const tenderTitle = ref('')
const tenderInfo = ref<any | null>(null)
const detailDialogVisible = ref(false)
const selectedBid = ref<any | null>(null)

const formatDate = (d: string | Date) => new Date(d).toLocaleString()
const openBidDetail = (bid: any) => {
  selectedBid.value = bid
  detailDialogVisible.value = true
}

const loadBids = async () => {
  const raw = String(route.params.id || '')
  const tenderId = raw.replace(/^bids-/, '')
  if (!tenderId) {
    errorMessage.value = 'Tender ID is missing'
    return
  }

  loading.value = true
  errorMessage.value = ''
  bids.value = []
  tenderInfo.value = null
  try {
    const res: any = await $fetch(`/api/tenders/${tenderId}/bids`)
    bids.value = res?.bids || []
    tenderInfo.value = res?.tender || null
    tenderTitle.value = res?.tender?.title || ''
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || 'Could not load bids'
  } finally {
    loading.value = false
  }
}

onMounted(loadBids)
</script>

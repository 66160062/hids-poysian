import { computed, ref } from 'vue';
import { LocalStorage } from 'quasar';

export type LinkAccessRole = 'customer' | 'contractor';

export interface LinkAccessPayload {
  project_id: number;
  role: LinkAccessRole;
  exp?: number;
}

const STORAGE_KEY = 'linkAccess';

const linkAccess = ref<LinkAccessPayload | null>(null);
const linkToken = ref<string | null>(null);

function loadFromStorage() {
  linkAccess.value = LocalStorage.getItem<LinkAccessPayload>(STORAGE_KEY) ?? null;
  linkToken.value = LocalStorage.getItem<string>('linkToken') ?? null;
}

loadFromStorage();

export function useLinkAccess() {
  const isCustomerViewOnly = computed(
    () => linkAccess.value?.role === 'customer',
  );

  const isContractorEditable = computed(
    () => linkAccess.value?.role === 'contractor',
  );

  const hasLinkAccess = computed(() => {
    if (!linkAccess.value) return false;
    if (linkAccess.value.exp && linkAccess.value.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  });

  const projectId = computed(() => linkAccess.value?.project_id ?? null);

  function setAccess(payload: LinkAccessPayload, token: string) {
    linkAccess.value = payload;
    linkToken.value = token;
    LocalStorage.set(STORAGE_KEY, payload);
    LocalStorage.set('linkToken', token);
  }

  function clearAccess() {
    linkAccess.value = null;
    linkToken.value = null;
    LocalStorage.remove(STORAGE_KEY);
    LocalStorage.remove('linkToken');
  }

  return {
    linkAccess,
    linkToken,
    projectId,
    hasLinkAccess,
    isCustomerViewOnly,
    isContractorEditable,
    setAccess,
    clearAccess,
  };
}

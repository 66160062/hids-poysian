export default {
  dialog: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    ok: 'OK',
  },
  linkEntry: {
    verifying: 'Verifying link...',
    invalidTitle: 'Invalid or expired link',
    incompleteLink: 'Incomplete link. Please request a new link from the administrator.',
    expiredOrInvalid: 'Link expired or invalid. Please request a new link from the administrator.',
  },
  // keyed by status code (backend DashboardStatusCode / useJobStatus)
  jobStatus: {
    IN_PROGRESS: 'In Progress',
    PENDING_APPROVAL: 'Pending Approval',
    COMPLETED: 'Completed',
    COMPLETED_ROUND: 'Completed {round}',
    CANCELLED: 'Cancelled',
    DRAFT: 'Draft',
    LOCKED: 'Locked',
  },
  branch: {
    label: 'Branch',
    labelWithColon: 'Branch:',
    all: 'All Branches',
    fallbackName: 'Branch #{id}',
    loadError: 'Failed to load branches',
  },
  address: {
    houseNumber: 'No. {value}',
    floor: 'Floor {value}',
    soi: 'Soi {value}',
    subDistrict: '{value}',
    district: '{value}',
    province: '{value}',
  },
  photo: {
    before: 'BEFORE',
    after: 'AFTER',
  },
  unspecified: {
    generic: 'Not specified',
    floor: 'Floor not specified',
    room: 'Room not specified',
    roomType: 'Type not specified',
  },
};

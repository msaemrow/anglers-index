// API status values are backend contracts; change display labels independently.
export const APP_NAME = 'Anglers Index'

export const STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
})

export const LABELS = Object.freeze({
  CANCEL: 'Cancel',
  SAVE: 'Save',
  SAVE_CHANGES: 'Save changes',
  SAVING: 'Saving…',
  SAVE_CATCH: 'Save catch',
  SAVE_TRIP: 'Save trip',
  SAVE_LURE: 'Save lure',
  SAVE_SPECIES: 'Save species',
  START_TRIP_SAVE_CATCH: 'Start trip & save catch',
  ADD_LAKE: 'Add lake',
  ADD_LURE: 'Add lure',
  ADD_SPECIES: 'Add species',
  ADD_TRIP: 'Add trip',
  ADD_EXISTING_CATCH: 'Add existing catch',
  DELETE_TRIP: 'Delete trip',
  DELETING: 'Deleting…',
  RETRY: 'Retry',
  RETRY_MAP: 'Retry map',
  RETRY_TRIPS: 'Retry trips',
  TRY_AGAIN: 'Try again',
  REFRESH: 'Refresh',
  CLOSE: 'Close',
  CLOSE_DIALOG: 'Close dialog',
  SIGN_IN: 'Sign in',
  SIGNING_IN: 'Signing in…',
  SIGN_OUT: 'Log out',
  PREVIOUS: 'Previous',
  NEXT: 'Next',
  APPROVE: 'Approve',
  DENY: 'Deny',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  COMPLETED: 'Completed',
  ACTIVE_TRIP: 'Active trip',
  COMPLETED_TRIP: 'Completed trip',
  LOG_CATCH: 'Log a catch',
  LOG_FIRST_CATCH: 'Log your first catch',
  ADD_FISH_CATCH: 'Add fish catch',
})

export const MESSAGES = Object.freeze({
  INVALID_REQUEST: 'Invalid request. Please check your input.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  NO_PERMISSION: 'You don’t have permission to perform this action.',
  PAGE_FORBIDDEN: 'You do not have permission to view this page.',
  NO_DATA: 'No data found.',
  CONFLICT: 'This request conflicts with the current data. Please refresh and try again.',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
  REQUEST_FAILED: 'Error processing request. Please try again.',
  CONNECTION_FAILED: 'Unable to connect to the server. Please try again.',
  UNEXPECTED_RESPONSE: 'The API returned an unexpected response.',
  INVALID_SESSION: 'The API returned an invalid session. Please sign in again.',
})

export const HTTP_ERROR_MESSAGES = Object.freeze({
  400: MESSAGES.INVALID_REQUEST,
  401: MESSAGES.SESSION_EXPIRED,
  403: MESSAGES.NO_PERMISSION,
  404: MESSAGES.NO_DATA,
  409: MESSAGES.CONFLICT,
  422: MESSAGES.INVALID_REQUEST,
  429: MESSAGES.TOO_MANY_REQUESTS,
})

export const US_STATES = Object.freeze(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'
    .split(' ')
    .sort(),
)
export const DEFAULT_STATE = 'MN'

// Component event contracts. UPDATE_MODEL_VALUE is Vue's fixed v-model protocol.
export const EVENTS = Object.freeze({
  ADD_CATCH: 'add-catch',
  BUSY: 'busy',
  CLICK: 'click',
  CLOSE: 'close',
  DELETED: 'deleted',
  READY: 'ready',
  REFRESH: 'refresh',
  REVIEWED: 'reviewed',
  SAVED: 'saved',
  SELECT: 'select',
  SELECTED: 'selected',
  SIGN_OUT: 'sign-out',
  SUBMIT: 'submit',
  TOGGLE: 'toggle',
  UPDATE_MODEL_VALUE: 'update:modelValue',
})

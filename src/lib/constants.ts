export const ROLES = ['scanning_supervisor', 'batch_supervisor', 'dispatch_supervisor', 'hod', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  scanning_supervisor: 'Scanning Supervisor',
  batch_supervisor: 'Batch Supervisor',
  dispatch_supervisor: 'Attendance Supervisor',
  hod: 'Department HOD',
  admin: 'System Admin',
};

export const ROLE_HOME: Record<Role, string> = {
  scanning_supervisor: '/scanning',
  batch_supervisor: '/batch',
  dispatch_supervisor: '/attendance',
  hod: '/hod',
  admin: '/admin',
};

export const MODULES = ['scanning', 'batch'] as const;
export type ProdModule = (typeof MODULES)[number];

export const MODULE_LABELS: Record<ProdModule, string> = { scanning: 'Scanning', batch: 'Batch' };

/** Role that owns data entry for each production module (admin can always write). */
export const MODULE_ROLE: Record<ProdModule, Role> = {
  scanning: 'scanning_supervisor',
  batch: 'batch_supervisor',
};

export type Slot = { id: string; time: string; start: number; end: number; lunch?: boolean };

/** Shift schedule. start/end are minutes since midnight. */
export const SLOTS: Slot[] = [
  { id: 'slot_1', time: '8:30 AM – 9:30 AM', start: 510, end: 570 },
  { id: 'slot_2', time: '9:30 AM – 10:30 AM', start: 570, end: 630 },
  { id: 'slot_3', time: '10:30 AM – 11:30 AM', start: 630, end: 690 },
  { id: 'slot_4', time: '11:30 AM – 12:30 PM', start: 690, end: 750 },
  { id: 'slot_lunch', time: '12:30 PM – 1:00 PM', start: 750, end: 780, lunch: true },
  { id: 'slot_5', time: '1:00 PM – 2:00 PM', start: 780, end: 840 },
  { id: 'slot_6', time: '2:00 PM – 3:00 PM', start: 840, end: 900 },
  { id: 'slot_7', time: '3:00 PM – 4:00 PM', start: 900, end: 960 },
  { id: 'slot_8', time: '4:00 PM – 5:00 PM', start: 960, end: 1020 },
];

export const WORK_SLOT_IDS = SLOTS.filter((s) => !s.lunch).map((s) => s.id);
export const WORK_HOURS = WORK_SLOT_IDS.length;

/** Plant time zone: "today" and shift hours are always evaluated here. */
export const TIME_ZONE = 'Asia/Kolkata';

export const UNIT_PRICE = 150;
export const DAILY_OUTPUT_TARGET = 8000;
export const WEEKLY_OUTPUT_TARGET = DAILY_OUTPUT_TARGET * 6;
export const MONTHLY_OUTPUT_TARGET = DAILY_OUTPUT_TARGET * 26;

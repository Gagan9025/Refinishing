import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { MODULES, ROLES } from '@/lib/constants';

export const roleEnum = pgEnum('role', ROLES);
export const userStatusEnum = pgEnum('user_status', ['active', 'disabled']);
export const moduleEnum = pgEnum('production_module', MODULES);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable('users', {
  username: text('username').primaryKey(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull(),
  status: userStatusEnum('status').notNull().default('active'),
  passwordHash: text('password_hash').notNull(),
  createdBy: text('created_by'),
  ...timestamps,
});

/** One row per module per day. Totals are derived from hourly_entries, never stored. */
export const productionDays = pgTable(
  'production_days',
  {
    id: serial('id').primaryKey(),
    module: moduleEnum('module').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    dailyTarget: integer('daily_target').notNull(),
    supervisor: text('supervisor').notNull().references(() => users.username),
    ...timestamps,
  },
  (t) => [unique().on(t.module, t.date), index().on(t.date), check('daily_target_positive', sql`${t.dailyTarget} > 0`)],
);

export const hourlyEntries = pgTable(
  'hourly_entries',
  {
    dayId: integer('day_id').notNull().references(() => productionDays.id, { onDelete: 'cascade' }),
    slotId: text('slot_id').notNull(),
    achieved: integer('achieved').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.dayId, t.slotId] }), check('achieved_non_negative', sql`${t.achieved} >= 0`)],
);

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A missing row means "unmarked" for that employee on that date. */
export const attendance = pgTable(
  'attendance',
  {
    date: date('date', { mode: 'string' }).notNull(),
    employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    markedBy: text('marked_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.date, t.employeeId] })],
);

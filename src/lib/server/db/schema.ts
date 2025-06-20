import { pgTable, serial, integer, varchar, text, boolean } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	age: integer('age')
});

export const apiKeys = pgTable('api_keys', {
    id: serial('id').primaryKey(),
    publicKey: varchar('public_key', { length: 64 }).notNull().unique(),
    privateKey: varchar('private_key', { length: 64 }).notNull()
});

export const coupons = pgTable('coupons', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 32 }).notNull().unique(),
    maxUses: integer('max_uses').notNull(),
    usesLeft: integer('uses_left').notNull(),
    description: text('description'),
    createdBy: integer('created_by').notNull().references(() => apiKeys.id),
    public: boolean('public').notNull().default(true)
});

CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_key" varchar(64) NOT NULL,
	"private_key" varchar(64) NOT NULL,
	CONSTRAINT "api_keys_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"max_uses" integer NOT NULL,
	"uses_left" integer NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"public" boolean DEFAULT true NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"age" integer
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_api_keys_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;
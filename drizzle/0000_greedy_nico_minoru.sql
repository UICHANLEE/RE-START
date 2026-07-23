CREATE TABLE `survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`survey_version` text NOT NULL,
	`cohort` text NOT NULL,
	`age_band` text NOT NULL,
	`gender` text NOT NULL,
	`answers_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `survey_responses_cohort_created_idx` ON `survey_responses` (`cohort`,`created_at`);
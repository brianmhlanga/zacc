-- Per-vacancy rehearsal switch.
--
-- A test vacancy is live on production and passes every publish check, but the
-- public careers routes match it only for a viewer holding a valid CMS session.
-- That lets Human Capital run a post end to end — configure, publish, apply,
-- score, stage, receive the emails — before a real candidate can see it.
--
-- Deliberately NOT tied to the `jobs` permission: this reveals an advert, not
-- personal data, and gating it behind a grant would stop the people who most
-- need to rehearse from doing so.
--
-- Existing rows backfill to `false`, which is correct for every vacancy created
-- before this migration, so there is no data step.
--
-- No index change. `jobs_isPublished_isActive_closingDate_idx` stays as it is:
-- this table holds tens of rows, and widening it would push `closingDate` off
-- the usable prefix for the staff-viewer query (which carries no `isTestMode`
-- equality) to buy nothing on a table MySQL scans anyway.

-- AlterTable
ALTER TABLE `jobs` ADD COLUMN `isTestMode` BOOLEAN NOT NULL DEFAULT false;

-- Snapshot of the vacancy's test flag at the moment of submission.
--
-- Mirrors `job_applications.mode`, and for the same reason: an application is an
-- evidence record. Joining live to `jobs.isTestMode` would let one click on the
-- switch retroactively relabel history in both directions — real applications
-- suddenly marked "test", or rehearsal submissions silently promoted to real the
-- moment a vacancy goes live.
--
-- Nothing filters on this column; test applications count in every statistic by
-- design. It exists because it cannot be added retrospectively — by the time it
-- is wanted, the live flag has already moved and the information is gone.

-- AlterTable
ALTER TABLE `job_applications` ADD COLUMN `wasTestModeAtSubmit` BOOLEAN NOT NULL DEFAULT false;

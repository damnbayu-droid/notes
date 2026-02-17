-- Add supporting columns for new features
alter table notes add column if not exists reminder_date timestamptz;
alter table notes add column if not exists folder text default 'Main';

-- Create an index for folder queries if needed (optional but good for performance)
create index if not exists notes_folder_idx on notes (folder);

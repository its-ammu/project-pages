-- Add archived column to projects (default false for backward compatibility)
alter table public.projects add column if not exists archived boolean default false;

-- Index for filtering archived projects
create index if not exists idx_projects_archived on public.projects(archived) where archived = true;

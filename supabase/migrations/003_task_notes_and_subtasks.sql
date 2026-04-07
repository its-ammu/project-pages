-- Optional notes on tasks (existing rows get NULL)
alter table public.tasks add column if not exists notes text;

-- Checklist items per task
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  title text not null,
  completed boolean default false not null,
  position integer default 0 not null,
  created_at timestamptz default now()
);

create index if not exists idx_subtasks_task_id on public.subtasks(task_id);

alter table public.subtasks enable row level security;

create policy "Users can manage subtasks via tasks"
  on public.subtasks for all
  using (
    exists (
      select 1 from public.tasks
      inner join public.projects on projects.id = tasks.project_id
      where tasks.id = subtasks.task_id
      and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      inner join public.projects on projects.id = tasks.project_id
      where tasks.id = subtasks.task_id
      and projects.user_id = auth.uid()
    )
  );

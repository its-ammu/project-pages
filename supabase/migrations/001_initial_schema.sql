-- Projects table (notebook pages)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Project',
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  color text,
  completed boolean default false,
  created_at timestamptz default now(),
  position integer default 0,
  due_date date
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own tasks via projects"
  on public.tasks for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);

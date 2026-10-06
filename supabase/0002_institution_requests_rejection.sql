-- Run this in Supabase SQL Editor to enable rejection reasons on institution requests
alter table public.institution_requests
  add column if not exists rejection_reason text;

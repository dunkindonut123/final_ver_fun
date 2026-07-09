-- Restrict seed_student_assignments to service_role only.
-- Previously granted to authenticated, which let any logged-in user seed
-- assignments for an arbitrary student_id (SECURITY DEFINER, no ownership check).
-- App call sites already use the service-role admin client.

revoke all on function public.seed_student_assignments(uuid, int) from public;
revoke all on function public.seed_student_assignments(uuid, int) from anon;
revoke all on function public.seed_student_assignments(uuid, int) from authenticated;

grant execute on function public.seed_student_assignments(uuid, int) to service_role;

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityEntityType } from '@/types'

export async function logActivity(
  supabase: SupabaseClient,
  action: string,
  entityType: ActivityEntityType,
  entityId: string,
  entityName: string
) {
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('activity_log').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    user_id: user?.id ?? null,
  })
}

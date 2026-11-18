import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
import type { GenerateScheduleResult } from '@/types';

/** Thrown when schedule generation fails. `code` is an Edge Function error code, or "network". */
export class ScheduleRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

/**
 * Asks the generate-schedule Edge Function to build and save the crop's schedule. The crop
 * needs a template and planting date first. Calling it again returns the saved schedule.
 */
export async function generateSchedule(farmCropId: string): Promise<GenerateScheduleResult> {
  const { data, error } = await supabase.functions.invoke('generate-schedule', {
    body: { farm_crop_id: farmCropId },
  });
  if (error) {
    let code = 'network';
    if (error instanceof FunctionsHttpError) {
      code = await error.context
        .json()
        .then((body: { error?: string }) => body.error ?? 'unknown')
        .catch(() => 'unknown');
    }
    throw new ScheduleRequestError(code);
  }
  return data as GenerateScheduleResult;
}

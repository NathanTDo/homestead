export type CropStatus = 'planned' | 'active' | 'archived';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type FarmMemberRole = 'owner' | 'member';
export type ActivityType = 'watering' | 'fertilizing' | 'pruning' | 'pest_inspection' | 'other';
export type TaskType =
  | 'planting'
  | 'germination'
  | 'transplanting'
  | 'maturity'
  | 'harvest_start'
  | 'harvest_end'
  | ActivityType;

export interface OnboardingData {
  farming_location?: string;
  farming_type?: string;
  preferred_seasons?: Season[];
  interested_produce?: string[];
  experience_level?: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  onboarding_data: OnboardingData | null;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string | null;
  farming_method: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FarmMember {
  id: string;
  farm_id: string;
  user_id: string;
  role: FarmMemberRole;
  created_at: string;
}

export interface Plant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface GrowingTemplate {
  id: string;
  plant_id: string;
  version: number;
  season: Season;
  germination_days: number | null;
  maturity_days: number | null;
  harvest_start_days: number | null;
  harvest_end_days: number | null;
  source_reference: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CareRule {
  id: string;
  template_id: string;
  activity_type: ActivityType;
  description: string | null;
  start_day: number;
  interval_days: number | null;
  end_day: number;
  created_at: string;
}

export interface FarmCrop {
  id: string;
  farm_id: string;
  plant_id: string;
  template_id: string | null;
  planting_date: string | null;
  selected_template_version: number | null;
  status: CropStatus;
  created_at: string;
  updated_at: string;
}

export interface GrowingTask {
  id: string;
  farm_crop_id: string;
  task_type: TaskType;
  title: string;
  description: string | null;
  scheduled_date: string;
  completed_at: string | null;
  generation_key: string;
  created_at: string;
  updated_at: string;
}

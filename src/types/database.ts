export type UserRole = "admin" | "student";

export type LabStatus =
  | "not_started"
  | "in_progress"
  | "review_pending"
  | "accepted"
  | "revision_needed";

export type EventType =
  | "deadline"
  | "test"
  | "colloquium"
  | "exam"
  | "consultation"
  | "other";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
}

export interface Invite {
  id: string;
  code: string;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
}

export interface Semester {
  id: string;
  name: string;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  semester_id: string;
  title: string;
  teacher_name?: string | null;
  teacher_contact?: string | null;
  moodle_url?: string | null;
  chat_url?: string | null;
  description?: string | null;
  color_hex?: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description?: string | null;
  tags: string[];
  deadline?: string | null;
  material_file_url?: string | null;
  material_filename?: string | null;
  created_by?: string | null;
  created_at: string;
  subject?: Subject;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  status: LabStatus;
  file_url?: string | null;
  filename?: string | null;
  external_link?: string | null;
  notes?: string | null;
  updated_at: string;
  profile?: Profile;
}

export interface CalendarEvent {
  id: string;
  semester_id: string;
  assignment_id?: string | null;
  title: string;
  event_type: EventType;
  start_time: string;
  end_time?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  assignment?: Assignment;
}

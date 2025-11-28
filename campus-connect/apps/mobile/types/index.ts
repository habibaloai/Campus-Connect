// =============================================
// DATABASE TYPES
// =============================================

export interface Profile {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  interests?: string[];
  favorite_lecture?: string;
  availability_status?: 'free' | 'studying' | 'busy' | 'available' | 'away';
  show_study_stats?: boolean;
  study_hours?: number;
  favorite_study_spots?: string[];
  student_id?: string;
  major?: string;
  minor?: string;
  year?: string;
  enrollment_date?: string;
  expected_graduation?: string;
  gpa?: number;
  total_credits?: number;
  advisor?: string;
  phone?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  professor: string;
  professor_rating: number;
  credits: number;
  description?: string;
  prerequisites?: string[];
  difficulty: number;
  capacity: number;
  semester: string;
  category: string;
  schedules?: CourseSchedule[];
  enrolled_count?: number;
}

export interface CourseSchedule {
  id: string;
  course_id: string;
  day: string;
  time: string;
  location: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  grade?: string;
  grade_points?: number;
  course?: Course;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  due_time: string;
  max_grade: number;
  weight: number;
  type: string;
  estimated_time?: number;
  course?: Course;
  submission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  status: string;
  grade?: number;
  submitted_at?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  category: string;
  max_attendees: number;
  organizer?: string;
  image_url?: string;
  attendee_count?: number;
  is_attending?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  likes: number;
  created_at: string;
  author?: Profile;
  reply_count?: number;
  is_liked?: boolean;
}

export interface PostReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  category?: string;
  created_at: string;
}

export interface FinancialSummary {
  id: string;
  user_id: string;
  tuition_balance: number;
  tuition_due?: string;
  meal_plan_balance: number;
  printing_credits: number;
  campus_card_balance: number;
  scholarships: number;
  financial_aid: number;
  monthly_budget: number;
}

export interface StudyRoom {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  noise_level: string;
  equipment?: string[];
  amenities?: string[];
  current_occupancy?: number;
  is_available?: boolean;
  next_available?: string;
}

export interface RoomBooking {
  id: string;
  room_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  room?: StudyRoom;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  type: string;
  location?: string;
  salary?: string;
  description?: string;
  requirements?: string[];
  posted_date: string;
  deadline?: string;
  is_saved?: boolean;
  is_applied?: boolean;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  applied_at: string;
  job?: Job;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: 'academic' | 'social' | 'wellness' | 'special' | 'streak';
  points: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  requirement_type?: string;
  requirement_value?: number;
  max_progress?: number;
  user_progress?: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  updated_at?: string;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: 'attendance' | 'grade' | 'submission' | 'study_hours' | 'early_bird' | 'event_attendance' | 'workout' | 'mensa' | 'friend_meetup';
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  streak_start_date?: string;
  updated_at?: string;
}

export interface StreakActivity {
  id: string;
  user_id: string;
  streak_type: string;
  activity_date: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  is_completed: boolean;
  achievement?: Achievement;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  source: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Leaderboard {
  id: string;
  type: 'weekly' | 'monthly' | 'semester' | 'course' | 'challenge';
  category?: string;
  course_id?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank: number;
  score: number;
  metadata?: Record<string, any>;
  updated_at: string;
  user?: Profile;
}

export interface Challenge {
  id: string;
  name: string;
  description?: string;
  type: 'study' | 'fitness' | 'social' | 'academic' | 'custom';
  duration_days: number;
  start_date: string;
  end_date: string;
  target_value: number;
  target_type: string;
  reward_points: number;
  reward_achievement_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number;
  joined_at: string;
  completed_at?: string;
  challenge?: Challenge;
  user?: Profile;
}

export interface StreakRecovery {
  id: string;
  user_id: string;
  streak_type: string;
  used_at: string;
  recovery_month: string;
}

export interface LevelConfig {
  level: number;
  level_name: string;
  points_required: number;
  rewards?: Record<string, any>;
}

export interface SurpriseReward {
  id: string;
  user_id: string;
  reward_type: 'points' | 'achievement' | 'badge' | 'perk';
  reward_value?: number;
  achievement_id?: string;
  message?: string;
  claimed: boolean;
  expires_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'course';
  name?: string;
  created_at: string;
  participants?: Profile[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: number;
  note?: string;
  created_at: string;
}

export interface SleepEntry {
  id: string;
  user_id: string;
  hours: number;
  date: string;
}

// =============================================
// SOCIAL CONNECTIONS TYPES
// =============================================

export interface FriendRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  recipient?: Profile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  is_close_friend: boolean;
  created_at: string;
  friend?: Profile;
  user?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: Profile;
  following?: Profile;
}

export interface ConnectionStory {
  id: string;
  user_id: string;
  connected_user_id: string;
  story: string;
  location?: string;
  context?: string;
  created_at: string;
  connected_user?: Profile;
}

export interface CourseClassmate {
  id: string;
  user_id: string;
  classmate_id: string;
  course_id: string;
  semester?: string;
  discovered_at: string;
  classmate?: Profile;
  course?: Course;
}

export interface FriendLocation {
  id: string;
  user_id: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  is_visible: boolean;
  updated_at: string;
  user?: Profile;
}

export interface MutualConnection {
  user: Profile;
  mutual_friends_count: number;
  mutual_courses_count: number;
}

export interface SocialStats {
  friends_count: number;
  followers_count: number;
  following_count: number;
  close_friends_count: number;
  mutual_connections_count: number;
}

// =============================================
// APP-SPECIFIC TYPES
// =============================================

export interface SearchResults {
  courses: Pick<Course, 'id' | 'code' | 'name' | 'professor'>[];
  events: Pick<Event, 'id' | 'title' | 'date' | 'location'>[];
  jobs: Pick<Job, 'id' | 'title' | 'company' | 'type'>[];
  faqs: Pick<FAQ, 'id' | 'question' | 'category'>[];
}

export type FeatureCategory =
  | 'academics'
  | 'financial'
  | 'dining'
  | 'transport'
  | 'study'
  | 'ai'
  | 'messages'
  | 'career'
  | 'wellness'
  | 'achievements'
  | 'events'
  | 'community'
  | 'notifications'
  | 'search';

export interface QuickAccessItem {
  id: FeatureCategory;
  title: string;
  icon: string;
  route: string;
  color: string;
  description?: string;
}










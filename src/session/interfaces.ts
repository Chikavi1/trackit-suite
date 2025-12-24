import { EventType as RRWebEvent } from 'rrweb';

export interface TrackerConfig {
  projectId?: string;
  endpoint?: string;
  environment?: string;
  release?: string;
  userId?: string;
  enableRRWeb?: boolean;
  excludePaths?: (string | RegExp)[];
}

export interface EventData {
  [key: string]: any;
}

export interface SystemEvent {
  type: string;
  data: EventData;
  page: string;
  timestamp: number;
  relativeTime: number;
}

export interface PageEvent {
  type: string;
  data: EventData;
  timestamp: number;
  relativeTime: number;
  page: string;
}

export interface Page {
  page: string;
  duration: number;
  totalClicks: number;
  percentageScroll: number;
  events: PageEvent[];
}

export interface Session {
  sessionId: string;
  entryUrl: string;
  exitUrl: string;
  pages: Page[];
  rrwebEvents: RRWebEvent[];
  systemEvents: SystemEvent[];
  entry_page?: string;
  exit_page?: string;
  total_clicks?: number;
  total_inputs?: number;
  total_pages_visited?: number;
}

export interface UserInfo {
  browser: string;
  platform: string;
  language: string;
  fingerprint: string | null;
  isBot: boolean | null;
  deviceType: 'mobile' | 'desktop';
  screen: { width: number; height: number };
  timezone: string;
}

export interface Events {
  leadId?: string;
  userInfo: UserInfo;
  session: Session;
  errors: TrackedError[];
  createdAt: string;
  total_clicks?: number;
  total_inputs?: number;
  total_pages_visited?: number;
}



export interface RecordedEvent {
  type: string;
  data: EventData;
  timestamp: number;
  relativeTime: number;
  page: string;
}

export interface SystemTrackerOptions {
  businessId: string;
  userId?: string;
}

export interface TrackedError {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  timestamp: number;
  page: string;
   count?: number;
   hash: string;
   lastOccurred: number;
   
}
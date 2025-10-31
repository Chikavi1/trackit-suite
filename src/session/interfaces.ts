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
}

export interface UserInfo {
  browser: string;
  platform: string;
  language: string;
  deviceType: 'mobile' | 'desktop';
  screen: { width: number; height: number };
  timezone: string;
}

export interface Events {
  leadId: string;
  userInfo: UserInfo;
  session: Session;
  createdAt: string;
}



export interface RecordedEvent {
  type: string;
  data: EventData;
  timestamp: number;
  relativeTime: number;
}
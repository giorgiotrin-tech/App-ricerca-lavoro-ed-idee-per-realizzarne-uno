export enum AppView {
  JOBS = 'JOBS',
  IDEAS = 'IDEAS',
  VEO = 'VEO',
  LIVE = 'LIVE'
}

export interface JobSearchFilters {
  keyword: string;
  region: string;
  province: string;
  city: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
  sources?: GroundingSource[];
}

export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  budget: string;
  expenses: string[];
  sponsors: Array<{name: string, url: string}>;
  author: string;
  createdAt: number;
}

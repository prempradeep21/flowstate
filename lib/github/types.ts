export type WidgetStatus = "loading" | "ready" | "error";

export interface RepoRef {
  owner: string;
  repo: string;
  defaultBranch: string;
}

export interface OverviewData {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  license: string | null;
  primaryLanguage: string | null;
  sizeKb: number;
  topics: string[];
}

export interface WhoItsForDetail {
  /** Who the repository is intended for. */
  intendedFor: string;
  /** Who is supposed to use it day to day. */
  whoShouldUse: string;
  /** Who will benefit / what problems it solves for them. */
  whoItHelps: string;
}

export interface OverviewAi {
  category: string;
  tags: string[];
  /** Plain-language explanation of what the project does (1–2 paragraphs, \\n\\n separated). */
  whatItIs: string;
  whoItsFor: WhoItsForDetail;
  keyFeatures: string[];
}

export interface MediaItem {
  kind: "image" | "youtube" | "video";
  url: string;
  thumb?: string;
  alt?: string;
  title?: string;
}

export interface MediaData {
  screenshotCount: number;
  videoCount: number;
  architectureDiagramCount: number;
  primaryScreenshot?: string;
  primaryDemoVideo?: string;
  items: MediaItem[];
}

export type PreviewType =
  | "github-pages"
  | "static-website"
  | "storybook"
  | "documentation"
  | "hosted-application"
  | "mobile-only"
  | "desktop-only"
  | "no-preview";

export interface PreviewData {
  previewAvailable: boolean;
  previewUrl?: string;
  previewType: PreviewType;
  deploymentProvider?: string;
  confidence: number;
}

export interface TechData {
  frontendFramework?: string;
  backendFramework?: string;
  database?: string;
  hostingPlatform?: string;
  authenticationProvider?: string;
  paymentProvider?: string;
  aiProviders: string[];
  programmingLanguages: { name: string; bytes: number; percent: number }[];
  dependencies: string[];
  dockerSupport: boolean;
  installationCommands: string[];
  envVarsRequired: string[];
}

export interface TechAi {
  architectureSummary: string;
  estimatedSetupTime: string;
}

export interface TopRepo {
  name: string;
  description: string | null;
  stars: number;
  htmlUrl: string;
}

export interface BuiltByData {
  name: string | null;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  website?: string;
  company?: string;
  location?: string;
  bio: string | null;
  followers: number;
  publicRepos: number;
  twitterUsername?: string;
  topRepos: TopRepo[];
  yearsActive: number;
}

export interface FileExtensionCount {
  extension: string;
  label: string;
  count: number;
}

export interface FileStructureData {
  totalFiles: number;
  totalFolders: number;
  totalEntries: number;
  truncated: boolean;
  extensionCounts: FileExtensionCount[];
  topLevelFolders: string[];
}

export interface RepoExplorerData {
  repoUrl: string;
  owner: string;
  name: string;
  enrichmentStatus: "pending" | "partial" | "complete" | "error";
  overview: { status: WidgetStatus; data?: OverviewData; ai?: OverviewAi };
  fileStructure: { status: WidgetStatus; data?: FileStructureData };
  media: { status: WidgetStatus; data?: MediaData };
  preview: { status: WidgetStatus; data?: PreviewData };
  techDetails: { status: WidgetStatus; data?: TechData; ai?: TechAi };
  builtBy: { status: WidgetStatus; data?: BuiltByData };
  fetchedAt: string;
  error?: string;
}

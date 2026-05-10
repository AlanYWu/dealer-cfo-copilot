export type Quote = {
  id: string;
  text: string;
  docId: string;
  docName: string;
  folder: string;
  page: number;
  bbox?: [number, number, number, number];
  contextBefore: string;
  contextAfter: string;
  score: number;
};

export type Scope = {
  folders?: string[];
  docIds?: string[];
};

export type SearchMode = "keyword" | "natural" | "hybrid";
export type SearchDepth = "fast" | "accurate";

export type SearchRequest = {
  query: string;
  scope?: Scope;
  mode?: SearchMode;
  depth?: SearchDepth;
};

export type RefineSuggestion = {
  kind: "folder" | "doc";
  label: string;
  folder?: string;
  docId?: string;
};

export type RefineHint = {
  totalMatches: number;
  suggestions: RefineSuggestion[];
};

export type MissingHint = {
  suggestions: string[];
};

export type SearchResponse = {
  sessionId: string;
  quotes: Quote[];
  refine?: RefineHint;
  missing?: MissingHint;
};

export type SessionSummary = {
  id: string;
  query: string;
  createdAt: string;
  quoteCount: number;
};

export type Session = SessionSummary & {
  scope?: Scope;
  quotes: Quote[];
};

export type DocumentNode = {
  docId: string;
  docName: string;
  folder: string;
  pages: number;
  sizeBytes: number;
  uploadedAt: string;
};

export type KnowledgeBaseTree = {
  folders: Array<{ name: string; documents: DocumentNode[] }>;
};

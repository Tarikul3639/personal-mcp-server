// (parameter) cb: BaseToolCallback<{
//  [x: string]: unknown;
//  content: ({
//  type: "text";
//  text: string;
//  annotations?: {
//  audience?: ("user" | "assistant")[] | undefined;
//  priority?: number | undefined;
//  lastModified?: string | undefined;
//  } | undefined;
//  _meta?: {
//  [x: string]: unknown;
//  } | undefined;
//  } | {
//  type: "image";
//  data: string;
//  mimeType: string;
//  annotations?: {
//  audience?: ("user" | "assistant")[] | undefined;
//  priority?: number | undefined;
//  lastModified?: string | undefined;
//  } | undefined;
//  _meta?: {
//  [x: string]: unknown;
//  } | undefined;
//  } | {
//  type: "audio";
//  data: string;
//  mimeType: string;
//  annotations?: {
//  audience?: ("user" | "assistant")[] | undefined;
//  priority?: number | undefined;
//  lastModified?: string | undefined;
//  } | undefined;
//  _meta?: {
//  ...;
//  } | undefined;
//  } | {
//  ...;
//  } | {
//  ...;
//  })[];
//  _meta?: {
//  ...;
//  } | undefined;
//  structuredContent?: unknown;
//  isError?: boolean | undefined;
// } | InputRequiredResult, ServerContext, InputArgs>
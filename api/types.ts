
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message?: string;
}

// Add these to your types.ts or at the bottom of your index.ts
export interface GoogleSignInRequest {
  idToken: string;
}

export interface GoogleSignInResponse {
  user: User;
  token: string;
  message: string;
}

// Update your User interface to include new fields
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  googleId?: string; // Add this
  provider?: string; // Add this
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentFolderId: string | null;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadThingFolderId?: string;
  children?: Folder[];
  metadata?: {
    documentTypeMetadataId?: string;
  };
  totalSizeBytes: string;
  totalSizeKB: string;
  documentCount: number;
  totalSize: string;
  storagePercentage: number;
  isNearLimit: boolean;
  isEmpty: boolean;
  isActive: boolean;
  lastUploadFormatted: string;
  folderAge: number;
}

// eslint-disable-next-line import/export
export interface UserStats {
  totalFolders: number;
  activeFolders: number;
  emptyFolders: number;
  totalDocuments: number;
  totalStorage: string;
  totalStorageBytes: string;
  storagePercentage: number;
  averageStoragePerFolder: string;
}

export interface UserDashboardResponse {
  folders: Folder[];
  userStats: UserStats;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Document-related types
export interface Document {
  id: string;
  filename: string;
  fileSize?: string;
  mimeType: string;
  uploadThingFileId?: string;
  uploadThingUrl?: string;
  documentTypeId?: string | null;
  metadata: Record<string, any>;
  uploadedBy?: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  documentType?: {
    id: string;
    name: string;
  } | null;
}

export interface DocumentType {
  id: string;
  name: string;
}

// Request types
export interface SearchDocumentsRequest {
  categoryId: any;
  query?: string;
  metadata?: Record<string, any>;
  tagIds?: string[];
  documentTypeId?: string;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  folderId?: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  page?: number;
  limit?: number;
  isTrending:boolean;
}

export interface CreateDocumentRequest {
  filename: string;
  fileSize?: string | number;
  mimeType: string;
  uploadThingFileId?: string;
  uploadThingUrl?: string;
  documentTypeId?: string | null;
  metadata?: Record<string, any>;
  metadataSchemaId?: string;
  uploadedBy?: string;
  organizationId: string;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  folderId: string;
}

export interface UpdateDocumentRequest {
  documentTypeId?: string | null;
  metadata?: Record<string, any>;
  metadataSchemaId?: string;
  isVerified?: boolean;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Response types
export interface CreateDocumentResponse {
  success: boolean;
  id: string;
  filename: string;
  fileSize?: string;
  mimeType: string;
  uploadThingFileId?: string;
  uploadThingUrl?: string;
  documentTypeId?: string | null;
  metadata: Record<string, any>;
  uploadedBy: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  folderId: string;
  organizationId: string;
  message: string;
}

export interface UpdateDocumentResponse {
  success: boolean;
  data: Document;
  message: string;
}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}


// eslint-disable-next-line import/export
export interface UserStats {
  totalFolders: number;
  activeFolders: number;
  emptyFolders: number;
  totalDocuments: number;
  totalStorage: string;
  totalStorageBytes: string;
  storagePercentage: number;
  averageStoragePerFolder: string;
}

// Request types
export interface GetFoldersRequest {
  userId: string;
  organizationId: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parentFolderId?: string | null;
  createdBy: string;
  metadata?: Record<string, any>;
  organizationId: string;
}

// Response types
export interface GetFoldersResponse {
  folders: Folder[];
  userStats: UserStats;
}

export interface DeleteFolderResponse {
  success: boolean;
  message: string;
}





// Document Type related types
export interface SchemaProperty {
  type: string;
  priority?: number;
  description?: string;
  [key: string]: any;
}

export interface Schema {
  type: string;
  required: string[];
  properties: Record<string, SchemaProperty>;
  [key: string]: any;
}

export interface DocumentMetadata {
  id: string;
  documentTypeId: string;
  schema: Schema;
  version: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTypeBase {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTypeWithMetadata extends DocumentTypeBase {
  metadata: DocumentMetadata[];
}

// Request types
export interface CreateDocumentTypeRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  metadataSchema: Schema;
  organizationId: string;
  createdBy: string;
}


// AWS Upload related types
export interface OptimizationInfo {
  originalSize: string;
  finalSize: string;
  resolutionReduced?: boolean;
  finalQuality?: number;
}

export interface AwsUploadResponse {
  message: string;
  url: string;
  key: string;
  fileName: string;
  optimization: OptimizationInfo;
}

export interface AwsUploadInfoResponse {
  message: string;
  note: string;
}

// Image file interface for React Native compatibility
export interface ImageFile {
  uri: string;
  type?: string;
  fileName?: string;
  name?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}


// Image Processing related types
export interface ExtractedData {
  Name: string;
  Amount: number;
  paidto: string;
  purposeofPayment: string;
  [key: string]: any; // Allow for dynamic fields
}

export interface ProcessImageRequest {
  url: string;
  filetype: string;
  extractionFields?: ExtractedData;
}

export interface ProcessImageData {
  extractedData: ExtractedData;
  rawOcrText: string;
  processingTime: string;
}

export interface ProcessImageResponse {
  success: boolean;
  data?: ProcessImageData;
  error?: string;
  details?: string;
}

export interface ProcessImageApiInfo {
  message: string;
  usage: {
    method: string;
    requiredFields: string[];
    optionalFields: string[];
    maxFileSize: string;
    supportedFormats: string[];
  };
}

// Predefined extraction templates
export interface InvoiceExtractionFields {
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  vendorName: string;
  description: string;
}

export interface ReceiptExtractionFields {
  storeName: string;
  amount: number;
  date: string;
  items: string;
  paymentMethod: string;
}

export interface ContractExtractionFields {
  contractTitle: string;
  parties: string;
  effectiveDate: string;
  expirationDate: string;
  value: number;
}

// Like-related types
export interface GetArticleLikesResponse {
  likeCount: number;
  userLiked: boolean;
}

export interface ToggleArticleLikeRequest {
  userId: string;
}

export interface ToggleArticleLikeResponse {
  success: boolean;
  liked: boolean;
  likeCount: number;
}

// Share-related types
export interface GetArticleSharesResponse {
  shareCount: number;
  platformBreakdown: Array<{
    platform: string;
    count: number;
  }>;
}

export interface RecordArticleShareRequest {
  userId?: string;
  platform: 'twitter' | 'facebook' | 'whatsapp' | 'linkedin' | 'email' | 'copy_link' | 'other';
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordArticleShareResponse {
  success: boolean;
  shareCount: number;
}

// Bookmark-related types
export interface BookmarkData {
  bookmarkId: string;
  article: any; // Replace with your Article type
}

export interface GetUserBookmarksResponse {
  success: boolean;
  data: BookmarkData[];
}

export interface ToggleBookmarkResponse {
  success: boolean;
  bookmarked: boolean;
  bookmarkId?: string;
  message: string;
}

// Comment count related types
export interface GetArticleCommentCountResponse {
  commentCount: number;
  actualCount: number;
  synced: boolean;
}

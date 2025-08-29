// src/api/types.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  otherRoles?: string[];
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
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
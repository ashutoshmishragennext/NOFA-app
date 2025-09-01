// src/api/index.ts
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
// import { AwsUploadInfoResponse, AwsUploadResponse, CreateDocumentRequest, CreateDocumentResponse, CreateDocumentTypeRequest, CreateFolderRequest, DeleteDocumentResponse, DeleteFolderResponse, DocumentTypeWithMetadata, Folder, GetFoldersRequest, GetFoldersResponse, LoginRequest, LoginResponse, ProcessImageApiInfo, ProcessImageRequest, ProcessImageResponse, SearchDocumentsRequest, UpdateDocumentRequest, UpdateDocumentResponse, User } from './types';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Get the Bearer token from environment variable
const BEARER_TOKEN ='eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI5MzI4ZmRjNC03ZThmLTQ1NTgtOTA4MS0xNjE3MDc4YTMyMDYiLCJleHAiOjE3NTYyNzYwNTl9.8T7NYohV7U3QROwubIyptIjDBbB49zVVMwE-0foZ6j0';
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
class ApiService {
  private baseURL: string;
  private timeout: number;
  private isLoggedIn: boolean = false;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (userData) {
        this.isLoggedIn = true;
        console.log('User session restored');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  // private async getAuthHeaders(): Promise<Record<string, string>> {
  //   const headers: Record<string, string> = {
  //     'Content-Type': 'application/json',
  //   };

  //   // Only add Authorization header if user is logged in
  //   if (this.isLoggedIn) {
  //     headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
  //   }

  //   return headers;
  // }
  // Override the getAuthHeaders method to handle FormData requests
  private async getAuthHeaders(isFormData: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    // Only add Content-Type for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    headers['Accept'] = 'application/json';
    headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;

    // Only add Authorization header if user is logged in
    if (this.isLoggedIn) {
      headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    }

    return headers;
  }
private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.timeout);

  try {
    // Check if body is FormData
    const isFormData = options.body instanceof FormData;
    const authHeaders = await this.getAuthHeaders(isFormData);
    const fullUrl = `${this.baseURL}${url}`;
    console.log("full",fullUrl);
    console.log("header",authHeaders)
    
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        await this.clearAuth();
        throw new Error('Authentication failed. Please login again.');
      }
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  }

  private async clearAuth() {
    this.isLoggedIn = false;
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }

async login(credentials: LoginRequest): Promise<LoginResponse> {
  const url = `${this.baseURL}/api/auth/login`;
  console.log("🚀 Making request to:", url);
  console.log("📋 Credentials:", credentials);
  console.log("🌐 Base URL:", this.baseURL);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log("📡 Response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    const data = await response.json();
    console.log("📦 Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (!data.user) {
      throw new Error('Invalid login response: missing user data');
    }

    this.isLoggedIn = true;
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data.user));

    return {
      user: data.user,
      token: BEARER_TOKEN,
      message: data.message
    };
  } catch (error: any) {
    console.error("❌ Login error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Check if server is running and both devices are on same WiFi network.');
    }
    
    throw error;
  }
}

  async logout(): Promise<void> {
    try {
      if (this.isLoggedIn) {
        await this.fetchWithTimeout('/api/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  // async getCurrentUser(): Promise<User | null> {
  //   try {
  //     const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
  //     return userData ? JSON.parse(userData) : null;
  //   } catch (error) {
  //     console.error('Error getting current user:', error);
  //     return null;
  //   }
  // }

  async getUserById(id: string): Promise<User> {
    const response = await this.fetchWithTimeout(`/api/users?id=${id}`, {
      method: 'GET',
    });
    return this.handleResponse<User>(response);
  }

  async getUsers(): Promise<User[]> {
    console.log("Fetching users with this data");
    
    const response = await this.fetchWithTimeout('/api/users', {
      method: 'GET',
    });
    
    const users = await this.handleResponse<User[]>(response);
    console.log("Users fetched:", users);
    
    return users;
  }

// GET /api/documents - Search/get documents with filters
async getDocuments(params?: SearchDocumentsRequest): Promise<any> {
  let url = `/api/articles`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.documentTypeId) searchParams.append('documentTypeId', params.documentTypeId);
    if (params.verificationStatus) searchParams.append('verificationStatus', params.verificationStatus);
    if (params.folderId) searchParams.append('folderId', params.folderId);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.metadata) searchParams.append('metadata', JSON.stringify(params.metadata));

    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  console.log("Fetching documents with URL:", url);

  const response = await this.fetchWithTimeout(url, { method: 'GET' });
  const documents = await this.handleResponse<Document[]>(response);

  console.log("Documents fetched:", documents);

  return documents; // ✅ FIX: Return the data
}


// POST /api/documents - Create a new document
async createDocument(documentData: CreateDocumentRequest): Promise<CreateDocumentResponse> {
  console.log("Creating document:", documentData);
  
  const response = await this.fetchWithTimeout('/api/documents', {
    method: 'POST',
    body: JSON.stringify(documentData),
  });
  
  const result = await this.handleResponse<CreateDocumentResponse>(response);
  console.log("Document created:", result);
  
  return result;
}

// PUT /api/documents - Update a document
async updateDocument(documentId: string, updateData: UpdateDocumentRequest): Promise<UpdateDocumentResponse> {
  console.log("Updating document:", documentId, updateData);
  
  const response = await this.fetchWithTimeout(`/api/documents?id=${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
  
  const result = await this.handleResponse<UpdateDocumentResponse>(response);
  console.log("Document updated:", result);
  
  return result;
}

// DELETE /api/documents - Delete a document
async deleteDocument(documentId: string): Promise<DeleteDocumentResponse> {
  console.log("Deleting document:", documentId);
  
  const response = await this.fetchWithTimeout(`/api/documents?id=${documentId}`, {
    method: 'DELETE',
  });
  
  const result = await this.handleResponse<DeleteDocumentResponse>(response);
  console.log("Document deleted:", result);
  
  return result;
}


// Add to your ApiService class

// GET /api/folders - Get folders with statistics
async getFolders(params: GetFoldersRequest): Promise<GetFoldersResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.userId) searchParams.append('userId', params.userId);
  if (params.organizationId) searchParams.append('organizationId', params.organizationId);
  
  const url = `/api/folders?${searchParams.toString()}`;
  
  console.log("Fetching folders with URL:", url);
  
  const response = await this.fetchWithTimeout(url, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<GetFoldersResponse>(response);
  console.log("Folders fetched:", result);
  
  return result;
}

// POST /api/folders - Create a new folder
async createFolder(folderData: CreateFolderRequest): Promise<Folder> {
  console.log("Creating folder:", folderData);
  
  const response = await this.fetchWithTimeout('/api/folders', {
    method: 'POST',
    body: JSON.stringify(folderData),
  });
  
  const result = await this.handleResponse<Folder>(response);
  console.log("Folder created:", result);
  
  return result;
}

// DELETE /api/folders - Delete a folder
async deleteFolder(folderId: string): Promise<DeleteFolderResponse> {
  console.log("Deleting folder:", folderId);
  
  const response = await this.fetchWithTimeout(`/api/folders?id=${folderId}`, {
    method: 'DELETE',
  });
  
  const result = await this.handleResponse<DeleteFolderResponse>(response);
  console.log("Folder deleted:", result);
  
  return result;
}

// Add to your ApiService class

// GET /api/documenttype - Get all document types with metadata
async getDocumentTypes(): Promise<DocumentTypeWithMetadata[]> {
  console.log("Fetching document types with metadata");
  
  const response = await this.fetchWithTimeout('/api/documentstype', {
    method: 'GET',
  });
  
  const documentTypes = await this.handleResponse<DocumentTypeWithMetadata[]>(response);
  console.log("Document types fetched:", documentTypes);
  
  return documentTypes;
}

// POST /api/documenttype - Create a new document type with metadata
async createDocumentType(documentTypeData: CreateDocumentTypeRequest): Promise<DocumentTypeWithMetadata> {
  console.log("Creating document type:", documentTypeData);
  
  const response = await this.fetchWithTimeout('/api/documentstype', {
    method: 'POST',
    body: JSON.stringify(documentTypeData),
  });
  
  const result = await this.handleResponse<DocumentTypeWithMetadata>(response);
  console.log("Document type created:", result);
  
  return result;
}

// Add to your ApiService class

// POST /api/aws-upload - Upload image file with compression
async uploadImage(file: File | any): Promise<AwsUploadResponse> {
  console.log("Uploading image:", file.name || file.fileName);
  
  const formData = new FormData();
  
  // Handle both web File objects and React Native image picker objects
  if (file.uri) {
    // React Native image picker format
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || file.name || `image_${Date.now()}.jpg`,
    } as any);
  } else {
    // Web File object
    formData.append('file', file);
  }

  console.log("FormData prepared:", formData);
  
  
  const response = await this.fetchWithTimeout('/api/aws-upload', {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type for FormData - let the browser set it with boundary
      'Accept': 'application/json',
    },
  });
  
  const result = await this.handleResponse<AwsUploadResponse>(response);
  console.log("Image uploaded:", result);
  
  return result;
}

// GET /api/aws-upload - Get API info
async getAwsUploadInfo(): Promise<AwsUploadInfoResponse> {
  const response = await this.fetchWithTimeout('/api/aws-upload', {
    method: 'GET',
  });
  
  return this.handleResponse<AwsUploadInfoResponse>(response);
}

// Add to your ApiService class

// POST /api/process-image - Process image with OCR and AI extraction
async processImage(requestData: ProcessImageRequest): Promise<ProcessImageResponse> {
  console.log("Processing image:", requestData.url);
  
  const response = await this.fetchWithTimeout('/api/process-image', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
  
  const result = await this.handleResponse<ProcessImageResponse>(response);
  console.log("Image processed:", result);
  
  return result;
}

// GET /api/process-image - Get API info
async getProcessImageInfo(): Promise<ProcessImageApiInfo> {
  const response = await this.fetchWithTimeout('/api/process-image', {
    method: 'GET',
  });
  
  return this.handleResponse<ProcessImageApiInfo>(response);
}



  // Getter to check if user is logged in
  get isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}

export const apiService = new ApiService();
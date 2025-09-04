// src/api/index.ts
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
// import { AwsUploadInfoResponse, AwsUploadResponse, CreateDocumentRequest, CreateDocumentResponse, CreateDocumentTypeRequest, CreateFolderRequest, DeleteDocumentResponse, DeleteFolderResponse, DocumentTypeWithMetadata, Folder, GetFoldersRequest, GetFoldersResponse, LoginRequest, LoginResponse, ProcessImageApiInfo, ProcessImageRequest, ProcessImageResponse, SearchDocumentsRequest, UpdateDocumentRequest, UpdateDocumentResponse, User } from './types';
import * as SecureStore from 'expo-secure-store';
import { AwsUploadInfoResponse, AwsUploadResponse, CreateDocumentRequest, CreateDocumentResponse, CreateDocumentTypeRequest, CreateFolderRequest, DeleteDocumentResponse, DeleteFolderResponse, DocumentTypeWithMetadata, Folder, GetFoldersResponse, LoginRequest, LoginResponse, ProcessImageApiInfo, ProcessImageRequest, ProcessImageResponse, SearchDocumentsRequest, UpdateDocumentRequest, UpdateDocumentResponse, User } from './types';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Get the Bearer token from environment variable
const BEARER_TOKEN ='eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI5MzI4ZmRjNC03ZThmLTQ1NTgtOTA4MS0xNjE3MDc4YTMyMDYiLCJleHAiOjE3NTYyNzYwNTl9.8T7NYohV7U3QROwubIyptIjDBbB49zVVMwE-0foZ6j0';

class ApiService {
  getCurrentUser() {
    throw new Error('Method not implemented.');
  }
  private baseURL: string;
  private timeout: number;
  private isLoggedIn: boolean = false;
  getBookmarks: any;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
    this.initializeAuth();
  }

   private async initializeAuth() {
  try {
    const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
    const authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    
    if (userData && authToken) {
      this.isLoggedIn = true;
      console.log('User session restored');
    } else {
      this.isLoggedIn = false;
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    this.isLoggedIn = false;
  }
}

private async getAuthHeaders(isFormData: boolean = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  headers['Accept'] = 'application/json';

  // Get the actual stored token instead of using hardcoded BEARER_TOKEN
  if (this.isLoggedIn) {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
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

 async login(credentials: LoginRequest): Promise<LoginResponse> {
  const url = `${this.baseURL}/api/auth/login`;
  console.log("🚀 Making request to:", url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    console.log("📦 Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Check for both user and token in response
    if (!data.user) {
      throw new Error('Invalid login response: missing user data');
    }

    // Store both user data and token
    this.isLoggedIn = true;
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data.user));
    
    // Store the actual token from server response
    if (data.token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
    } else {
      console.warn('No token received from server, using fallback');
      // Only use BEARER_TOKEN as fallback if server doesn't provide one
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, BEARER_TOKEN);
    }

    return {
      user: data.user,
      token: data.token || BEARER_TOKEN,
      message: data.message
    };
  } catch (error: any) {
    console.error("❌ Login error:", error);
    
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Check if server is running and both devices are on same WiFi network.');
    }
    
    throw error;
  }
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
    if (params.isTrending) searchParams.append('isTrending', params.isTrending);
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);
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


  const response = await this.fetchWithTimeout(url, { method: 'GET' });
  const documents = await this.handleResponse<Document[]>(response);


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

async createBookmark(documentData: CreateDocumentRequest): Promise<CreateDocumentResponse> {
  console.log("Creating document:", documentData);
  
  const response = await this.fetchWithTimeout('/api/documents', {
    method: 'POST',
    body: JSON.stringify(documentData),
  });
  
  const result = await this.handleResponse<CreateDocumentResponse>(response);
  console.log("Document created:", result);
  
  return result;
}
// Add to your ApiService class
async getBookMark(params:any): Promise<GetFoldersResponse> {
  const searchParams = new URLSearchParams();
  
  // if (params.id) searchParams.append('id', params.id);
  if (params.userID) searchParams.append('userID', params.userId);
  
  const url = `/api/bookmarks?${searchParams.toString()}`;
  
  console.log("Fetching folders with URL:", url);
  
  const response = await this.fetchWithTimeout(url, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<GetFoldersResponse>(response);
  console.log("Folders fetched:", result);
  
  return result;
}
async searchArticles(params:any): Promise<GetFoldersResponse> {
  const searchParams = new URLSearchParams();
  
  // if (params.id) searchParams.append('id', params.id);
  if (params.q) searchParams.append('q', params.q);
  
  const url = `/api/search?${searchParams.toString()}`;
  
  console.log("Fetching folders with URL:", url);
  
  const response = await this.fetchWithTimeout(url, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<GetFoldersResponse>(response);
  console.log("Folders fetched:", result);
  
  return result;
}
// Updated: Get comments with optional parentId for replies
async getComments(params: {
  articleId: string;
  parentId?: string;
}): Promise<{
  success: boolean;
  comments: any[];
  count: number;
  parentId?: string;
  isReplies: boolean;
}> {
  console.log("Fetching comments:", params);
  
  const searchParams = new URLSearchParams();
  searchParams.append('articleId', params.articleId);
  if (params.parentId) {
    searchParams.append('parentId', params.parentId);
  }
  
  const response = await this.fetchWithTimeout(`/api/comments?${searchParams.toString()}`, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<{
    success: boolean;
    comments: any[];
    count: number;
    parentId?: string;
    isReplies: boolean;
  }>(response);
  
console.log("API Response:", JSON.stringify(result, null, 2));
  console.log("First comment keys:", result.comments[0] ? Object.keys(result.comments[0]) : 'No comments');
    return result;
}

// New: Get replies for a specific comment
async getCommentReplies(commentId: string): Promise<{
  success: boolean;
  comments: any[];
  count: number;
}> {
  console.log("Fetching replies for comment:", commentId);
  
  const response = await this.fetchWithTimeout(`/api/comments?parentId=${commentId}`, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<{
    success: boolean;
    comments: any[];
    count: number;
  }>(response);
  
  console.log("Replies fetched:", result);
  return result;
}

async getTerending(params:any): Promise<GetFoldersResponse> {
  const searchParams = new URLSearchParams();
  
  // if (params.id) searchParams.append('id', params.id);
  if (params.timeRange) searchParams.append('timeRange', params.timeRange);
  
  const url = `/api/trending?limit=11&timeRange=${searchParams.toString()}`;
  
  console.log("Fetching folders with URL:", url);
  
  const response = await this.fetchWithTimeout(url, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<GetFoldersResponse>(response);
  console.log("Folders fetched:", result);
  
  return result;
}

// async createComments(documentData: any): Promise<CreateDocumentResponse> {
  
//   const response = await this.fetchWithTimeout('/api/comments', {
//     method: 'POST',
//     body: JSON.stringify(documentData),
//   });
  
//   const result = await this.handleResponse<any>(response);
//   console.log("Document created:", result);
  
//   return result;
// }
// GET /api/folders - Get folders with statistics
async getCategories(): Promise<GetFoldersResponse> {
  const searchParams = new URLSearchParams();
  
  // if (params.userId) searchParams.append('userId', params.userId);
  // if (params.organizationId) searchParams.append('organizationId', params.organizationId);
  
  const url = `/api/categories`;
  
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

// GET /api/articles/[id]/likes - Get like count and user's like status
async getArticleLikes(articleId: string, userId?: string): Promise<{likeCount: number, userLiked: boolean}> {
  let url = `/api/articles/${articleId}/likes`;
  
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  console.log("Fetching article likes:", url);
  
  const response = await this.fetchWithTimeout(url, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<{likeCount: number, userLiked: boolean}>(response);
  console.log("Article likes fetched:", result);
  
  return result;
}

// POST /api/articles/[id]/likes - Toggle like/unlike for an article
async toggleArticleLike(articleId: string, userId: string): Promise<{success: boolean, liked: boolean, likeCount: number}> {
  console.log("Toggling article like:", articleId, userId);
  
  const response = await this.fetchWithTimeout(`/api/articles/${articleId}/likes`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
  
  const result = await this.handleResponse<{success: boolean, liked: boolean, likeCount: number}>(response);
  console.log("Article like toggled:", result);
  
  return result;
}

// GET /api/articles/[id]/shares - Get share count and platform breakdown
async getArticleShares(articleId: string): Promise<{shareCount: number, platformBreakdown: any[]}> {
  console.log("Fetching article shares:", articleId);
  
  const response = await this.fetchWithTimeout(`/api/articles/${articleId}/shares`, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<{shareCount: number, platformBreakdown: any[]}>(response);
  console.log("Article shares fetched:", result);
  
  return result;
}

// POST /api/articles/[id]/shares - Record a share for an article
async recordArticleShare(articleId: string, platform: string, userId?: string): Promise<{success: boolean, shareCount: number}> {
  console.log("Recording article share:", articleId, platform);
  
  const response = await this.fetchWithTimeout(`/api/articles/${articleId}/shares`, {
    method: 'POST',
    body: JSON.stringify({ 
      userId: userId || null,
      platform,
      // You can add these if needed:
      // ipAddress: null,
      // userAgent: null
    }),
  });
  
  const result = await this.handleResponse<{success: boolean, shareCount: number}>(response);
  console.log("Article share recorded:", result);
  
  return result;
}

// GET /api/bookmarks - Get user's bookmarks
async getUserBookmarks(userId: string): Promise<{success: boolean, data: any[]}> {
  console.log("Fetching user bookmarks:", userId);
  
  const response = await this.fetchWithTimeout(`/api/bookmarks?UserId=${userId}`, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<{success: boolean, data: any[]}>(response);
  console.log("User bookmarks fetched:", result);
  
  return result;
}

// POST /api/bookmarks - Toggle bookmark (add or remove)
async toggleBookmark(userId: string, articleId: string): Promise<{success: boolean, bookmarked: boolean, bookmarkId?: string, message: string}> {
  console.log("Toggling bookmark:", userId, articleId);
  
  const response = await this.fetchWithTimeout(`/api/bookmarks?userId=${userId}&articleId=${articleId}`, {
    method: 'POST',
  });
  
  const result = await this.handleResponse<{success: boolean, bookmarked: boolean, bookmarkId?: string, message: string}>(response);
  console.log("Bookmark toggled:", result);
  
  return result;
}

// Check if article is bookmarked by user
async isArticleBookmarked(userId: string, articleId: string): Promise<boolean> {
  try {
    const bookmarks = await this.getUserBookmarks(userId);
    return bookmarks.data.some(bookmark => bookmark.article.id === articleId);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}


// POST /api/comments - Add a new comment or reply
async createComment(commentData: {
  articleId: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  parentId?: string;
  userId?: string;
}): Promise<{success: boolean, comment: any, message: string}> {
  console.log("Creating comment:", commentData);
  
  const response = await this.fetchWithTimeout('/api/comments', {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
  
  const result = await this.handleResponse<{success: boolean, comment: any, message: string}>(response);
  console.log("Comment created:", result);
  
  return result;
}

// POST /api/articles/[id]/views - Record an article view
async recordArticleView(articleId: string, userId?: string, referrer?: string): Promise<{
  success: boolean;
  incrementedCount: boolean;
  isDuplicate: boolean;
  message: string;
  debounced?: boolean;
}> {
  console.log("Recording article view:", articleId, userId);
  
  const response = await this.fetchWithTimeout(`/api/articles/${articleId}/views`, {
    method: 'POST',
    body: JSON.stringify({ 
      userId: userId || null,
      referrer: referrer || null,
      // ipAddress and userAgent will be auto-detected by the server
    }),
  });
  
  const result = await this.handleResponse<{
    success: boolean;
    incrementedCount: boolean;
    isDuplicate: boolean;
    message: string;
    debounced?: boolean;
  }>(response);
  
  console.log("Article view recorded:", result);
  return result;
}

// GET /api/articles/[id]/views - Get article view count and analytics
async getArticleViews(articleId: string, includeAnalytics: boolean = false): Promise<{
  viewCount: number;
  analytics?: {
    totalViews: number;
    uniqueUsers: number;
    uniqueIPs: number;
    todayViews: number;
    weekViews: number;
  };
}> {
  console.log("Fetching article views:", articleId, includeAnalytics);
  
  const url = `/api/articles/${articleId}/views${includeAnalytics ? '?analytics=true' : ''}`;
  
  const response = await this.fetchWithTimeout(url, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<{
    viewCount: number;
    analytics?: {
      totalViews: number;
      uniqueUsers: number;
      uniqueIPs: number;
      todayViews: number;
      weekViews: number;
    };
  }>(response);
  
  console.log("Article views fetched:", result);
  return result;
}

// PUT /api/articles/[id]/views - Admin action to reset view count
async resetArticleViews(articleId: string): Promise<{success: boolean, message: string}> {
  console.log("Resetting article views:", articleId);
  
  const response = await this.fetchWithTimeout(`/api/articles/${articleId}/views`, {
    method: 'PUT',
    body: JSON.stringify({ 
      articleId,
      action: 'reset'
    }),
  });
  
  const result = await this.handleResponse<{success: boolean, message: string}>(response);
  console.log("Article views reset:", result);
  
  return result;
}

// GET /api/articles/[id]/comments - Get comment count for a specific article
async getArticleCommentCount(articleId: string): Promise<{
  commentCount: number;
  actualCount: number;
  synced: boolean;
}> {
  console.log("Fetching article comment count:", articleId);
  
  const response = await this.fetchWithTimeout(`/api/articles/${articleId}/comments`, {
    method: 'GET',
  });
  
  const result = await this.handleResponse<{
    commentCount: number;
    actualCount: number;
    synced: boolean;
  }>(response);
  
  console.log("Article comment count fetched:", result);
  return result;
}


  // Getter to check if user is logged in
  get isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}

export const apiService = new ApiService();
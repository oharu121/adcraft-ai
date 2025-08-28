import { GoogleAuth } from 'google-auth-library';
// Note: Using REST API calls for Vertex AI instead of the client library

/**
 * Base Vertex AI client service for accessing Google Cloud AI services
 * Provides authentication and common configuration for AI APIs
 * Supports mock mode for local testing without GCP credentials
 */
export class VertexAIService {
  private static instance: VertexAIService;
  private auth: GoogleAuth | null = null;
  private projectId: string;
  private region: string;
  private baseUrl: string;
  private isMockMode: boolean;

  private constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || '';
    this.region = process.env.GCP_REGION || 'asia-northeast1';
    this.isMockMode = process.env.NODE_ENV === 'development' && 
                      (process.env.ENABLE_MOCK_MODE === 'true' || !this.projectId);
    
    if (!this.projectId && !this.isMockMode) {
      throw new Error('GCP_PROJECT_ID environment variable is required for production mode');
    }

    // Use mock project ID if in mock mode
    if (this.isMockMode && !this.projectId) {
      this.projectId = 'adcraft-ai-mock';
      console.log('[MOCK MODE] Using mock project ID for local development');
    }

    // Initialize Google Auth only if not in mock mode
    if (!this.isMockMode) {
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      console.log('[MOCK MODE] Skipping Google Auth initialization for local testing');
    }

    // Set base URL for Vertex AI REST API
    this.baseUrl = `https://${this.region}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.region}`;
  }

  /**
   * Get singleton instance of VertexAIService
   */
  public static getInstance(): VertexAIService {
    if (!VertexAIService.instance) {
      VertexAIService.instance = new VertexAIService();
    }
    return VertexAIService.instance;
  }

  /**
   * Get base URL for API calls
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get authentication instance
   */
  public getAuth(): GoogleAuth {
    if (!this.auth) {
      throw new Error('Google Auth not initialized - running in mock mode');
    }
    return this.auth;
  }

  /**
   * Get project configuration
   */
  public getConfig() {
    return {
      projectId: this.projectId,
      region: this.region,
    };
  }

  /**
   * Get access token for API calls
   * Returns mock token in development mode
   */
  public async getAccessToken(): Promise<string> {
    if (this.isMockMode) {
      return 'mock-access-token-for-development';
    }

    if (!this.auth) {
      throw new Error('Google Auth not initialized');
    }

    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }
    
    return accessToken.token;
  }

  /**
   * Health check for Vertex AI service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (this.isMockMode) {
        console.log('[MOCK MODE] Health check passed (mock mode)');
        return true;
      }
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Vertex AI health check failed:', error);
      return false;
    }
  }

  /**
   * Check if service is running in mock mode
   */
  public isMock(): boolean {
    return this.isMockMode;
  }
}
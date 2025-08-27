import { GoogleAuth } from 'google-auth-library';
// Note: Using REST API calls for Vertex AI instead of the client library

/**
 * Base Vertex AI client service for accessing Google Cloud AI services
 * Provides authentication and common configuration for AI APIs
 */
export class VertexAIService {
  private static instance: VertexAIService;
  private auth: GoogleAuth;
  private projectId: string;
  private region: string;
  private baseUrl: string;

  private constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || '';
    this.region = process.env.GCP_REGION || 'asia-northeast1';
    
    if (!this.projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required');
    }

    // Initialize Google Auth
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

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
   */
  public async getAccessToken(): Promise<string> {
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
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Vertex AI health check failed:', error);
      return false;
    }
  }
}
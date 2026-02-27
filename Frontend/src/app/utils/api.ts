// API configuration and utilities
const API_BASE_URL = 'http://localhost:8000';

export interface LoginRequest {
  institutional_email: string;
  password: string;
}

export interface LoginResponse {
  id_user: number;
  full_name: string;
  institutional_email: string;
  role_name: string;
  campaign?: string;
  access_token: string;
  token_type: string;
}

export interface PasswordRecoveryRequest {
  institutional_email: string;
}

export interface RegisterRequest {
  full_name: string;
  institutional_email: string;
  password: string;
  campaign: string;
}

export interface VerifyCodeRequest {
  institutional_email: string;
  code: string;
}

export interface ResetPasswordRequest {
  institutional_email: string;
  code: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    // backend returns a LoginResponse upon successful registration
    return this.request<LoginResponse>('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestPasswordRecovery(request: PasswordRecoveryRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/users/request-recovery', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async verifyCode(request: VerifyCodeRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/users/verify-code', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return this.request<ResetPasswordResponse>('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
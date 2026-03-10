// API configuration and utilities
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  'https://margery-highfalutin-unambiguously.ngrok-free.dev';

export interface LoginRequest {
  institutional_email: string;
  password: string;
}

export interface LoginResponse {
  id_user: number;
  full_name: string;
  institutional_email: string;
  role_name: string;
  id_role: number;
  campaign?: string;
  access_token: string;
  token_type: string;
}

export interface UserListItemDto {
  id_user: number;
  full_name: string;
  institutional_email: string;
  id_role: number;
  campaign: string;
  created_at: string;
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

export interface LocationOption {
  id_location: number;
  location_name: string;
}

export interface FloorOption {
  id_floor: number;
  floor_name: string;
  id_location: number;
}

export interface FloorCreate {
  floor_name: string;
  id_location: number;
}

export interface StationOption {
  id_station: string;
  id_floor: number;
  id_zone?: number | null;
}

export interface CategoryOption {
  id_category: number;
  category_name: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  id_category: number;
  created_by: number;
  id_station?: string;
  priority?: string;
  category_detail?: string;
}

export interface TicketResponseDto {
  id_ticket: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  id_category: number;
  created_by: number;
  primary_technician?: number | null;
  secondary_technician?: number | null;
  id_station?: string | null;
  created_at: string;
  resolved_at?: string | null;
  category_detail?: string | null;
  moved_by?: number | null;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  id_category?: number;
  primary_technician?: number;
  secondary_technician?: number;
  id_station?: string;
  resolved_at?: string;
  moved_by?: number;
  category_detail?: string;
}

export interface CreateCommentRequest {
  id_ticket: number;
  id_user: number;
  content: string;
  internal_note?: boolean;
  evidence_url?: string;
}

export interface CommentDto {
  id_comment: number;
  id_ticket: number;
  id_user: number;
  content: string;
  internal_note: boolean;
  evidence_url: string | null;
  created_at: string;
}

export interface ChangeHistoryDto {
  id_change: number;
  id_ticket: number;
  action_user: number;
  change_description: string | null;
  created_at: string;
  ticket_title: string | null;
  ticket_description: string | null;
  ticket_priority: string | null;
  ticket_status: string | null;
  ticket_station: string | null;
  ticket_created_at: string | null;
  ticket_resolved_at: string | null;
  reported_by: number | null;
  internal_notes: Array<{
    id_comment: number;
    id_user: number;
    content: string;
    created_at: string;
  }>;
}

export interface MapDecorationDto {
  id_decoration: number;
  id_zone: number;
  decoration_type: string;
  label?: string | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string | null;
}

export interface MapStationDto {
  id_station: string;
  id_zone: number;
  current_status: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  width: number;
  height: number;
  has_active_reports: boolean;
}

export interface MapZoneResponseDto {
  id_zone: number;
  stations: MapStationDto[];
  decorations: MapDecorationDto[];
}

export interface MapStationSavePayload {
  id_station: string;
  id_zone: number;
  pos_x: number;
  pos_y: number;
  rotation: number;
  width: number;
  height: number;
}

export interface MapDecorationSavePayload {
  decoration_type: string;
  label?: string | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string | null;
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
        'ngrok-skip-browser-warning': 'true',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica que el backend esté corriendo correctamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error HTTP: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('No se puede conectar al servidor. Verifica que el backend esté activo.');
      }
      throw error;
    }
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

  async getUsers(): Promise<UserListItemDto[]> {
    return this.request<UserListItemDto[]>('/users/');
  }

  async getLocations(): Promise<LocationOption[]> {
    return this.request<LocationOption[]>('/locations/');
  }

  async getFloors(): Promise<FloorOption[]> {
    return this.request<FloorOption[]>('/floors/');
  }

  async createFloor(floorData: FloorCreate): Promise<FloorOption> {
    return this.request<FloorOption>('/floors/', {
      method: 'POST',
      body: JSON.stringify(floorData),
    });
  }

  async getStations(): Promise<StationOption[]> {
    return this.request<StationOption[]>('/stations/');
  }

  async getCategories(): Promise<CategoryOption[]> {
    return this.request<CategoryOption[]>('/categories/');
  }

  async createTicket(payload: CreateTicketRequest): Promise<TicketResponseDto> {
    return this.request<TicketResponseDto>('/tickets/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTickets(): Promise<TicketResponseDto[]> {
    return this.request<TicketResponseDto[]>('/tickets/');
  }

  async getTicket(ticketId: number | string): Promise<TicketResponseDto> {
    return this.request<TicketResponseDto>(`/tickets/${ticketId}`);
  }

  async updateTicket(ticketId: number | string, payload: UpdateTicketRequest): Promise<TicketResponseDto> {
    return this.request<TicketResponseDto>(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async createComment(payload: CreateCommentRequest): Promise<CommentDto> {
    return this.request<CommentDto>('/comments/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCommentsByTicket(ticketId: number | string): Promise<CommentDto[]> {
    return this.request<CommentDto[]>(`/comments/ticket/${ticketId}`);
  }

  async getChangesByTicket(ticketId: number | string): Promise<ChangeHistoryDto[]> {
    return this.request<ChangeHistoryDto[]>(`/changes/ticket/${ticketId}`);
  }

  async getChangesByStation(stationId: string): Promise<ChangeHistoryDto[]> {
    return this.request<ChangeHistoryDto[]>(`/changes/station/${stationId}`);
  }

  async getMapByZone(idZone: number): Promise<MapZoneResponseDto> {
    return this.request<MapZoneResponseDto>(`/api/map/${idZone}`);
  }

  async saveMapStations(stations: MapStationSavePayload[]): Promise<{ updated: number; message: string }> {
    return this.request<{ updated: number; message: string }>('/api/map/save', {
      method: 'PUT',
      body: JSON.stringify({ stations }),
    });
  }

  async saveMapDecorations(
    idZone: number,
    decorations: MapDecorationSavePayload[]
  ): Promise<{ saved: number; message: string }> {
    return this.request<{ saved: number; message: string }>('/api/map/decorations/save', {
      method: 'PUT',
      body: JSON.stringify({ id_zone: idZone, decorations }),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
export interface User {
    id: number;
    email: string;
    createdAt: string;
    updatedAt: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    token: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
}
export interface PingResponse {
    pong: boolean;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map
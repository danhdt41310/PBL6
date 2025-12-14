/**
 * RPC Error Interface.
 * Standard error structure for RPC communication between microservices.
 * Consistent error format sent via Redis/RPC from microservice to api-gateway.
 */
export interface IRpcError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  errorCode?: string;
  errors?: unknown[];
}

import { HttpStatusCode } from "axios";

export interface ApiResult {
  statusName: string;
  statusCode: HttpStatusCode | string;
  content: unknown;
  message?: string;
  elapsedTime: number;
}

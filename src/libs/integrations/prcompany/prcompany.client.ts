// prcompany 연동용 공통 axios 인스턴스/환경설정 모듈
import axios from "axios";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";

// prcompany base URL 정규화
export const getPrcompanyBaseUrl = () => {
  const baseUrl = process.env.SEND_URL?.trim();

  if (!baseUrl) {
    throw new AppError(500, ERROR_CODES.COMMON_500_INTERNAL, "SEND_URL is not configured");
  }

  return baseUrl.replace(/\/+$/, "");
};

// prcompany 인증 토큰(PR_AUTH_TOKEN) 검증
export const getPrcompanyAuthToken = () => {
  const token = process.env.PR_AUTH_TOKEN?.trim();

  if (!token) {
    throw new AppError(500, ERROR_CODES.COMMON_500_INTERNAL, "PR_AUTH_TOKEN is not configured");
  }

  return token;
};

// prcompany API 공통 axios 인스턴스
export const prcompanyClient = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

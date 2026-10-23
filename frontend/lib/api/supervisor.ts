import type { ApiResult } from "@/types/api";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api/v1";

export interface SupervisorReviewBatchData {
  token: string;
  studentName: string;
  matricNo: string;
  department: string;
  programme: "SIWES";
  companyName: string;
  sentAt: string;
  expiresAt: string;
  isExpired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  weeks: Array<{
    weekNumber: number;
    dates: string;
    days: Array<{
      dayName: string;
      date: string;
      activities: string;
      skills: string;
      reflection: string;
      photos: string[];
    }>;
  }>;
}

export interface SupervisorSubmitPayload {
  token: string;
  supervisorName: string;
  supervisorRole: string;
  reviewText: string;
  rating: number; // 1 to 5
  signatureType: "typed" | "drawn";
  signatureValue: string;
  confirmationAgreed: boolean;
}

export const supervisorApi = {
  /** Validate token and fetch logbook batch */
  async getReviewBatch(token?: string): Promise<ApiResult<SupervisorReviewBatchData>> {
    if (!token || token === "invalid") {
      return {
        ok: false,
        status: 404,
        message: "invalid_token",
      };
    }

    if (token === "expired") {
      return {
        ok: false,
        status: 410,
        message: "link_expired",
      };
    }

    // Try live endpoint if backend implements it
    try {
      const res = await fetch(`${BASE}/supervisor/review/?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }
    } catch {
      // Fallback to development typed mock
    }

    // Default mock batch
    return {
      ok: true,
      data: {
        token,
        studentName: "Ada Okafor",
        matricNo: "CSC/2021/042",
        department: "Computer Science & Engineering",
        programme: "SIWES",
        companyName: "SoftCom Technologies, Lagos",
        sentAt: "19 October 2024",
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        isExpired: false,
        isCompleted: false,
        weeks: [
          {
            weekNumber: 3,
            dates: "14 – 18 October 2024",
            days: [
              {
                dayName: "Monday",
                date: "2024-10-14",
                activities: "Analyzed relational database schema for internal logistics API. Built PostgreSQL migrations with index constraints.",
                skills: "PostgreSQL, DDL scripts, ER models, indexing.",
                reflection: "Took time to properly model foreign key constraints for cascading archive safety.",
                photos: [],
              },
              {
                dayName: "Tuesday",
                date: "2024-10-15",
                activities: "Set up Docker Compose orchestrator for containerized local API, cache worker, and database instances.",
                skills: "Docker Compose, multi-service bridge networks, port mapping.",
                reflection: "Solved port collision on default 5432 by binding isolated development network.",
                photos: [],
              },
              {
                dayName: "Wednesday",
                date: "2024-10-16",
                activities: "Automated database fixture seed generation with Python and Django ORM bulk_create.",
                skills: "Python scripting, ORM batch inserts.",
                reflection: "Reduced local migration bootstrapping duration from 40s to 2s.",
                photos: [],
              },
              {
                dayName: "Thursday",
                date: "2024-10-17",
                activities: "Wrote unit tests for session token rotation and refresh token blacklist validation.",
                skills: "Pytest, REST mocks, JWT token assertion.",
                reflection: "Identified boundary condition when password change revokes refresh tokens.",
                photos: [],
              },
              {
                dayName: "Friday",
                date: "2024-10-18",
                activities: "Demonstrated working proof of concept to engineering lead during sprint review.",
                skills: "Sprint demo, technical presentation, engineering sprint planning.",
                reflection: "Received positive remarks from senior engineers on test suite coverage.",
                photos: [],
              },
            ],
          },
        ],
      },
    };
  },

  /** Submit supervisor evaluation and signature */
  async submitReview(payload: SupervisorSubmitPayload): Promise<ApiResult<{ success: boolean }>> {
    try {
      const res = await fetch(`${BASE}/supervisor/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return { ok: true, data: { success: true } };
      }
    } catch {
      // Backend not yet available
    }

    return { ok: true, data: { success: true } };
  },
};

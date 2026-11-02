
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type AnalysisStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface UploadResponse {
  message: string;
  jobId: string;
  status: AnalysisStatus;
  fileName: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: AnalysisStatus;
  error: string | null;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface Warning {
  id?: number;
  warning_type: string;
  start_time: number;
  end_time: number;
  severity: string;
  confidence: number | null;
  detection_mode: string | null;
  event_count: number;
}

export interface WarningResultsResponse {
  dbJobId: number;
  jobId: string;
  status: AnalysisStatus;
  error: string | null;
  fileName: string;
  storedFileName: string;
  warnings: Warning[];
}

@Injectable({
  providedIn: 'root'
})
export class MovieApiService {

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadMovie(file: File) {
    const formData = new FormData();

    formData.append('movie', file);

    return this.http.post<UploadResponse>(
      `${this.apiUrl}/upload`,
      formData
    );
  }

  getJobStatus(jobId: string) {
    return this.http.get<JobStatusResponse>(
      `${this.apiUrl}/jobs/${jobId}/status`
    );
  }

  getWarnings(jobId: string) {
    return this.http.get<WarningResultsResponse>(
      `${this.apiUrl}/jobs/${jobId}/warnings`
    );
  }
}

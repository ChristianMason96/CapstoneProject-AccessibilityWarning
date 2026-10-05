import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UploadResponse {
  message: string;
  jobId: string;
  status: string;
  fileName?: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error: string | null;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Warning {
  warning_type: string;
  start_time: number;
  end_time: number;
  severity: string;
  confidence: number;
  detection_mode: string | null;
  event_count: number;
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
    return this.http.get<any>(
      `${this.apiUrl}/jobs/${jobId}/warnings`
    );
  }
}
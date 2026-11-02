
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  MovieApiService,
  Warning
} from '../../services/movie-api.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {

  jobId = '';

  movieName = '';

  analysisStatus = '';

  warnings: Warning[] = [];

  loading = true;

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private movieApi: MovieApiService
  ) {}

  ngOnInit(): void {
    this.jobId =
      this.route.snapshot.paramMap.get('jobId') || '';

    if (!this.jobId) {
      this.loading = false;
      this.errorMessage = 'No job ID was provided.';
      return;
    }

    this.loadResults();
  }

  loadResults(): void {
    this.movieApi
      .getWarnings(this.jobId)
      .subscribe({
        next: response => {
          this.movieName =
            response.fileName || 'Uploaded movie';

          this.analysisStatus = response.status;

          this.warnings =
            response.warnings || [];

          this.loading = false;
        },

        error: error => {
          console.error(
            'Failed to load results:',
            error
          );

          this.loading = false;
          this.analysisStatus = 'failed';

          this.errorMessage =
            error?.error?.error ||
            'Unable to load warning results.';
        }
      });
  }

  // Total number of warning segments
  get totalWarnings(): number {
    return this.warnings.length;
  }

  // Number of flash warning segments
  get flashWarnings(): number {
    return this.warnings.filter(
      warning => this.isFlash(warning.warning_type)
    ).length;
  }

  // Number of audio warning segments
  get audioWarnings(): number {
    return this.warnings.filter(
      warning => this.isAudio(warning.warning_type)
    ).length;
  }

  // Number of high-severity warning segments
  get highSeverityWarnings(): number {
    return this.warnings.filter(
      warning =>
        warning.severity?.toLowerCase() === 'high'
    ).length;
  }

  isFlash(type: string): boolean {
    if (!type) {
      return false;
    }

    const normalized = type.toLowerCase();

    return (
      normalized === 'flash' ||
      normalized === 'flashing' ||
      normalized.includes('flash')
    );
  }

  isAudio(type: string): boolean {
    if (!type) {
      return false;
    }

    const normalized = type.toLowerCase();

    return (
      normalized === 'audio_spike' ||
      normalized === 'audio' ||
      normalized.includes('audio')
    );
  }

  getWarningTitle(type: string): string {
    if (this.isFlash(type)) {
      return 'Flash Warning';
    }

    if (this.isAudio(type)) {
      return 'Audio Spike Warning';
    }

    return type || 'Accessibility Warning';
  }

  getSeverityClass(severity: string): string {
    if (!severity) {
      return 'severity-unknown';
    }

    switch (severity.toLowerCase()) {
      case 'high':
        return 'severity-high';

      case 'medium':
        return 'severity-medium';

      case 'low':
        return 'severity-low';

      default:
        return 'severity-unknown';
    }
  }

  formatTime(seconds: number): string {
    if (
      seconds === null ||
      seconds === undefined ||
      Number.isNaN(Number(seconds))
    ) {
      return '0:00';
    }

    const totalSeconds = Number(seconds);

    const minutes = Math.floor(
      totalSeconds / 60
    );

    const remainingSeconds =
      totalSeconds % 60;

    return (
      minutes +
      ':' +
      remainingSeconds
        .toFixed(2)
        .padStart(5, '0')
    );
  }

  formatConfidence(
    confidence: number | null
  ): string {
    if (confidence === null) {
      return 'N/A';
    }

    return (
      Math.round(confidence * 100) +
      '%'
    );
  }

  // Compatibility with the original results template logic
  warningTitle(type: string): string {
    return this.getWarningTitle(type);
  }
}

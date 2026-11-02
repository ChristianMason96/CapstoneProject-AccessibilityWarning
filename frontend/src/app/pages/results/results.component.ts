
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
  imports: [CommonModule, RouterLink],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {

  jobId = '';
  movieName = '';
  analysisStatus = '';

  // Only high-severity warnings with a visible
  // duration are displayed in the report.
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
    this.loading = true;
    this.errorMessage = '';

    this.movieApi.getWarnings(this.jobId).subscribe({
      next: response => {
        this.movieName =
          response.fileName || 'Uploaded movie';

        this.analysisStatus = response.status;

        // Filter warnings before displaying them.
        // All original warnings remain stored in PostgreSQL.
        this.warnings = (response.warnings || [])
          .filter(warning => {

            // Only display high-severity warnings.
            const isHighSeverity =
              (warning.severity || '')
                .trim()
                .toLowerCase() === 'high';

            // Calculate the actual duration.
            const duration =
              Number(warning.end_time) -
              Number(warning.start_time);

            // Exclude invalid durations and warnings
            // that would display as 0.0 seconds.
            const hasVisibleDuration =
              Number.isFinite(duration) &&
              Math.round(duration * 10) > 0;

            return isHighSeverity && hasVisibleDuration;
          })
          .sort((a, b) =>
            Number(a.start_time) - Number(b.start_time)
          );

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

  // Total number of displayed warnings.
  get totalWarnings(): number {
    return this.warnings.length;
  }

  // Number of displayed flash warnings.
  get flashWarnings(): number {
    return this.warnings.filter(
      warning => this.isFlash(warning.warning_type)
    ).length;
  }

  // Number of displayed audio warnings.
  get audioWarnings(): number {
    return this.warnings.filter(
      warning => this.isAudio(warning.warning_type)
    ).length;
  }

  // Number of displayed high-severity warnings.
  get highSeverityWarnings(): number {
    return this.warnings.length;
  }

  // Timestamp of the first displayed warning.
  get firstWarningTime(): string {
    if (this.warnings.length === 0) {
      return '—';
    }

    return this.formatTime(
      this.warnings[0].start_time
    );
  }

  // Identify flash warnings.
  isFlash(type: string): boolean {
    if (!type) {
      return false;
    }

    return type.toLowerCase().includes('flash');
  }

  // Identify audio warnings.
  isAudio(type: string): boolean {
    if (!type) {
      return false;
    }

    return type.toLowerCase().includes('audio');
  }

  // Display user-friendly warning titles.
  getWarningTitle(type: string): string {
    if (this.isFlash(type)) {
      return 'Possible Flashing Visuals';
    }

    if (this.isAudio(type)) {
      return 'Possible Sudden Audio Spike';
    }

    return 'Possible Accessibility Warning';
  }

  // Return the correct CSS class for severity.
  getSeverityClass(severity: string): string {
    switch ((severity || '').toLowerCase()) {

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

  // Convert seconds into minutes:seconds.
  formatTime(seconds: number): string {
    if (
      seconds === null ||
      seconds === undefined ||
      !Number.isFinite(Number(seconds))
    ) {
      return '0:00';
    }

    const total = Math.max(
      0,
      Number(seconds)
    );

    const minutes = Math.floor(total / 60);
    const remaining = total % 60;

    return (
      minutes +
      ':' +
      remaining.toFixed(2).padStart(5, '0')
    );
  }

  // Format model confidence as a percentage.
  formatConfidence(
    confidence: number | null
  ): string {
    if (
      confidence === null ||
      !Number.isFinite(Number(confidence))
    ) {
      return 'N/A';
    }

    return `${(Number(confidence) * 100).toFixed(1)}%`;
  }

  // Compatibility with the original results template.
  warningTitle(type: string): string {
    return this.getWarningTitle(type);
  }
}

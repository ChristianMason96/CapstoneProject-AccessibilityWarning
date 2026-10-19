import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
  warnings: Warning[] = [];
  loading = true;
  errorMessage = '';

  movieName = '';
  analysisStatus = '';

  constructor(
    private route: ActivatedRoute,
    private movieApi: MovieApiService
  ) {}

  ngOnInit(): void {
    this.jobId =
      this.route.snapshot.paramMap.get('jobId') || '';

    this.movieApi.getWarnings(this.jobId).subscribe({
      next: response => {
        this.warnings = (response.warnings || [])
          .sort(
            (a: Warning, b: Warning) =>
              a.start_time - b.start_time
          );

        this.movieName =
          response.original_filename || 'Movie Analysis';

        this.analysisStatus = response.status || '';

        this.loading = false;
      },

      error: error => {
        console.error('Unable to load results:', error);
        this.loading = false;
        this.errorMessage =
          'Unable to load accessibility results. Please try again.';
      }
    });
  }

  get totalWarnings(): number {
    return this.warnings.length;
  }

  get flashWarnings(): number {
    return this.warnings.filter(w =>
      this.isFlash(w.warning_type)
    ).length;
  }

  get audioWarnings(): number {
    return this.warnings.filter(w =>
      this.isAudio(w.warning_type)
    ).length;
  }

  get highSeverityWarnings(): number {
    return this.warnings.filter(w =>
      w.severity?.toLowerCase() === 'high'
    ).length;
  }

  isFlash(type: string): boolean {
    return /flash|visual|light/i.test(type || '');
  }

  isAudio(type: string): boolean {
    return /audio|sound|noise|volume/i.test(type || '');
  }

  getWarningTitle(type: string): string {
    if (this.isFlash(type)) {
      return 'Flashing Visuals';
    }

    if (this.isAudio(type)) {
      return 'Sudden Audio Spike';
    }

    return (type || 'Accessibility Event')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '00:00';
    }

    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;

    const pad = (value: number) =>
      String(value).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    }

    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  }

  getSeverityClass(severity: string): string {
    const value = (severity || '').toLowerCase();

    if (value === 'high') return 'severity-high';
    if (value === 'medium') return 'severity-medium';
    if (value === 'low') return 'severity-low';

    return 'severity-unknown';
  }
}

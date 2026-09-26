import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import { MovieApiService } from '../../services/movie-api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent implements OnDestroy {

  selectedFile: File | null = null;

  jobId: string | null = null;

  status = '';

  errorMessage = '';

  uploading = false;

  private statusSubscription?: Subscription;

  constructor(
    private movieApi: MovieApiService,
    private router: Router
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.errorMessage = '';
    }
  }

  uploadMovie() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a movie.';
      return;
    }

    this.uploading = true;
    this.status = 'Uploading...';
    this.errorMessage = '';

    this.movieApi.uploadMovie(this.selectedFile).subscribe({
      next: response => {

        this.jobId = response.jobId;
        this.status = response.status || 'queued';

        this.startStatusPolling();

      },

      error: error => {

        console.error(error);

        this.uploading = false;
        this.status = '';

        this.errorMessage =
          error?.error?.error ||
          'Movie upload failed.';
      }
    });
  }

  private startStatusPolling() {

    if (!this.jobId) {
      return;
    }

    this.statusSubscription = timer(0, 2000)
      .pipe(
        switchMap(() =>
          this.movieApi.getJobStatus(this.jobId!)
        ),

        takeWhile(
          response =>
            response.status !== 'completed' &&
            response.status !== 'failed',
          true
        )
      )
      .subscribe({

        next: response => {

          this.status = response.status;

          if (response.status === 'completed') {

            this.uploading = false;

            this.router.navigate([
              '/results',
              this.jobId
            ]);
          }

          if (response.status === 'failed') {

            this.uploading = false;

            this.errorMessage =
              response.error ||
              'Movie processing failed.';
          }
        },

        error: error => {

          console.error(error);

          this.uploading = false;

          this.errorMessage =
            'Unable to check job status.';
        }
      });
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
  }
}
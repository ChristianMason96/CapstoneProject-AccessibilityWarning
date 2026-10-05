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

  errorType:
    | 'validation'
    | 'upload'
    | 'processing'
    | 'connection'
    | '' = '';

  uploading = false;

  private statusSubscription?: Subscription;

  constructor(
    private movieApi: MovieApiService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      return;
    }

    const file = input.files[0];

    // Basic validation: only allow video files
    if (!file.type.startsWith('video/')) {
      this.selectedFile = null;

      this.errorType = 'validation';
      this.errorMessage =
        'Please select a valid video file.';

      // Clear the file input
      input.value = '';

      return;
    }

    // Valid file selected
    this.selectedFile = file;

    // Clear any previous errors
    this.errorType = '';
    this.errorMessage = '';

    // Clear previous job information
    this.jobId = null;
    this.status = '';
  }

  uploadMovie(): void {

    // Prevent upload without a selected movie
    if (!this.selectedFile) {
      this.errorType = 'validation';
      this.errorMessage =
        'Please select a movie before starting the analysis.';
      return;
    }

    // Cancel any previous polling subscription
    this.statusSubscription?.unsubscribe();

    // Clear previous errors
    this.errorType = '';
    this.errorMessage = '';

    this.uploading = true;
    this.status = 'Uploading...';
    this.jobId = null;

    this.movieApi
      .uploadMovie(this.selectedFile)
      .subscribe({

        next: response => {

          this.jobId = String(response.jobId);

          this.status =
            response.status || 'queued';

          this.startStatusPolling();
        },

        error: error => {

          console.error(
            'Movie upload failed:',
            error
          );

          this.uploading = false;
          this.status = '';

          // status 0 usually means Angular could not
          // connect to the backend at all
          if (error.status === 0) {

            this.errorType = 'connection';

            this.errorMessage =
              'Cannot connect to the server. Please make sure the backend is running and try again.';

            return;
          }

          // Backend responded, but upload failed
          this.errorType = 'upload';

          this.errorMessage =
            error?.error?.error ||
            'Movie upload failed. Please try again.';
        }
      });
  }

  private startStatusPolling(): void {

    if (!this.jobId) {
      return;
    }

    // Stop any previous polling before starting a new one
    this.statusSubscription?.unsubscribe();

    this.statusSubscription = timer(0, 2000)
      .pipe(

        switchMap(() =>
          this.movieApi.getJobStatus(this.jobId!)
        ),

        // Continue polling until the job is either
        // completed or failed.
        // "true" includes the final response.
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

          // Successful processing
          if (response.status === 'completed') {

            this.uploading = false;

            this.errorType = '';
            this.errorMessage = '';

            this.router.navigate([
              '/results',
              this.jobId
            ]);

            return;
          }

          // Worker / Python processing failure
          if (response.status === 'failed') {

            this.uploading = false;

            this.errorType = 'processing';

            this.errorMessage =
              response.error ||
              'Movie processing failed. Please try another file.';

            return;
          }
        },

        error: error => {

          console.error(
            'Job status request failed:',
            error
          );

          this.uploading = false;

          // Backend cannot be reached
          if (error.status === 0) {

            this.errorType = 'connection';

            this.errorMessage =
              'Unable to connect to the server while checking the movie status.';

            return;
          }

          // Backend responded but status request failed
          this.errorType = 'connection';

          this.errorMessage =
            error?.error?.error ||
            'Unable to retrieve the processing status. Please try again.';
        }
      });
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
  }
}
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
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {

  jobId = '';

  warnings: Warning[] = [];

  loading = true;

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private movieApi: MovieApiService
  ) {}

  ngOnInit() {

    this.jobId =
      this.route.snapshot.paramMap.get('jobId') || '';

    this.movieApi
      .getWarnings(this.jobId)
      .subscribe({

        next: response => {

          this.warnings =
            response.warnings || [];

          this.loading = false;
        },

        error: error => {

          console.error(error);

          this.loading = false;

          this.errorMessage =
            'Unable to load warning results.';
        }
      });
  }
}
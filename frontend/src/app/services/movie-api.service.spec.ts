
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { MovieApiService } from './movie-api.service';
import { environment } from '../../environments/environment';

describe('MovieApiService', () => {
  let service: MovieApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MovieApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(MovieApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('uploads using the movie multipart field', () => {
    const movie = new File(
      ['test'],
      'test.mp4',
      { type: 'video/mp4' }
    );

    service.uploadMovie(movie).subscribe(response => {
      expect(response.jobId).toBe('movie-1');
    });

    const req = http.expectOne(
      `${environment.apiUrl}/upload`
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();

    expect(
      (req.request.body as FormData).get('movie')
    ).toBe(movie);

    req.flush({
      message: 'queued',
      jobId: 'movie-1',
      status: 'queued',
      fileName: 'test.mp4'
    });
  });

  it('requests job status by ID', () => {
    service.getJobStatus('movie-7').subscribe(response => {
      expect(response.status).toBe('completed');
    });

    const req = http.expectOne(
      `${environment.apiUrl}/jobs/movie-7/status`
    );

    expect(req.request.method).toBe('GET');

    req.flush({
      jobId: 'movie-7',
      status: 'completed',
      error: null
    });
  });

  it('requests the warnings report by ID', () => {
    service.getWarnings('movie-7').subscribe(response => {
      expect(response.fileName).toBe('test.mp4');
    });

    const req = http.expectOne(
      `${environment.apiUrl}/jobs/movie-7/warnings`
    );

    expect(req.request.method).toBe('GET');

    req.flush({
      dbJobId: 7,
      jobId: 'movie-7',
      status: 'completed',
      error: null,
      fileName: 'test.mp4',
      storedFileName: 'saved.mp4',
      warnings: []
    });
  });
});

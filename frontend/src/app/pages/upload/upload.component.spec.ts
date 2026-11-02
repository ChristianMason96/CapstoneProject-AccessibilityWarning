
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UploadComponent } from './upload.component';
import { MovieApiService } from '../../services/movie-api.service';

describe('UploadComponent', () => {
  beforeEach(async () => {
    const api = jasmine.createSpyObj<MovieApiService>(
      'MovieApiService',
      ['uploadMovie', 'getJobStatus']
    );

    api.uploadMovie.and.returnValue(
      of({
        message: 'queued',
        jobId: 'movie-1',
        status: 'queued' as const,
        fileName: 'test.mp4'
      })
    );

    api.getJobStatus.and.returnValue(
      of({
        jobId: 'movie-1',
        status: 'completed' as const,
        error: null
      })
    );

    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [
        provideRouter([]),
        {
          provide: MovieApiService,
          useValue: api
        }
      ]
    }).compileComponents();
  });

  it('shows a validation error if no movie is selected', () => {
    const fixture = TestBed.createComponent(UploadComponent);

    fixture.componentInstance.uploadMovie();
    fixture.detectChanges();

    expect(
      fixture.componentInstance.errorType
    ).toBe('validation');

    expect(
      fixture.nativeElement.querySelector('[role="alert"]')
    ).not.toBeNull();
  });
});

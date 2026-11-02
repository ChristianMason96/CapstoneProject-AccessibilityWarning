
import { TestBed } from '@angular/core/testing';

import {
  provideRouter,
  ActivatedRoute,
  convertToParamMap
} from '@angular/router';

import { of } from 'rxjs';

import { ResultsComponent } from './results.component';
import { MovieApiService } from '../../services/movie-api.service';

describe('ResultsComponent', () => {
  it('shows the movie name and warning summary from the API', async () => {
    const api = jasmine.createSpyObj<MovieApiService>(
      'MovieApiService',
      ['getWarnings']
    );

    api.getWarnings.and.returnValue(
      of({
        dbJobId: 5,
        jobId: 'movie-5',
        status: 'completed' as const,
        error: null,
        fileName: 'clip.mp4',
        storedFileName: 'stored.mp4',
        warnings: [
          {
            warning_type: 'flash',
            start_time: 1,
            end_time: 2,
            severity: 'high',
            confidence: 0.9,
            detection_mode: 'ml_model',
            event_count: 2
          }
        ]
      })
    );

    await TestBed.configureTestingModule({
      imports: [ResultsComponent],
      providers: [
        provideRouter([]),
        {
          provide: MovieApiService,
          useValue: api
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                jobId: 'movie-5'
              })
            }
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ResultsComponent);

    fixture.detectChanges();

    expect(
      fixture.componentInstance.movieName
    ).toBe('clip.mp4');

    expect(
      fixture.componentInstance.totalWarnings
    ).toBe(1);

    expect(
      fixture.componentInstance.highSeverityWarnings
    ).toBe(1);

    expect(
      fixture.nativeElement.textContent
    ).toContain('clip.mp4');
  });
});

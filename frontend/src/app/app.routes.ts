import { Routes } from '@angular/router';

import { UploadComponent } from './pages/upload/upload.component';
import { ResultsComponent } from './pages/results/results.component';

export const routes: Routes = [
  {
    path: '',
    component: UploadComponent
  },
  {
    path: 'results/:jobId',
    component: ResultsComponent
  }
];
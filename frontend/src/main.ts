import { bootstrapApplication } from '@angular/platform-browser';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

jeepSqlite(window);

bootstrapApplication(AppComponent, appConfig).catch(console.error);

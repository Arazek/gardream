import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonButton,
  IonFab, IonFabButton, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

import { ExampleActions } from '../../store/example.actions';
import { selectAllItems, selectLoading } from '../../store/example.selectors';

@Component({
  selector: 'app-example-list',
  standalone: true,
  imports: [
    AsyncPipe, RouterLink,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel,
    IonFab, IonFabButton, IonIcon, IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Items</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading$ | async) {
        <ion-spinner name="crescent" />
      }

      <ion-list>
        @for (item of items$ | async; track item.id) {
          <ion-item [routerLink]="[item.id]" button detail>
            <ion-label>
              <h2>{{ item.title }}</h2>
              <p>{{ item.description }}</p>
            </ion-label>
          </ion-item>
        }
      </ion-list>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="createItem()">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class ExampleListPage implements OnInit {
  items$ = this.store.select(selectAllItems);
  loading$ = this.store.select(selectLoading);

  constructor(private store: Store) {
    addIcons({ add });
  }

  ngOnInit(): void {
    this.store.dispatch(ExampleActions.loadItems());
  }

  createItem(): void {
    this.store.dispatch(
      ExampleActions.createItem({ title: 'New Item', description: 'Description' }),
    );
  }
}

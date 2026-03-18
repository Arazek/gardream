import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonBackButton, IonButtons, IonButton,
} from '@ionic/angular/standalone';

import { ExampleActions } from '../../store/example.actions';
import { selectSelectedItem } from '../../store/example.selectors';

@Component({
  selector: 'app-example-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonBackButton, IonButtons, IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/example" />
        </ion-buttons>
        <ion-title>{{ (item$ | async)?.title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button color="danger" (click)="delete()">Delete</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (item$ | async; as item) {
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      }
    </ion-content>
  `,
})
export class ExampleDetailPage implements OnInit {
  item$ = this.store.select(selectSelectedItem);

  constructor(
    private store: Store,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(ExampleActions.selectItem({ id }));
  }

  delete(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(ExampleActions.deleteItem({ id }));
  }
}

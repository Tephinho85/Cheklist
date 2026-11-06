import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { 
  IonApp, 
  IonRouterOutlet, 
  IonMenu, 
  IonHeader, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonMenuToggle 
} from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonApp, 
    IonRouterOutlet, 
    IonMenu, 
    IonHeader, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonMenuToggle
  ],
})
export class AppComponent {}
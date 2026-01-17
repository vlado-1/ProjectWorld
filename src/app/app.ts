import { Component, signal } from '@angular/core';
import { World } from "./features/Globe/world/world";
import { Popup } from "./features/Globe/popup/popup";

@Component({
  selector: 'app-root',
  imports: [World, Popup],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ProjectWorld');
}

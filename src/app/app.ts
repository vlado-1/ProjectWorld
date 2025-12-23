import { Component, signal } from '@angular/core';
import { World } from "./features/Globe/world/world";

@Component({
  selector: 'app-root',
  imports: [World],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ProjectWorld');
}

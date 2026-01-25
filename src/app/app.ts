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

  ngAfterViewInit(): void {
  this.generateStarfield('stars', 500);
  }

  generateStarfield(elementId: string, starCount: number): void {
    const starElement = document.getElementById(elementId);
    let boxShadowValue = "";

    for (let i = 0; i < starCount; i++) {
      // Generate random coordinates within 2000px (covers most screens)
      const x = Math.floor(Math.random() * 2000);
      const y = Math.floor(Math.random() * 2000);
      
      // Create the shadow string: "Xpx Ypx #Color"
      boxShadowValue += `${x}px ${y}px #FFF`;
      
      // Add a comma if it's not the last star
      if (i < starCount - 1) {
        boxShadowValue += ", ";
      }
    }
    // Apply the giant string to the box-shadow property
    if (starElement !== null)
      starElement.style.boxShadow = boxShadowValue;
  }
}

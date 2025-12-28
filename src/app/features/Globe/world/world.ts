import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RunOnInitDirective } from '../../../core/Directives/run-on-init-directive';

@Component({
  selector: 'app-world',
  imports: [CommonModule, RunOnInitDirective],
  templateUrl: './world.html',
  styleUrl: './world.css'
})
export class World {
  private sphere:       HTMLElement | null = null;
  private popup:        HTMLElement | null = null;
  private popupTitle:   HTMLElement | null = null;
  private popupContent: HTMLElement | null = null;

  public pointsData: Object[] = [];

  private radius: number        = 210;
  private points: HTMLElement[] = [];

  public rotationY:       number = 0;
  public targetRotationY: number = 0;

  // Need two variables to create each point: point data (p) + point element reference (pointRef)
  createPoint(couple: any): void {

          var p = couple.p;
          var pointRef = couple.pointRef;

          const phi = (90 - p.lat) * Math.PI / 180;
          const theta = p.lon * Math.PI / 180;

          const x = this.radius * Math.sin(phi) * Math.cos(theta);
          const y = this.radius * Math.cos(phi);
          const z = this.radius * Math.sin(phi) * Math.sin(theta);

          pointRef.dataset['x'] = x.toString();
          pointRef.dataset['y'] = y.toString();
          pointRef.dataset['z'] = z.toString();

          pointRef.onclick = (e: any) => {
            e.stopPropagation();
            if (this.popupTitle !== null)
              this.popupTitle.textContent = p.title;
            if (this.popupContent !== null)
              this.popupContent.textContent = p.text;
            if (this.popup !== null)
              this.popup.style.display = this.popup.style.display === 'block' ? 'none' : 'block';
          };

          if (p.img !== undefined) {
            const imgElem = document.createElement('img');
            imgElem.src = p.img;
            imgElem.style.backgroundColor = 'white';
            imgElem.style.width = '30px';
            imgElem.style.height = '30px';

            pointRef.appendChild(imgElem);
          }

          this.sphere?.appendChild(pointRef);
          this.points.push(pointRef);    
  }

  closePopup(): void {
    if (this.popup !== null)
      this.popup.style.display = 'none';
  }


  updatePoints(rotationYDeg: number): void {
    const ry = rotationYDeg * Math.PI / 720;
    this.points.forEach((point: any) => {
      const x = +point.dataset['x'];
      const y = +point.dataset['y'];
      const z = +point.dataset['z'];

      const x1 = x * Math.cos(ry) - z * Math.sin(ry);
      const z1 = x * Math.sin(ry) + z * Math.cos(ry);

      if (z1 <= 0) {
        point.style.display = 'none';
        return;
      }

      /* Add rotation to the image  */
      if (point.children.length > 0) {
        var angleY = -(Math.PI / 2) + Math.atan2(z1, x1);
        (<HTMLElement>(point.children[0])).style.transform = `rotateY(${angleY}rad)`;

        var angleX = Math.asin(y / Math.sqrt(x1 * x1 + y * y + z1 * z1));
        (<HTMLElement>(point.children[0])).style.transform += ` rotateX(${angleX }rad)`;
      }

      point.style.display = 'block';
      point.style.transform = `translate3d(${x1 + 200}px, ${y + 200}px, ${z1}px)`;
    });
  }

  // Smooth animation loop
  animate(): void {
    this.rotationY += (this.targetRotationY - this.rotationY) * 0.1; // easing factor
    this.updatePoints(this.rotationY);
    requestAnimationFrame(() => {this.animate()});
  }

  ngAfterViewInit(): void {
    // Need the below DOM elements to exist before I can get them.
    this.sphere       = document.getElementById('sphere');
    this.popup        = document.getElementById('popup');
    this.popupTitle   = document.getElementById('popup-title');
    this.popupContent = document.getElementById('popup-content');


    this.animate();

    // Scroll-based rotation input
    window.addEventListener('wheel', (e: any) => {
      this.targetRotationY += e.deltaY * 0.5;
    });

    // Mouse drag rotation input
    let dragging = false;
    let lastX = 0;
    document.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; });
    document.addEventListener('mouseup', () => dragging = false);
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      this.targetRotationY += (e.clientX - lastX) * 0.5;
      lastX = e.clientX;
    });

    this.updatePoints(0);
  }

  constructor() {
  
    this.pointsData =  [ 
                         { lat: 0, lon: 0, title: 'Unity Development', text: 'Completed a unity junior developer course, and developed some beginner level games using the Unity Game Engine.', img: './assets/images/Unity.svg' },
                         { lat: 30, lon: 60, title: 'Bravura Solutions', text: 'Work on maintaining and enhancing a desktop application for funds administration.', img: './assets/images/Bravura.png' },
                         { lat: -40, lon: 120, title: 'Website Development', text: 'Developed this dynamic website using Angular and SQLite.', img: './assets/images/Website.ico' },
                         { lat: 10, lon: 200, title: 'University', text: 'Completed a bachelor and masters degree majoring in computer science and software development respectively.', img: './assets/images/University.png' },
                        ];
  }

}

import { Component } from '@angular/core';

@Component({
  selector: 'app-world',
  imports: [],
  templateUrl: './world.html',
  styleUrl: './world.css',
})
export class World {
  private sphere:       HTMLElement | null = document.getElementById('sphere');
  private popup:        HTMLElement | null = document.getElementById('popup');
  private popupTitle:   HTMLElement | null = document.getElementById('popup-title');
  private popupContent: HTMLElement | null = document.getElementById('popup-content');

  private pointsData: Object[];

  private radius: number   = 180;
  private points: Object[] = [];

  private rotationY:       number = 0;
  private targetRotationY: number = 0;

  createPoints(): void {
    this.pointsData.forEach((p: any) => {
          const point = document.createElement('div');
          point.className = 'point';

          const phi = (90 - p.lat) * Math.PI / 180;
          const theta = p.lon * Math.PI / 180;

          const x = this.radius * Math.sin(phi) * Math.cos(theta);
          const y = this.radius * Math.cos(phi);
          const z = this.radius * Math.sin(phi) * Math.sin(theta);

          point.dataset['x'] = x.toString();
          point.dataset['y'] = y.toString();
          point.dataset['z'] = z.toString();

          point.onclick = e => {
            e.stopPropagation();
            if (this.popupTitle !== null)
              this.popupTitle.textContent = p.title;
            if (this.popupContent !== null)
              this.popupContent.textContent = p.text;
            if (this.popup !== null)
              this.popup.style.display = 'block';
          };

          this.sphere?.appendChild(point);
          this.points.push(point);    
    });
  }

  closePopup(): void {
    if (this.popup !== null)
      this.popup.style.display = 'none';
  }


  updatePoints(rotationYDeg: number): void {
    const ry = rotationYDeg * Math.PI / 180;
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

      point.style.display = 'block';
      point.style.transform = `translate3d(${x1 + 200}px, ${y + 200}px, ${z1}px)`;
    });
  }

  // Smooth animation loop
  animate(): void {
    this.rotationY += (this.targetRotationY - this.rotationY) * 0.1; // easing factor
    this.updatePoints(this.rotationY);
    requestAnimationFrame(this.animate);
  }

  constructor() {
    this.pointsData =  [ 
                         { lat: 0, lon: 0, title: 'Equator', text: 'This point sits on the equator.' },
                         { lat: 30, lon: 60, title: 'Northern Point', text: 'A point in the northern hemisphere.' },
                         { lat: -40, lon: 120, title: 'Southern Point', text: 'A point in the southern hemisphere.' },
                         { lat: 10, lon: 200, title: 'Eastern Point', text: 'Located further east.' },
                         { lat: -20, lon: 300, title: 'Western Point', text: 'Located further west.' }
                        ];

    this.animate();

    // Scroll-based rotation input
    window.addEventListener('wheel', e => {
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

    this.createPoints();
    this.updatePoints(0);
  }
}

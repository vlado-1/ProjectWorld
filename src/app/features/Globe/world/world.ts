import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-world',
  imports: [CommonModule],
  templateUrl: './world.html',
  styleUrls: ['./world.css']
})
export class World implements AfterViewInit {
  @ViewChild('globeCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private globe!: THREE.Mesh;
  private markers: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  public pointsData: any[] = [];

  private radius: number = 210;
  public rotationY: number = 0;
  public targetRotationY: number = 0;

  private popup: HTMLElement | null = null;
  private popupTitle: HTMLElement | null = null;
  private popupContent: HTMLElement | null = null;

  constructor() {
    this.pointsData = [
      { lat: 0, lon: 0, title: 'Unity Development', text: 'Completed a unity junior developer course, and developed some beginner level games using the Unity Game Engine.', img: 'assets/images/Unity.svg' },
      { lat: 30, lon: 60, title: 'Bravura Solutions', text: 'Work on maintaining and enhancing a desktop application for funds administration.', img: 'assets/images/Bravura.png' },
      { lat: -40, lon: 120, title: 'Website Development', text: 'Developed this dynamic website using Angular and SQLite.', img: 'assets/images/Website.png' },
      { lat: 10, lon: 200, title: 'University', text: 'Completed a bachelor and masters degree majoring in computer science and software development respectively.', img: 'assets/images/University.png' },
    ];
  }

  ngAfterViewInit(): void {
    this.popup = document.getElementById('popup');
    this.popupTitle = document.getElementById('popup-title');
    this.popupContent = document.getElementById('popup-content');

    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // Ensure correct color space for nicer brightness
    const colorEncoding = (THREE as any).sRGBEncoding ?? (THREE as any).SRGBColorSpace ?? undefined;
    if (colorEncoding !== undefined) (this.renderer as any).outputEncoding = colorEncoding;

    this.scene = new THREE.Scene();

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 400;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    this.camera.position.set(0, 0, this.radius * 2.2);

    // Lights (brighter default + subtle hemisphere fill)
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x11111a, 0.25);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 3, 5);
    this.scene.add(ambient, hemi, dir);

    // Globe
    const globeGeo = new THREE.SphereGeometry(this.radius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({ color: 0x0f3d6e, roughness: 1.0, metalness: 0.0 });
    this.globe = new THREE.Mesh(globeGeo, globeMat);
    this.scene.add(this.globe);

    // Instead of separate textured spheres, paint the images directly onto the globe texture
    const texWidth = 2048;
    const texHeight = 1024;
    const canvasTex = document.createElement('canvas');
    canvasTex.width = texWidth;
    canvasTex.height = texHeight;
    const ctx = canvasTex.getContext('2d')!;

    // Fill a simple base (you can replace with an Earth texture later)
    const g = ctx.createLinearGradient(0, 0, 0, texHeight);
    g.addColorStop(0, '#07203a');
    g.addColorStop(1, '#041220');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, texWidth, texHeight);

    const canvasTexture = new THREE.CanvasTexture(canvasTex);
    // color space for canvas
    if (colorEncoding !== undefined) (canvasTexture as any).encoding = colorEncoding;
    canvasTexture.anisotropy = (this.renderer && (this.renderer.capabilities as any)?.getMaxAnisotropy ? (this.renderer.capabilities as any).getMaxAnisotropy() : 4);
    (this.globe.material as any).map = canvasTexture;
    // brighten marker areas slightly by using the same canvas as emissive map
    (this.globe.material as any).emissiveMap = canvasTexture;
    (this.globe.material as any).emissive = new THREE.Color(0xffffff);
    (this.globe.material as any).emissiveIntensity = 0.6;
    (this.globe.material as any).needsUpdate = true;

    // Helper: create invisible pickable markers that sit on the globe and rotate with it
    this.pointsData.forEach((p, idx) => {
      // compute UV mapping from lat/lon
      const lon = ((p.lon % 360) + 360) % 360; // normalize
      const u = lon / 360;
      const v = (90 - p.lat) / 180;
      const px = Math.round(u * texWidth);
      const py = Math.round(v * texHeight);

      // draw a soft drop-shadow and circular background, then paint the image clipped to the circle
      const markerSize = 64; // pixels
      const shadowRadius = markerSize * 0.6;
      const shadowY = py + markerSize * 0.15; // slightly offset downward for natural shadow
      const grad = ctx.createRadialGradient(px, shadowY, 0, px, shadowY, shadowRadius);
      grad.addColorStop(0, 'rgba(0,0,0,0.35)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(px, shadowY, shadowRadius, 0, Math.PI * 2);
      ctx.fill();

      // white circular plate
      ctx.beginPath();
      ctx.arc(px, py, markerSize * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.fill();
      ctx.closePath();

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const s = markerSize;
        ctx.save();
        // clip to circle for soft rounded image
        ctx.beginPath();
        ctx.arc(px, py, markerSize * 0.55, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, px - s/2, py - s/2, s, s);

        // brighten the center slightly with a radial light overlay
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const highlight = ctx.createRadialGradient(px, py, 0, px, py, s * 0.6);
        highlight.addColorStop(0, 'rgba(255,255,255,0.22)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(px, py, s * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // subtle outline
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.arc(px, py, markerSize * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        canvasTexture.needsUpdate = true; 
      };
      img.onerror = (err) => { console.error('failed to load marker image', p.img, err); };
      img.src = p.img;

        // Create a small invisible sphere for picking, add as child of globe so it rotates with globe
      const phi = (90 - p.lat) * Math.PI / 180;
      const theta = p.lon * Math.PI / 180;
      const x = (this.radius + 1) * Math.sin(phi) * Math.cos(theta);
      const y = (this.radius + 1) * Math.cos(phi);
      const z = (this.radius + 1) * Math.sin(phi) * Math.sin(theta);

      const pickGeo = new THREE.SphereGeometry(22, 12, 12); // larger sphere for more reliable picking
      const pickMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0 });
      const pickMesh = new THREE.Mesh(pickGeo, pickMat);
      pickMesh.name = `pick-${idx}`;
      pickMesh.position.set(x, y, z);
      (pickMesh as any).userData = { title: p.title, text: p.text, lat: p.lat, lon: p.lon, px, py };
      this.globe.add(pickMesh);
      this.markers.push(pickMesh);
      // debug log of pick mesh world position
      const wp = new THREE.Vector3();
      pickMesh.getWorldPosition(wp);
      console.log(`pickMesh ${pickMesh.name} created at world ${wp.toArray().map(n=>n.toFixed(1)).join(', ')} (px ${px}, py ${py})`);
    });
    canvasTexture.needsUpdate = true;
    // Events
    window.addEventListener('resize', () => this.onWindowResize());

    canvas.addEventListener('pointerdown', (e: PointerEvent) => this.onPointerDown(e));
    canvas.addEventListener('pointermove', (e: PointerEvent) => this.onPointerMove(e));
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', () => { this.isPointerDown = false; this.pointerMoved = false; });
    canvas.addEventListener('wheel', 
      (e: WheelEvent) => { 
        this.targetRotationY += e.deltaY * 0.0005;
      }, 
      { passive: true }
    );

    this.onWindowResize();
    this.animate();
  }

  private onWindowResize() {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 400;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  private isPointerDown = false;
  private lastX = 0;
  private lastY = 0;
  private pointerMoved = false;
  private clickMoveThreshold = 5;

  private onPointerDown(e: PointerEvent) {
    this.isPointerDown = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.pointerMoved = false;
    (e.target as HTMLElement).setPointerCapture((e as any).pointerId);
  }

  private onPointerMove(e: PointerEvent) {
    // rotation when dragging
    if (!this.isPointerDown) {
      // update mouse for hover/click detection even if not dragging
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return;
    }

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    if (!this.pointerMoved && Math.hypot(dx, dy) > this.clickMoveThreshold) {
      this.pointerMoved = true;
    }

    if (this.pointerMoved) {
      this.targetRotationY += dx * 0.005;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    }

    // update mouse for hover/click detection
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  // pointerup should end drag and also handle clicks (we treat click on pointerup)
  private onPointerUp = (e: PointerEvent) => {
    if (this.isPointerDown) {
      const wasMoved = this.pointerMoved;
      this.isPointerDown = false;
      this.pointerMoved = false;
      if (!wasMoved) {
        this.performPick(e);
      }
      return;
    }
    this.performPick(e);
  };

  private performPick(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('performPick - mouse', this.mouse);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    console.log('performPick - ray origin', this.raycaster.ray.origin, 'dir', this.raycaster.ray.direction);

    // First try direct intersection with pick meshes
    let intersects = this.raycaster.intersectObjects(this.markers, true);
    console.log('performPick - intersects:', intersects.length, intersects.map(i => i.object.name || i.object.uuid));

    // Fallback: if nothing hit, intersect the globe and find the nearest pick mesh by distance
    if (intersects.length === 0) {
      const globeHits = this.raycaster.intersectObject(this.globe, false);
      console.log('performPick - globeHits:', globeHits.length);
      if (globeHits.length > 0) {
        const hitPoint = globeHits[0].point;

        // Try screen-space nearest marker (more robust when pick spheres miss)
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mousePixelX = (this.mouse.x * 0.5 + 0.5) * rect.width + rect.left;
        const mousePixelY = (-this.mouse.y * 0.5 + 0.5) * rect.height + rect.top;
        let bestMesh: any = undefined;
        let bestPxDist = Infinity;
        const pxThreshold = 40; // pixels

        this.markers.forEach((m:any, i:number) => {
          const wp = new THREE.Vector3();
          m.getWorldPosition(wp);
          const projected = wp.clone().project(this.camera);
          // check if projected point is in front of camera
          if (projected.z > 1) return;
          const px = (projected.x * 0.5 + 0.5) * rect.width + rect.left;
          const py = (-projected.y * 0.5 + 0.5) * rect.height + rect.top;
          const pd = Math.hypot(px - mousePixelX, py - mousePixelY);
          console.log(`performPick - marker ${m.name || i} screen px (${px.toFixed(1)},${py.toFixed(1)}) distPx ${pd.toFixed(1)}`);
          if (pd < bestPxDist) { bestPxDist = pd; bestMesh = m; }
        });

        if (bestMesh !== undefined && bestPxDist <= pxThreshold) {
          console.log('performPick - nearest marker by screen distance', bestMesh.name, 'distPx', bestPxDist);
          intersects = [{ object: bestMesh, point: hitPoint } as any];
        } else {
          // fallback to world-space nearest marker if screen-space didn't find a close one
          let bestDist: number = Infinity;
          this.markers.forEach((m:any) => {
            const wp = new THREE.Vector3();
            m.getWorldPosition(wp);
            const d = wp.distanceTo(hitPoint);
            if (d < bestDist) { bestDist = d; bestMesh = m; }
          });
          if (bestMesh !== undefined && bestDist < 200) { // larger fallback threshold
            console.log('performPick - fallback nearest marker by world distance', bestMesh.name, 'dist', bestDist);
            intersects = [{ object: bestMesh, point: hitPoint } as any];
          }
        }
      }
    }

    if (intersects.length > 0) {
      const m = intersects[0].object as any;
      const ud = m.userData || {};
      console.log('performPick - hit', m.name, ud);
      if (this.popupTitle) this.popupTitle.textContent = ud.title || '';
      if (this.popupContent) this.popupContent.textContent = ud.text || '';

      if (this.popup) {
        // place popup near click
        const screenPos = (intersects[0].point || new THREE.Vector3()).clone().project(this.camera);
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
        const y = ( -screenPos.y * 0.5 + 0.5) * rect.height + rect.top;
        this.popup.style.left = `${x}px`;
        this.popup.style.top = `${y}px`;
        this.popup.classList.add('visible');
      }
    }
  }

  closePopup(): void {
    if (this.popup) this.popup.classList.remove('visible');
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    // smooth rotation
    this.rotationY += (this.targetRotationY - this.rotationY) * 0.1;
    this.globe.rotation.y = this.rotationY;
    this.render();
  };

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

}

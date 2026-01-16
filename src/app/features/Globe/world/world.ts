import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Events, Main, PerspectiveCameraAuto } from '@three.ez/main';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';


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
  private main: Main | null = null;

  public pointsData: any[] = [];

  private radius: number = 118;
  public rotationY: number = 0;
  public targetRotationY: number = 0;

  private popup: HTMLElement | null = null;
  private popupTitle: HTMLElement | null = null;
  private popupContent: HTMLElement | null = null;

  /* Due to click event firing on canvas and popup simultaneously when
     close button pressed, the popup is closed and then re-opened.
     Need a variable 'close' to know if marker should really open popup or
     was accidentally fired when user presses close button. */
  private popupState: string = 'closed';

  constructor() {
    this.pointsData = [
      { lat: 5, lon: 5, title: 'Unity Development', text: 'Completed a unity junior developer course, and developed some beginner level games using the Unity Game Engine.', img: 'assets/images/Unity.svg' },
      { lat: 30, lon: 60, title: 'Bravura Solutions', text: 'Work on maintaining and enhancing a desktop application for funds administration.', img: 'assets/images/Bravura.png' },
      { lat: -30, lon: 120, title: 'Website Development', text: 'Developed this dynamic website using Angular and SQLite.', img: 'assets/images/Website.png' },
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

    this.camera = new PerspectiveCameraAuto(50, 0.1,2000);
    this.camera.position.set(0, 0, 280);

    // Lights (brighter default + subtle hemisphere fill)
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x11111a, 0.25);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 3, 5);
    this.scene.add(ambient, hemi, dir);

    // Globe
    const globeGeo = new THREE.SphereGeometry(this.radius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({ color: 0x0e1c39a1, roughness: 1.0, metalness: 0.0 });
    this.globe = new THREE.Mesh(globeGeo, globeMat);
    this.globe.on('animate', () => {            
      this.rotationY += (this.targetRotationY - this.rotationY) * 0.1;
      this.globe.rotation.y = this.rotationY;
   });
   this.globe.on('wheel',       (e: any) => { 
        this.targetRotationY += e.deltaY * 0.0005;
      }
   );

    this.scene.add(this.globe);

    // // Helper: create invisible pickable markers that sit on the globe and rotate with it
    this.pointsData.forEach((p: any) => {
      
      // 1. Create the texture
      const loader = new THREE.TextureLoader();
      const markerTex = loader.load(p.img);

      const pos = this.latLonToVector3(p.lat, p.lon, this.radius + 0.2); // +0.2 to avoid z-fighting

      // We need an orientation (Euler or Quaternion) for the projection box
    const dummy = new THREE.Object3D();
    dummy.position.copy(pos);
    dummy.lookAt(new THREE.Vector3(0, 0, 0)); // Look at center
    dummy.rotateY(Math.PI); // Rotate 180 degrees around Z to face outward
    const orientation = dummy.rotation;

    // 2. Create Decal Geometry
    // Parameters: (mesh, position, orientation, sizeVector)
    const size = new THREE.Vector3(30,30,30); // The size of the projection box
    const decalGeo = new DecalGeometry(this.globe, pos, orientation, size);

    // 3. Create Material
    const decalMat = new THREE.MeshBasicMaterial({
        map: markerTex,
        depthTest: true,
        depthWrite: false, // Prevents glitches when multiple decals overlap
        polygonOffset: true, // Crucial: pushes the decal slightly "above" the globe surface
        polygonOffsetFactor: -4, 
    });

      const marker = new THREE.Mesh(decalGeo, decalMat);

      // 3. Make the marker look at that target
      marker.on('click', (e: any) => {
        console.log(this.popupState);
        if (this.popupState === 'button closed') {
          this.popupState = 'closed';
          return;
        }

        if (this.popup != null) {
          this.popup.classList.add('visible');
          this.popupState = 'open';

          if (this.popupTitle != null) {
            this.popupTitle.textContent = p.title;
          }
          if (this.popupContent != null) {
            this.popupContent.textContent = p.text;
          }
        }
      })
      this.globe.add(marker); // It will now rotate with the globe

    });
      
    this.scene.activeSmartRendering();

    // need to supply the renderer to Main for it to manage the render loop
    this.main = new Main({renderer: this.renderer, fullscreen: false, rendererParameters: { canvas, antialias: true, alpha: true }});
    this.main.createView({ 
      scene: this.scene, 
      camera: this.camera, 
    }); // create the view to be rendered


  }

  /**
   * Converts Lat/Lon to a 3D Vector3
   * @param {number} lat - Latitude in degrees (-90 to 90)
   * @param {number} lon - Longitude in degrees (-180 to 180)
   * @param {number} radius - The radius of your globe
   */
  latLonToVector3(lat: number, lon: number, radius: number) {
      // 1. Convert degrees to radians
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      // 2. Calculate coordinates
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      return new THREE.Vector3(x, y, z);
  }

  closePopup(e: MouseEvent): void {
      this.popup?.classList.remove('visible');
              console.log("Closing: " + this.popupState);

      this.popupState = 'button closed';
  }
}

import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { PopupToggle } from '../../../core/Services/popup-toggle';
import { SqliteDb } from '../../../core/Services/sqlite-db';


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

  private popupToggle: PopupToggle;
  private sqldb: SqliteDb;

  constructor(private pt: PopupToggle, private db: SqliteDb) {
    this.popupToggle = pt;
    this.sqldb = db;
  }

  ngAfterViewInit(): void {

    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();

    // Values arrived at from trial and error
    this.camera = new PerspectiveCameraAuto(50, 0.1,2000);
    this.camera.position.set(0, 0, 280);

    // To achieve a "Sun in Space" look, you need to move away from flat, even lighting (like AmbientLight) and move toward high-contrast, directional lighting. In space, there is no atmosphere to scatter light, so shadows are harsh, black, and distinct.11. The "Sun": Use a Single Strong Directional LightIn your current code, you have multiple lights ($Ambient$, $Hemisphere$, $Directional$). To mimic the sun, the Directional Light should do 90% of the work.TypeScript// 1. Remove or drastically lower the Ambient Light
    // Space is black; ambient light should be near zero.
    const ambient = new THREE.AmbientLight(0xffffff, 0.05); 

    // Setup the Sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5); // High intensity
    sunLight.position.set(100, 50, 100); // Coming from a far angle
    this.scene.add(sunLight, ambient);

    // Sky color (slight blue) and Ground color (very dark/black)
    const earthShine = new THREE.HemisphereLight(0x4488ff, 0x000000, 0.2);
    this.scene.add(earthShine);

    // Globe
    const globeGeo = new THREE.SphereGeometry(this.radius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({ color: 0x0e1c39a1, roughness: 1.0, metalness: 0.0 });
    this.globe = new THREE.Mesh(globeGeo, globeMat);

    this.globe.on('animate', () => {         
      this.targetRotationY += 0.005; // Auto-rotate   
      this.rotationY += (this.targetRotationY - this.rotationY) * 0.1;
      this.globe.rotation.y = this.rotationY;
    });
    document.addEventListener('wheel', (e: any) => {
      this.targetRotationY += e.deltaY * 0.0005;
      if (e.deltaY < 0) {
        this.targetRotationY -= 0.007;
      }
    });

    this.scene.add(this.globe);

    this.createMarkers();
      
    // need to supply the renderer to Main for it to manage the render loop
    this.main = new Main({renderer: this.renderer, fullscreen: false, rendererParameters: { canvas, antialias: true, alpha: true }});
    this.main.createView({ 
      scene: this.scene, 
      camera: this.camera, 
    }); // create the view to be rendered
    
    // Remove screen performance stats
    this.main.showStats = false;
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

  createMarkers() {

    this.sqldb.getProjects().then((projects: any[]) => {
      console.log("Loaded projects from database:");
      this.pointsData = projects[0].values.map((row: any) => 
        Object.fromEntries(projects[0].columns.map((col: any, i: any) => [col, row[i]]))
      );
      console.log(this.pointsData);
      // Convert each point into a marker on the globe.
      this.pointsData.forEach((p: any) => {
        
        // Create a texture for each point, that displays associated image
        const loader = new THREE.TextureLoader();
        const markerTex = loader.load(p.img);

        // Convert point longitude/latitude coordinates to x,y,z coordinates.
        const pos = this.latLonToVector3(p.lat, p.lon, this.radius + 1); // +1 to avoid z-fighting

      /* Create Decal Geometry for texture.
          The term "decal" is short for "decalcomania," a technique that involves 
          transferring designs from one surface to another (i.e. 2D to sphere in this case). 
          - wikipedia */

        // Determine x,y,z rotation so object faces away for sphere centered at origin.
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(new THREE.Vector3(0, 0, 0)); // Look at center
        dummy.rotateY(Math.PI); // Rotate 180 degrees around Z to face outward
        const orientation = dummy.rotation;

        const size = new THREE.Vector3(60,60,60); // The size of the projection box
        const decalGeo = new DecalGeometry(this.globe, pos, orientation, size);
        const decalMat = new THREE.MeshBasicMaterial({
            map: markerTex,
            transparent: true,
            depthTest: true,
            depthWrite: false, // Prevents glitches when multiple decals overlap
            polygonOffset: true, // Crucial: pushes the decal slightly "above" the globe surface
            polygonOffsetFactor: -4, 
        });

        const marker = new THREE.Mesh(decalGeo, decalMat);

        // Add click event which spawns popup
        marker.on('click', (e: any) => {
          this.popupToggle.togglePopup({title: p.title, content: p.text, visible: true});
        })

        // Add texture to globe so it rotates with it
        this.globe.add(marker);
      });

    }).catch((error) => {
      console.error("Error loading projects from database:", error);
    });


  }
}

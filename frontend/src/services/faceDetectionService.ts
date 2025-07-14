import * as faceapi from 'face-api.js';
import { employeeService, type Employee } from './employeeService';
import { attendanceService } from './attendanceService';

// Get the correct API base URL using the same logic as api.ts
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || (
    import.meta.env.MODE === 'production' 
      ? '/api'  // Production: Use relative path
      : 'http://localhost:5001/api'  // Development: Use localhost
  );
};

interface DetectedFace {
  id: string;
  employee_id: string;
  name: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: Date;
}

interface FaceEncodingData {
  employee_id: string;
  name: string;
  face_encoding: number[];
}

interface SafetyCheck {
  hasHelmet: boolean;
  hasVest: boolean;
  violations: string[];
  status: 'compliant' | 'minor_violation' | 'major_violation' | 'critical' | 'no_person_detected' | 'system_error';
}

interface DetectionResult {
  faces: DetectedFace[];
  safety: SafetyCheck;
  timestamp: Date;
}

// Face detection result type from face-api.js
interface FaceDetectionResult {
  descriptor: Float32Array;
  detection: {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

class FaceDetectionService {
  private modelsLoaded = false;
  private employees: Employee[] = [];
  private employeeFaceDescriptors: Map<string, Float32Array> = new Map();
  private attendanceMarkedToday: Set<string> = new Set();
  private canvas: HTMLCanvasElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private detectionInterval: NodeJS.Timeout | null = null;
  private isDetecting = false;

  // Event callbacks
  private onFaceDetectedCallback?: (face: DetectedFace) => void;
  private onSafetyEventCallback?: (safety: SafetyCheck) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.initializeModels();
  }

  // Initialize face-api.js models
  private async initializeModels(): Promise<void> {
    try {
      console.log('Loading face detection models...');
      
      // Load models from CDN
      const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
        faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
      ]);

      this.modelsLoaded = true;
      console.log('Face detection models loaded successfully');
      
      // Load employee data
      await this.loadEmployeeData();
      
    } catch (error) {
      console.error('Error loading face detection models:', error);
      this.onErrorCallback?.('Failed to load face detection models');
    }
  }

  // Load employee data and generate face descriptors
  private async loadEmployeeData(): Promise<void> {
    try {
      console.log('Loading employee data...');
      this.employees = await employeeService.getAllEmployees();
      
      // Load real face encodings from backend
      try {
        const response = await fetch(`${getApiBaseUrl()}/employees/face-encodings`);
        if (response.ok) {
          const faceData = await response.json();
          
          // Clear existing descriptors
          this.employeeFaceDescriptors.clear();
          
          // Load real face encodings
          faceData.forEach((emp: FaceEncodingData) => {
            if (emp.face_encoding && emp.face_encoding.length === 128) {
              const descriptor = new Float32Array(emp.face_encoding);
              this.employeeFaceDescriptors.set(emp.employee_id, descriptor);
            }
          });
          
          console.log(`Loaded ${this.employeeFaceDescriptors.size} employees with real face encodings`);
        } else {
          console.warn('Failed to load face encodings from backend, using mock data');
          this.loadMockDescriptors();
        }
      } catch (error) {
        console.warn('Error loading face encodings, using mock data:', error);
        this.loadMockDescriptors();
      }
      
      // Load today's attendance
      await this.loadTodayAttendance();
      
    } catch (error) {
      console.error('Error loading employee data:', error);
      this.onErrorCallback?.('Failed to load employee data');
    }
  }

  // Fallback method to create mock descriptors
  private loadMockDescriptors(): void {
    this.employees.forEach(employee => {
      // For demo, create mock descriptors for all employees
      const mockDescriptor = new Float32Array(128);
      for (let i = 0; i < 128; i++) {
        mockDescriptor[i] = Math.random() * 2 - 1; // Random values between -1 and 1
      }
      this.employeeFaceDescriptors.set(employee.employee_id, mockDescriptor);
    });
    console.log(`Created ${this.employeeFaceDescriptors.size} mock face descriptors`);
  }

  // Load today's attendance to prevent duplicate marking
  private async loadTodayAttendance(): Promise<void> {
    try {
      // Check attendance for each employee
      for (const employee of this.employees) {
        try {
          const hasAttendance = await attendanceService.checkTodayAttendance(employee.employee_id);
          if (hasAttendance) {
            this.attendanceMarkedToday.add(employee.employee_id);
          }
        } catch {
          console.warn(`Could not check attendance for ${employee.employee_id}`);
        }
      }
      
      console.log(`${this.attendanceMarkedToday.size} employees already marked attendance today`);
      
    } catch (error) {
      console.error('Error loading today\'s attendance:', error);
    }
  }

  // Start camera and face detection
  async startDetection(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.modelsLoaded) {
      throw new Error('Face detection models not loaded yet');
    }

    try {
      // Get user media
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      this.videoElement = videoElement;
      this.videoElement.srcObject = this.stream;
      
      // Create canvas for drawing
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.videoElement.videoWidth || 1280;
      this.canvas.height = this.videoElement.videoHeight || 720;

      // Wait for video to load
      await new Promise<void>((resolve) => {
        this.videoElement!.onloadedmetadata = () => {
          this.canvas!.width = this.videoElement!.videoWidth;
          this.canvas!.height = this.videoElement!.videoHeight;
          resolve();
        };
      });

      // Start detection loop
      this.isDetecting = true;
      this.startDetectionLoop();

      console.log('Face detection started successfully');
      
    } catch (error) {
      console.error('Error starting face detection:', error);
      this.onErrorCallback?.('Failed to access camera');
      throw error;
    }
  }

  // Stop detection and cleanup
  stopDetection(): void {
    this.isDetecting = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    console.log('Face detection stopped');
  }

  // Main detection loop
  private startDetectionLoop(): void {
    const detectFaces = async () => {
      if (!this.isDetecting || !this.videoElement || !this.canvas) return;

      try {
        // Detect faces with landmarks and descriptors
        const detections = await faceapi
          .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          const results = await this.processFaceDetections(detections as FaceDetectionResult[]);
          
          // Trigger callbacks for detected faces
          results.faces.forEach(face => {
            this.onFaceDetectedCallback?.(face);
          });

          // Trigger safety event callback
          this.onSafetyEventCallback?.(results.safety);
        } else {
          // Even if no faces detected, still perform safety checks
          const safety = await this.performSafetyChecks();
          this.onSafetyEventCallback?.(safety);
        }

      } catch (error) {
        console.error('Detection error:', error);
      }
    };

    // Run detection every 2 seconds (to reduce CPU load)
    this.detectionInterval = setInterval(detectFaces, 2000);
  }

  // Process detected faces and match with employees
  private async processFaceDetections(detections: FaceDetectionResult[]): Promise<DetectionResult> {
    const faces: DetectedFace[] = [];
    const timestamp = new Date();

    for (const detection of detections) {
      const { descriptor, detection: faceDetection } = detection;
      const box = faceDetection.box;

      // Find best match among employees
      let bestMatch: { employee_id: string; name: string; distance: number } | null = null;
      let minDistance = 0.6; // Threshold for face recognition

      for (const [employeeId, storedDescriptor] of this.employeeFaceDescriptors) {
        const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);
        
        if (distance < minDistance) {
          minDistance = distance;
          const employee = this.employees.find(emp => emp.employee_id === employeeId);
          if (employee) {
            bestMatch = {
              employee_id: employeeId,
              name: employee.name,
              distance
            };
          }
        }
      }

      if (bestMatch) {
        const confidence = Math.max(0, Math.min(1, 1 - bestMatch.distance));
        
        const detectedFace: DetectedFace = {
          id: `face_${Date.now()}_${Math.random()}`,
          employee_id: bestMatch.employee_id,
          name: bestMatch.name,
          confidence,
          bbox: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          },
          timestamp
        };

        faces.push(detectedFace);

        // Mark attendance if not already marked today
        if (!this.attendanceMarkedToday.has(bestMatch.employee_id)) {
          await this.markAttendance(bestMatch.employee_id, confidence);
          this.attendanceMarkedToday.add(bestMatch.employee_id);
        }
      } else {
        // Unknown person detected
        const unknownFace: DetectedFace = {
          id: `unknown_${Date.now()}_${Math.random()}`,
          employee_id: 'UNKNOWN',
          name: 'Unknown Person',
          confidence: 0,
          bbox: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          },
          timestamp
        };

        faces.push(unknownFace);
      }
    }

    // Perform safety checks
    const safety = await this.performSafetyChecks();

    return {
      faces,
      safety,
      timestamp
    };
  }

  // Mark attendance via backend API
  private async markAttendance(employeeId: string, confidence: number): Promise<void> {
    try {
      await attendanceService.markAttendance(employeeId, confidence);

      console.log(`Attendance marked for employee ${employeeId} with confidence ${confidence.toFixed(2)}`);
      
    } catch (error) {
      console.error(`Failed to mark attendance for ${employeeId}:`, error);
    }
  }

  // Perform real-time safety checks using backend computer vision
  private async performSafetyChecks(): Promise<SafetyCheck> {
    try {
      // Get current frame from video element
      if (!this.videoElement || !this.canvas) {
        return this.getDefaultSafetyCheck();
      }

      // Capture current frame to canvas
      const context = this.canvas.getContext('2d');
      if (!context) {
        return this.getDefaultSafetyCheck();
      }

      // Draw current video frame to canvas
      context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      
      // Convert canvas to blob and send to backend for safety analysis
      const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
      
      // Send frame to backend for safety analysis
      const response = await fetch(`${getApiBaseUrl()}/safety/analyze-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frame_data: imageData })
      });

      if (response.ok) {
        const safetyResult = await response.json();
        return {
          hasHelmet: safetyResult.hasHelmet || false,
          hasVest: safetyResult.hasVest || false,
          violations: safetyResult.violations || [],
          status: safetyResult.safety_status || 'compliant'
        };
      } else {
        console.warn('Safety analysis failed, using default');
        return this.getDefaultSafetyCheck();
      }
      
    } catch (error) {
      console.error('Error performing safety checks:', error);
      return this.getDefaultSafetyCheck();
    }
  }

  // Default safety check when real analysis fails
  private getDefaultSafetyCheck(): SafetyCheck {
    return {
      hasHelmet: false,
      hasVest: false,
      violations: ['Safety system unavailable'],
      status: 'critical'
    };
  }

  // Get detection canvas for overlay rendering
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  // Get current video dimensions
  getVideoDimensions(): { width: number; height: number } {
    return {
      width: this.canvas?.width || 0,
      height: this.canvas?.height || 0
    };
  }

  // Event listeners
  onFaceDetected(callback: (face: DetectedFace) => void): void {
    this.onFaceDetectedCallback = callback;
  }

  onSafetyEvent(callback: (safety: SafetyCheck) => void): void {
    this.onSafetyEventCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // Get status
  isModelsLoaded(): boolean {
    return this.modelsLoaded;
  }

  isRunning(): boolean {
    return this.isDetecting;
  }

  getEmployeeCount(): number {
    return this.employees.length;
  }

  getAttendanceMarkedCount(): number {
    return this.attendanceMarkedToday.size;
  }

  // Reload employee data and face encodings
  async reloadEmployeeData(): Promise<void> {
    await this.loadEmployeeData();
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();
export type { DetectedFace, SafetyCheck, DetectionResult }; 
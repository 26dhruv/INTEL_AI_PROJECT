import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Square,
  Play,
  User,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Users,
  Clock,
  Settings,
  RotateCcw,
  Loader,
  XCircle,
  Activity
} from 'lucide-react';
import { faceDetectionService, type DetectedFace, type SafetyCheck } from '../services/faceDetectionService';

interface DetectionEvent {
  id: string;
  type: 'face' | 'safety';
  employee_id: string;
  name?: string;
  message: string;
  confidence?: number;
  violations?: string[];
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Camera Feed Component with JavaScript face detection
function CameraFeedComponent({ 
  isActive, 
  onDetection,
  onSafetyEvent,
  onError 
}: { 
  isActive: boolean;
  onDetection: (face: DetectedFace) => void;
  onSafetyEvent: (safety: SafetyCheck) => void;
  onError: (error: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'initializing' | 'loading' | 'running' | 'error' | 'stopped'>('stopped');
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const overlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize face detection when activated
  useEffect(() => {
    if (isActive && videoRef.current) {
      startDetection();
    } else if (!isActive) {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [isActive]);

  // Set up face detection callbacks
  useEffect(() => {
    const handleFaceDetected = (face: DetectedFace) => {
      setDetectedFaces(prev => {
        const updated = [face, ...prev.slice(0, 9)]; // Keep last 10 detections
        // Use setTimeout to avoid setState during render
        setTimeout(() => onDetection(face), 0);
        return updated;
      });
    };

    const handleSafetyEvent = (safety: SafetyCheck) => {
      setTimeout(() => onSafetyEvent(safety), 0);
    };

    const handleError = (error: string) => {
      setStatus('error');
      setTimeout(() => onError(error), 0);
    };

    faceDetectionService.onFaceDetected(handleFaceDetected);
    faceDetectionService.onSafetyEvent(handleSafetyEvent);
    faceDetectionService.onError(handleError);
  }, [onDetection, onSafetyEvent, onError]);

  const startDetection = async () => {
    if (!videoRef.current) return;

    try {
      setStatus('initializing');
      
      // Check if models are loaded
      if (!faceDetectionService.isModelsLoaded()) {
        setStatus('loading');
        // Wait for models to load
        const checkModels = setInterval(() => {
          if (faceDetectionService.isModelsLoaded()) {
            clearInterval(checkModels);
            startDetection(); // Retry
          }
        }, 1000);
        return;
      }

      // Start detection
      await faceDetectionService.startDetection(videoRef.current);
      setStatus('running');
      
      // Start overlay drawing
      startOverlayDrawing();
      
      console.log('JavaScript face detection started successfully');
      
    } catch (error) {
      console.error('Error starting face detection:', error);
      setStatus('error');
      onError('Failed to start camera: ' + (error as Error).message);
    }
  };

  const stopDetection = () => {
    faceDetectionService.stopDetection();
    setStatus('stopped');
    setDetectedFaces([]);
    
    if (overlayIntervalRef.current) {
      clearInterval(overlayIntervalRef.current);
      overlayIntervalRef.current = null;
    }
  };

  // Draw face detection overlays
  const startOverlayDrawing = () => {
    if (overlayIntervalRef.current) {
      clearInterval(overlayIntervalRef.current);
    }

    overlayIntervalRef.current = setInterval(() => {
      drawOverlays();
    }, 100); // 10 FPS overlay updates
  };

  const drawOverlays = () => {
    if (!overlayCanvasRef.current || !videoRef.current) return;

    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face detection boxes
    detectedFaces.forEach((face) => {
      const { bbox, name, confidence, employee_id } = face;
      
      // Scale coordinates to canvas size
      const scaleX = canvas.width / (video.videoWidth || video.clientWidth);
      const scaleY = canvas.height / (video.videoHeight || video.clientHeight);
      
      const x = bbox.x * scaleX;
      const y = bbox.y * scaleY;
      const width = bbox.width * scaleX;
      const height = bbox.height * scaleY;

      // Choose color based on confidence and employee status
      let color: string;
      if (employee_id === 'UNKNOWN') {
        color = '#ef4444'; // Red for unknown
      } else if (confidence > 0.8) {
        color = '#22c55e'; // Green for high confidence
      } else if (confidence > 0.5) {
        color = '#f59e0b'; // Orange for medium confidence
      } else {
        color = '#ef4444'; // Red for low confidence
      }

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${name} (${Math.round(confidence * 100)}%)`;
      ctx.font = '16px Arial';
      const textMetrics = ctx.measureText(label);
      const textHeight = 20;
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y - textHeight - 5, textMetrics.width + 10, textHeight + 5);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(label, x + 5, y - 8);

      // Draw status indicator
      if (employee_id !== 'UNKNOWN') {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + width - 20, y + 5, 15, 15);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('✓', x + width - 18, y + 16);
      }
    });

    // Draw system info overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 100);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Status: ${status}`, 20, 30);
    ctx.fillText(`Faces Detected: ${detectedFaces.length}`, 20, 50);
    ctx.fillText(`Employees: ${faceDetectionService.getEmployeeCount()}`, 20, 70);
    ctx.fillText(`Attendance: ${faceDetectionService.getAttendanceMarkedCount()}`, 20, 90);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
      case 'initializing':
        return <Loader className="h-8 w-8 animate-spin text-primary-400" />;
      case 'running':
        return <Activity className="h-8 w-8 text-success-400 animate-pulse" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-danger-400" />;
      default:
        return <Camera className="h-8 w-8 text-primary-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'initializing':
        return 'Initializing camera...';
      case 'loading':
        return 'Loading AI models...';
      case 'running':
        return 'Face detection active';
      case 'error':
        return 'Camera error';
      default:
        return 'Camera offline';
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover rounded-lg ${
          status === 'running' ? 'opacity-100' : 'opacity-60'
        } transition-opacity duration-300`}
        style={{ display: isActive ? 'block' : 'none' }}
      />

      {/* Detection Overlay Canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
        style={{ display: status === 'running' ? 'block' : 'none' }}
      />

      {/* Status Overlay */}
      {(!isActive || status !== 'running') && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90 rounded-lg">
          <div className="text-center">
            {getStatusIcon()}
            <p className="text-primary-200 font-medium mt-2">{getStatusMessage()}</p>
            {status === 'loading' && (
              <p className="text-primary-300 text-sm mt-1">Please wait, this may take a moment...</p>
            )}
          </div>
        </div>
      )}

      {/* Live Indicator */}
      {status === 'running' && (
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-success-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
            LIVE AI
          </div>
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Detection Counter */}
      {status === 'running' && detectedFaces.length > 0 && (
        <div className="absolute top-4 right-4">
          <div className="bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
            {detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''} detected
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ isActive, label }: { isActive: boolean; label: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'} ${isActive ? 'animate-pulse' : ''}`}></div>
      <span className={`text-sm font-medium ${isActive ? 'text-green-700' : 'text-red-700'}`}>
        {label}
      </span>
    </div>
  );
}

function DetectionCard({ event }: { event: DetectionEvent }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getIcon = (type: string, severity: string) => {
    if (type === 'safety') {
      return severity === 'critical' || severity === 'high' 
        ? <AlertTriangle className="h-5 w-5 text-red-600" />
        : <ShieldCheck className="h-5 w-5 text-yellow-600" />;
    }
    return <User className="h-5 w-5 text-blue-600" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-lg border-l-4 ${getSeverityColor(event.severity)} mb-3`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getIcon(event.type, event.severity)}
          <div>
            <p className="font-medium text-gray-900">{event.message}</p>
            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
              <span>ID: {event.employee_id}</span>
              {event.name && <span>• {event.name}</span>}
              {event.confidence && (
                <span>• Confidence: {(event.confidence * 100).toFixed(1)}%</span>
              )}
            </div>
            {event.violations && event.violations.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Violations:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.violations.map((violation, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                    >
                      {violation}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
          <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
            {event.severity}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LiveStats({ events }: { events: DetectionEvent[] }) {
  const last24Hours = events.filter(event => 
    Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000
  );

  const faceDetections = last24Hours.filter(event => event.type === 'face').length;
  const safetyViolations = last24Hours.filter(event => 
    event.type === 'safety' && event.violations && event.violations.length > 0
  ).length;
  const uniqueEmployees = new Set(last24Hours.map(event => event.employee_id)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="metric-card"
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{faceDetections}</p>
            <p className="text-sm text-primary-200">Face Detections (24h)</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="metric-card"
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-secondary-500 to-secondary-600">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{safetyViolations}</p>
            <p className="text-sm text-primary-200">Safety Violations (24h)</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="metric-card"
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-success-500 to-success-600">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{uniqueEmployees}</p>
            <p className="text-sm text-primary-200">Unique Employees</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LiveMonitoring() {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const eventIdCounter = useRef(0);

  // Handle face detection events
  const handleFaceDetection = (face: DetectedFace) => {
    const detectionEvent: DetectionEvent = {
      id: `face-${++eventIdCounter.current}`,
      type: 'face',
      employee_id: face.employee_id,
      name: face.name,
      message: `Face detected: ${face.name}`,
      confidence: face.confidence,
      timestamp: face.timestamp,
      severity: 'low'
    };

    setEvents(prev => [detectionEvent, ...prev.slice(0, 99)]); // Keep last 100 events
  };

  // Handle safety events
  const handleSafetyEvent = (safety: SafetyCheck) => {
    const severity = getSeverityFromStatus(safety.status);
    const detectionEvent: DetectionEvent = {
      id: `safety-${++eventIdCounter.current}`,
      type: 'safety',
      employee_id: 'SYSTEM',
      message: `Safety ${safety.violations.length > 0 ? 'violation' : 'check'}: ${safety.status}`,
      violations: safety.violations,
      timestamp: new Date(),
      severity
    };

    setEvents(prev => [detectionEvent, ...prev.slice(0, 99)]);
  };

  const getSeverityFromStatus = (status: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (status) {
      case 'critical': return 'critical';
      case 'major_violation': return 'high';
      case 'minor_violation': return 'medium';
      default: return 'low';
    }
  };

  // Start monitoring
  const startMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);
      
      setIsRunning(true);
      
      console.log('JavaScript-based monitoring started');
      
    } catch (error) {
      console.error('Error starting monitoring:', error);
      setError('Failed to start monitoring: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Stop monitoring  
  const stopMonitoring = async () => {
    try {
      setLoading(true);
      
      setIsRunning(false);
      
      console.log('JavaScript-based monitoring stopped');
      
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      setError('Failed to stop monitoring');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="card-glass rounded-2xl p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Live Monitoring</h1>
              <p className="text-primary-200 text-lg mb-4">
                JavaScript-powered face recognition and safety monitoring
              </p>
               <div className="flex items-center space-x-6 text-sm">
                 <div className="flex items-center space-x-2">
                   <div className={`w-3 h-3 rounded-full animate-pulse ${
                     isRunning ? 'bg-success-400' : 'bg-danger-400'
                   }`}></div>
                   <span className={`font-medium ${
                     isRunning ? 'text-success-300' : 'text-danger-300'
                   }`}>
                     AI System {isRunning ? 'Active' : 'Inactive'}
                   </span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Users className="h-4 w-4 text-primary-300" />
                   <span className="text-primary-200">
                     {events.filter(e => e.type === 'face').length} Face{events.filter(e => e.type === 'face').length !== 1 ? 's' : ''} Detected
                   </span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Clock className="h-4 w-4 text-primary-300" />
                   <span className="text-primary-200">
                     {faceDetectionService.getAttendanceMarkedCount()} Attendance{faceDetectionService.getAttendanceMarkedCount() !== 1 ? 's' : ''} Today
                   </span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <ShieldCheck className="h-4 w-4 text-primary-300" />
                   <span className="text-primary-200">
                     {faceDetectionService.getEmployeeCount()} Registered Employee{faceDetectionService.getEmployeeCount() !== 1 ? 's' : ''}
                   </span>
                 </div>
               </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              <div className="text-center lg:text-right">
                <p className="text-primary-200 text-sm font-medium">Detection Accuracy</p>
                <p className="text-2xl font-bold text-white">
                  {faceDetectionService.isModelsLoaded() ? '95.8%' : 'Loading...'}
                </p>
                <p className="text-primary-300 text-sm">JavaScript AI Models</p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={isRunning ? stopMonitoring : startMonitoring}
                disabled={loading}
                className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <RotateCcw className="h-5 w-5 animate-spin mr-2" />
                ) : isRunning ? (
                  <Square className="h-5 w-5 mr-2" />
                ) : (
                  <Play className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Processing...' : isRunning ? 'Stop Monitoring' : 'Start Monitoring'}
              </motion.button>
              
              {!faceDetectionService.isModelsLoaded() && (
                <div className="flex items-center space-x-2 text-primary-300 text-sm">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Loading AI models...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </button>
              <button className="btn-secondary">
                <RotateCcw className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Camera Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="card-glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Live Camera Feed</h3>
              <StatusIndicator 
                isActive={isRunning && faceDetectionService.isRunning()} 
                label={isRunning && faceDetectionService.isRunning() ? "Recording" : "Stopped"} 
              />
            </div>
            
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <CameraFeedComponent
                isActive={isRunning}
                onDetection={handleFaceDetection}
                onSafetyEvent={handleSafetyEvent}
                onError={(error) => {
                  setError(error);
                  console.error('Camera error:', error);
                }}
              />
            </div>
            
            <LiveStats events={events} />
          </div>
        </motion.div>

        {/* Detection Events */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="card-glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Real-time Detections</h3>
              <span className="text-primary-300 text-sm">{events.length} events</span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No detections yet</p>
                  <p className="text-gray-500 text-sm">Start monitoring to see real-time events</p>
                </div>
              ) : (
                <AnimatePresence>
                  {events.map((event) => (
                    <DetectionCard key={event.id} event={event} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
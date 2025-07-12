import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CameraIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  UsersIcon
} from 'lucide-react';

// Import API services
import { employeeService, type Employee, type EmployeeRegistrationData } from '../services/employeeService';
import { faceDetectionService } from '../services/faceDetectionService';

interface EmployeeFormData {
  employee_id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  face_image?: string;
}

function CameraCapture({ onCapture, onClose }: { onCapture: (imageData: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md mx-auto shadow-2xl"
        >
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-danger-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Camera Error</h3>
            <p className="text-primary-200 mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-2xl w-full mx-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Capture Employee Photo</h3>
          <button
            onClick={onClose}
            className="p-2 text-primary-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-80 bg-slate-800 border border-white/20 rounded-xl object-cover shadow-lg"
          />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-xl backdrop-blur-sm">
              <div className="text-center">
                <LoaderIcon className="h-8 w-8 animate-spin text-primary-400 mx-auto mb-2" />
                <p className="text-primary-200 text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Camera overlay for better UX */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">Position face in center</span>
              </div>
              {isStreaming && (
                <div className="bg-success-500/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-sm text-primary-300">
            Make sure the photo is clear and well-lit
          </p>
          
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all duration-200 font-medium"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 font-medium shadow-lg flex items-center space-x-2"
            >
              <CameraIcon className="h-4 w-4" />
              <span>Capture Photo</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EmployeeForm({ 
  employee, 
  onSubmit, 
  onCancel,
  loading = false 
}: { 
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_id: employee?.employee_id || '',
    name: employee?.name || '',
    department: employee?.department || '',
    position: employee?.position || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
  });
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id.trim()) newErrors.employee_id = 'Employee ID is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.position.trim()) newErrors.position = 'Position is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!employee && !capturedImage) {
      newErrors.face_image = 'Photo is required for new employees';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        face_image: capturedImage || undefined
      });
    }
  };

  const handleCapturePhoto = (imageData: string) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    setErrors(prev => ({ ...prev, face_image: '' }));
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {employee ? 'Edit Employee Profile' : 'Register New Employee'}
              </h2>
              <p className="text-primary-200">
                {employee ? 'Update employee information and permissions' : 'Add a new team member to the workforce monitoring system'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-primary-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              disabled={loading}
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Photo Section */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CameraIcon className="h-5 w-5 mr-2 text-primary-400" />
                    Employee Photo
                  </h3>
                  
                  {/* Photo Display Area */}
                  <div className="flex flex-col items-center space-y-4">
                    {capturedImage ? (
                      <div className="relative group">
                        <img
                          src={capturedImage}
                          alt="Employee photo"
                          className="w-32 h-32 rounded-xl object-cover border-2 border-primary-400/50 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setCapturedImage(null)}
                          className="absolute -top-2 -right-2 bg-danger-500 hover:bg-danger-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-primary-400/50 rounded-xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                        <CameraIcon className="h-8 w-8 text-primary-400 mb-2" />
                        <span className="text-xs text-primary-300 text-center">No photo captured</span>
                      </div>
                    )}

                    {/* Camera Button */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCamera(true)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={loading}
                    >
                      <CameraIcon className="h-4 w-4" />
                      <span className="font-medium">
                        {capturedImage ? 'Retake Photo' : 'Capture Photo'}
                      </span>
                    </motion.button>

                    {!employee && (
                      <p className="text-xs text-primary-300 text-center">
                        <span className="text-accent-400">*</span> Photo required for face recognition
                      </p>
                    )}
                    
                    {errors.face_image && (
                      <p className="text-danger-400 text-xs text-center">{errors.face_image}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Columns - Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Personal Information Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-primary-400" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employee ID */}
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Employee ID <span className="text-accent-400">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                        <input
                          type="text"
                          value={formData.employee_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                            errors.employee_id ? 'border-danger-400 focus:ring-danger-500' : 'border-white/20'
                          }`}
                          placeholder="EMP001"
                          disabled={!!employee || loading}
                        />
                      </div>
                      {errors.employee_id && <p className="text-danger-400 text-xs mt-1">{errors.employee_id}</p>}
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Full Name <span className="text-accent-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                          errors.name ? 'border-danger-400 focus:ring-danger-500' : 'border-white/20'
                        }`}
                        placeholder="John Doe"
                        disabled={loading}
                      />
                      {errors.name && <p className="text-danger-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Email Address <span className="text-accent-400">*</span>
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                            errors.email ? 'border-danger-400 focus:ring-danger-500' : 'border-white/20'
                          }`}
                          placeholder="john.doe@company.com"
                          disabled={loading}
                        />
                      </div>
                      {errors.email && <p className="text-danger-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          placeholder="+1 (555) 123-4567"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Information Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BriefcaseIcon className="h-5 w-5 mr-2 text-primary-400" />
                    Work Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Department <span className="text-accent-400">*</span>
                      </label>
                      <div className="relative">
                        <BuildingIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                            errors.department ? 'border-danger-400 focus:ring-danger-500' : 'border-white/20'
                          }`}
                          disabled={loading}
                        >
                          <option value="" className="bg-slate-800 text-white">Select Department</option>
                          <option value="Engineering" className="bg-slate-800 text-white">Engineering</option>
                          <option value="Operations" className="bg-slate-800 text-white">Operations</option>
                          <option value="Safety" className="bg-slate-800 text-white">Safety</option>
                          <option value="Administration" className="bg-slate-800 text-white">Administration</option>
                          <option value="Maintenance" className="bg-slate-800 text-white">Maintenance</option>
                          <option value="Quality Control" className="bg-slate-800 text-white">Quality Control</option>
                        </select>
                      </div>
                      {errors.department && <p className="text-danger-400 text-xs mt-1">{errors.department}</p>}
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Position <span className="text-accent-400">*</span>
                      </label>
                      <div className="relative">
                        <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                            errors.position ? 'border-danger-400 focus:ring-danger-500' : 'border-white/20'
                          }`}
                          placeholder="Software Engineer"
                          disabled={loading}
                        />
                      </div>
                      {errors.position && <p className="text-danger-400 text-xs mt-1">{errors.position}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="text-sm text-primary-300">
                <span className="text-accent-400">*</span> Required fields
              </div>
              
              <div className="flex items-center space-x-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all duration-200 font-medium"
                  disabled={loading}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2 min-w-[140px] justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>{employee ? 'Update Employee' : 'Register Employee'}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onCapture={handleCapturePhoto}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EmployeeCard({ employee, onEdit, onDelete }: { 
  employee: Employee; 
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="metric-card hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{employee.name}</h3>
            <p className="text-sm text-primary-200">ID: {employee.employee_id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(employee)}
            className="p-2 text-primary-300 hover:text-white hover:bg-primary-500/20 rounded-lg transition-colors"
            title="Edit Employee"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(employee)}
            className="p-2 text-primary-300 hover:text-danger-400 hover:bg-danger-500/20 rounded-lg transition-colors"
            title="Delete Employee"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2">
          <BriefcaseIcon className="h-4 w-4 text-primary-400" />
          <span className="text-primary-100">{employee.position}</span>
        </div>
        <div className="flex items-center space-x-2">
          <BuildingIcon className="h-4 w-4 text-primary-400" />
          <span className="text-primary-100">{employee.department}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MailIcon className="h-4 w-4 text-primary-400" />
          <span className="text-primary-100 truncate">{employee.email}</span>
        </div>
        {employee.phone && (
          <div className="flex items-center space-x-2">
            <PhoneIcon className="h-4 w-4 text-primary-400" />
            <span className="text-primary-100">{employee.phone}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-primary-400" />
          <span className="text-primary-100">Hired: {formatDate(employee.hire_date)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
            employee.status === 'active' 
              ? 'bg-success-500/20 text-success-200 border-success-400/30' 
              : 'bg-danger-500/20 text-danger-200 border-danger-400/30'
          }`}>
            {employee.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-primary-300">
            Updated: {formatDate(employee.updated_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (formData: EmployeeFormData) => {
    try {
      setFormLoading(true);
      
      if (editingEmployee) {
        // Update employee
        await employeeService.updateEmployee(editingEmployee.employee_id, formData);
        showNotification('Employee updated successfully', 'success');
      } else {
        // Register new employee
        await employeeService.registerEmployee(formData as EmployeeRegistrationData);
        showNotification('Employee registered successfully', 'success');
        
        // Reload face encodings for the face detection service
        try {
          await faceDetectionService.reloadEmployeeData();
        } catch (error) {
          console.warn('Failed to reload face encodings:', error);
        }
      }
      
      // Refresh employee list
      await fetchEmployees();
      
      // Close form
      setShowForm(false);
      setEditingEmployee(null);
    } catch (error: unknown) {
      console.error('Error saving employee:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to save employee'
        : 'Failed to save employee';
      showNotification(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      try {
        await employeeService.deleteEmployee(employee.employee_id);
        showNotification('Employee deleted successfully', 'success');
        await fetchEmployees();
      } catch (error: unknown) {
        console.error('Error deleting employee:', error);
        const errorMessage = error instanceof Error && 'response' in error 
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete employee'
          : 'Failed to delete employee';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Employee Management</h1>
              <p className="text-primary-200 text-lg mb-4">
                Manage employee records and registration system
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success-400 rounded-full animate-pulse"></div>
                  <span className="text-success-300 font-medium">Database Connected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4 text-primary-300" />
                  <span className="text-primary-200">
                    {employees.length} Employee{employees.length !== 1 ? 's' : ''} Registered
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-primary-300" />
                  <span className="text-primary-200">
                    {filteredEmployees.length} Currently Showing
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              <div className="text-center lg:text-right">
                <p className="text-primary-200 text-sm font-medium">Active Employees</p>
                <p className="text-2xl font-bold text-white">
                  {employees.filter(emp => emp.status === 'active').length}
                </p>
                <p className="text-primary-300 text-sm">
                  of {employees.length} total
                </p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Add Employee</span>
              </motion.button>

              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-300" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg transition-colors">
                <span>Export List</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`p-4 rounded-lg flex items-center space-x-2 ${
              notification.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="metric-card animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                <div className="h-3 bg-gray-200 rounded w-3/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first employee'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredEmployees.map(employee => (
            <EmployeeCard
              key={employee.employee_id}
              employee={employee}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      )}

      {/* Employee Form Modal */}
      <AnimatePresence>
        {showForm && (
          <EmployeeForm
            employee={editingEmployee}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={formLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldIcon,
  CameraIcon,
  BellIcon,
  UsersIcon,
  DatabaseIcon,
  MonitorIcon,
  ServerIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  SaveIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  CogIcon
} from 'lucide-react';

interface SettingGroup {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: Setting[];
}

interface Setting {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'number' | 'text';
  value: string | number | boolean;
  options?: { label: string; value: string | number | boolean }[];
  min?: number;
  max?: number;
}

export function Settings() {
  const [settings, setSettings] = useState<SettingGroup[]>([
    {
      id: 'camera',
      title: 'Camera Settings',
      description: 'Configure camera and monitoring settings',
      icon: CameraIcon,
      settings: [
        {
          id: 'autoStart',
          label: 'Auto-start monitoring',
          description: 'Automatically start camera monitoring on system startup',
          type: 'toggle',
          value: true
        },
        {
          id: 'resolution',
          label: 'Camera resolution',
          description: 'Video capture resolution',
          type: 'select',
          value: '1080p',
          options: [
            { label: '720p', value: '720p' },
            { label: '1080p', value: '1080p' },
            { label: '4K', value: '4k' }
          ]
        },
        {
          id: 'fps',
          label: 'Frame rate (FPS)',
          description: 'Frames per second for video capture',
          type: 'number',
          value: 30,
          min: 10,
          max: 60
        }
      ]
    },
    {
      id: 'recognition',
      title: 'Face Recognition',
      description: 'Configure face detection and recognition settings',
      icon: UsersIcon,
      settings: [
        {
          id: 'confidenceThreshold',
          label: 'Confidence threshold',
          description: 'Minimum confidence required for face recognition',
          type: 'number',
          value: 75,
          min: 50,
          max: 99
        },
        {
          id: 'unknownFaceAlert',
          label: 'Unknown face alerts',
          description: 'Send alerts when unknown faces are detected',
          type: 'toggle',
          value: true
        },
        {
          id: 'faceEncodingModel',
          label: 'Face encoding model',
          description: 'Machine learning model for face recognition',
          type: 'select',
          value: 'hog',
          options: [
            { label: 'HOG (Fast)', value: 'hog' },
            { label: 'CNN (Accurate)', value: 'cnn' }
          ]
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety Monitoring',
      description: 'Configure safety equipment detection',
      icon: ShieldIcon,
      settings: [
        {
          id: 'ppeDetection',
          label: 'PPE detection',
          description: 'Monitor personal protective equipment',
          type: 'toggle',
          value: true
        },
        {
          id: 'safetyAlerts',
          label: 'Safety violation alerts',
          description: 'Send immediate alerts for safety violations',
          type: 'toggle',
          value: true
        },
        {
          id: 'complianceThreshold',
          label: 'Compliance threshold (%)',
          description: 'Minimum safety compliance percentage',
          type: 'number',
          value: 85,
          min: 50,
          max: 100
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure alert and notification preferences',
      icon: BellIcon,
      settings: [
        {
          id: 'emailNotifications',
          label: 'Email notifications',
          description: 'Send notifications via email',
          type: 'toggle',
          value: true
        },
        {
          id: 'pushNotifications',
          label: 'Push notifications',
          description: 'Show browser push notifications',
          type: 'toggle',
          value: false
        },
        {
          id: 'alertSound',
          label: 'Alert sounds',
          description: 'Play sounds for critical alerts',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'system',
      title: 'System',
      description: 'General system configuration',
      icon: ServerIcon,
      settings: [
        {
          id: 'autoBackup',
          label: 'Auto backup',
          description: 'Automatically backup data daily',
          type: 'toggle',
          value: true
        },
        {
          id: 'logLevel',
          label: 'Log level',
          description: 'System logging verbosity',
          type: 'select',
          value: 'info',
          options: [
            { label: 'Error only', value: 'error' },
            { label: 'Warning', value: 'warning' },
            { label: 'Info', value: 'info' },
            { label: 'Debug', value: 'debug' }
          ]
        },
        {
          id: 'sessionTimeout',
          label: 'Session timeout (minutes)',
          description: 'Auto-logout after inactivity',
          type: 'number',
          value: 30,
          min: 5,
          max: 480
        }
      ]
    }
  ]);

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateSetting = (groupId: string, settingId: string, value: string | number | boolean) => {
    setSettings(prev => prev.map(group => 
      group.id === groupId
        ? {
            ...group,
            settings: group.settings.map(setting =>
              setting.id === settingId ? { ...setting, value } : setting
            )
          }
        : group
    ));
    setHasChanges(true);
    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetToDefaults = () => {
    // Reset to default values
    // In a real app, this would reset to original settings
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="card-glass rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">System Settings</h1>
                <p className="text-primary-200 text-lg mb-4">
                  Configure system preferences and monitoring parameters
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success-400 rounded-full animate-pulse"></div>
                    <span className="text-success-300 font-medium">All Systems Operational</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CogIcon className="h-4 w-4 text-primary-300" />
                    <span className="text-primary-200">
                      {settings.reduce((total, group) => total + group.settings.length, 0)} Settings Available
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="text-center lg:text-right">
                  <p className="text-primary-200 text-sm font-medium">Configuration Status</p>
                  <p className="text-2xl font-bold text-white">
                    {hasChanges ? 'Modified' : 'Saved'}
                  </p>
                  <p className="text-primary-300 text-sm">
                    {hasChanges ? 'Unsaved changes' : 'All settings synced'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveSettings}
                  disabled={!hasChanges || saving}
                  className={`btn-primary flex items-center space-x-2 ${
                    !hasChanges ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetToDefaults}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg transition-colors"
                >
                  Reset to Defaults
                </motion.button>
              </div>
              
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-2 text-success-400"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Settings saved successfully!</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Settings Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settings.map((group, groupIndex) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="card-glass rounded-xl p-6"
            >
              {/* Group Header */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
                  <group.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{group.title}</h3>
                  <p className="text-primary-200 text-sm">{group.description}</p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {group.settings.map((setting) => (
                  <div key={setting.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-white font-medium">{setting.label}</label>
                        <p className="text-primary-200 text-sm">{setting.description}</p>
                      </div>
                      
                      {/* Setting Input */}
                      <div className="ml-4">
                        {setting.type === 'toggle' && (
                          <button
                            onClick={() => updateSetting(group.id, setting.id, !setting.value)}
                            className="flex items-center"
                          >
                            {setting.value ? (
                              <ToggleRightIcon className="h-8 w-8 text-primary-400" />
                            ) : (
                              <ToggleLeftIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </button>
                        )}
                        
                        {setting.type === 'select' && (
                          <select
                            value={String(setting.value)}
                            onChange={(e) => updateSetting(group.id, setting.id, e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {setting.options?.map((option) => (
                              <option key={String(option.value)} value={String(option.value)} className="bg-gray-800">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {setting.type === 'number' && (
                          <input
                            type="number"
                            value={String(setting.value)}
                            min={setting.min}
                            max={setting.max}
                            onChange={(e) => updateSetting(group.id, setting.id, parseInt(e.target.value))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white w-20 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        )}
                        
                        {setting.type === 'text' && (
                          <input
                            type="text"
                            value={String(setting.value)}
                            onChange={(e) => updateSetting(group.id, setting.id, e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 card-glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
              <MonitorIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">System Status</h3>
              <p className="text-primary-200 text-sm">Current system health and statistics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Database', status: 'Connected', color: 'text-success-400', icon: DatabaseIcon },
              { label: 'Camera', status: 'Active', color: 'text-success-400', icon: CameraIcon },
              { label: 'Face Recognition', status: 'Running', color: 'text-success-400', icon: UsersIcon },
              { label: 'Safety Monitor', status: 'Running', color: 'text-success-400', icon: ShieldIcon }
            ].map((item, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <item.icon className="h-5 w-5 text-primary-400" />
                  <span className="text-white font-medium">{item.label}</span>
                </div>
                <div className={`text-sm ${item.color}`}>{item.status}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
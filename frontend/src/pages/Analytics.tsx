import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  BarChart3Icon,
  PieChartIcon,
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  UsersIcon,
  ShieldIcon,
  ClockIcon,
  AlertTriangleIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { attendanceService } from '../services/attendanceService';
import { safetyService } from '../services/safetyService';

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 },
  { label: 'Last Year', value: '1y', days: 365 }
];

// Mock data generator for productivity (only used one)
const generateProductivityData = (days: number) => {
  return Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (Math.min(days, 30) - 1 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      productivity: Math.floor(Math.random() * 20) + 75,
      efficiency: Math.floor(Math.random() * 15) + 80,
      quality: Math.floor(Math.random() * 10) + 85
    };
  });
};

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  rate: number;
}

interface SafetyData {
  name: string;
  value: number;
  color: string;
}

interface ProductivityData {
  date: string;
  productivity: number;
  efficiency: number;
  quality: number;
}

interface ViolationData {
  date: string;
  violations: number;
  resolved: number;
}

export function Analytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[1]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [safetyData, setSafetyData] = useState<SafetyData[]>([]);
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([]);
  const [violationData, setViolationData] = useState<ViolationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Calculate date range based on selected time range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - selectedTimeRange.days);
        
        // Load real attendance data
        try {
          const attendanceStats = await attendanceService.getAttendanceStats({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          });
          
          if (attendanceStats && attendanceStats.daily_stats) {
            const chartData = attendanceStats.daily_stats.map(day => ({
              date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              present: day.count || 0,
              absent: Math.max(0, 250 - (day.count || 0)), // Estimated total employees
              rate: Math.round(((day.count || 0) / 250) * 100)
            }));
            setAttendanceData(chartData);
          } else {
            setAttendanceData([]);
          }
        } catch (error) {
          console.error('Error loading attendance data:', error);
          setAttendanceData([]);
        }
        
        // Load real safety data
        try {
          const safetyStats = await safetyService.getSafetyStats({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          });
          
          if (safetyStats && safetyStats.ppe_compliance) {
            const chartData = [
              { name: 'Helmet Compliance', value: Math.round((safetyStats.ppe_compliance.helmet || 0) * 100), color: '#14b8a6' },
              { name: 'Safety Vest', value: Math.round((safetyStats.ppe_compliance.safety_vest || 0) * 100), color: '#f97316' },
              { name: 'Safety Shoes', value: Math.round((safetyStats.ppe_compliance.safety_shoes || 0) * 100), color: '#22c55e' },
              { name: 'Eye Protection', value: Math.round((safetyStats.ppe_compliance.gloves || 0) * 100), color: '#ef4444' }
            ];
            setSafetyData(chartData);
          } else {
            setSafetyData([
              { name: 'Helmet Compliance', value: 0, color: '#14b8a6' },
              { name: 'Safety Vest', value: 0, color: '#f97316' },
              { name: 'Safety Shoes', value: 0, color: '#22c55e' },
              { name: 'Eye Protection', value: 0, color: '#ef4444' }
            ]);
          }
          
          // Load violation trends from safety stats
          if (safetyStats && safetyStats.daily_stats) {
            const violationChartData = safetyStats.daily_stats.map(day => ({
              date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              violations: day.violations || 0,
              resolved: Math.max(0, (day.violations || 0) - Math.floor((day.violations || 0) * 0.2)) // Assume 80% resolution rate
            }));
            setViolationData(violationChartData);
          } else {
            setViolationData([]);
          }
        } catch (error) {
          console.error('Error loading safety data:', error);
          setSafetyData([
            { name: 'Helmet Compliance', value: 0, color: '#14b8a6' },
            { name: 'Safety Vest', value: 0, color: '#f97316' },
            { name: 'Safety Shoes', value: 0, color: '#22c55e' },
            { name: 'Eye Protection', value: 0, color: '#ef4444' }
          ]);
          setViolationData([]);
        }
        
        // Generate productivity data (this remains mock since we don't have real productivity tracking)
        setProductivityData(generateProductivityData(selectedTimeRange.days));
        
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedTimeRange]);

  const exportData = () => {
    // Mock export functionality
    console.log('Exporting analytics data...');
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
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Analytics Dashboard</h1>
                <p className="text-primary-200 text-lg mb-4">
                  Comprehensive workforce analytics and insights
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <TrendingUpIcon className="h-4 w-4 text-success-400" />
                    <span className="text-success-300 font-medium">Data Updated</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-primary-300" />
                    <span className="text-primary-200">
                      {selectedTimeRange.label}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="text-center lg:text-right">
                  <p className="text-primary-200 text-sm font-medium">Analysis Period</p>
                  <p className="text-2xl font-bold text-white">{selectedTimeRange.label}</p>
                  <p className="text-primary-300 text-sm">{selectedTimeRange.days} days of data</p>
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-primary-300" />
                  <select
                    value={selectedTimeRange.value}
                    onChange={(e) => setSelectedTimeRange(timeRanges.find(r => r.value === e.target.value) || timeRanges[1])}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {timeRanges.map(range => (
                      <option key={range.value} value={range.value} className="bg-gray-800">
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg transition-colors">
                  <FilterIcon className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>
              
              <button
                onClick={exportData}
                className="flex items-center space-x-2 btn-primary"
              >
                <DownloadIcon className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: 'Average Attendance',
              value: '87.2%',
              change: '+2.1% vs last period',
              positive: true,
              icon: UsersIcon,
              color: 'from-primary-500 to-primary-600'
            },
            {
              title: 'Safety Compliance',
              value: '94.5%',
              change: '+1.8% vs last period',
              positive: true,
              icon: ShieldIcon,
              color: 'from-secondary-500 to-secondary-600'
            },
            {
              title: 'Avg. Daily Hours',
              value: '8.3h',
              change: '+0.2h vs last period',
              positive: true,
              icon: ClockIcon,
              color: 'from-success-500 to-success-600'
            },
            {
              title: 'Total Violations',
              value: '23',
              change: '-12% vs last period',
              positive: true,
              icon: AlertTriangleIcon,
              color: 'from-warning-500 to-danger-500'
            }
          ].map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className={`text-sm font-medium ${metric.positive ? 'text-success-400' : 'text-danger-400'}`}>
                  {metric.change}
                </div>
              </div>
              <div>
                <p className="text-primary-200 text-sm font-medium">{metric.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{metric.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
                <TrendingUpIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Attendance Trends</h3>
                <p className="text-primary-200 text-sm">Daily attendance patterns</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendanceRate"
                    stroke="#14b8a6"
                    fill="url(#attendanceGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Safety Compliance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
                <PieChartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Safety Equipment Compliance</h3>
                <p className="text-primary-200 text-sm">PPE compliance breakdown</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={safetyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ value }) => `${value}%`}
                    >
                      {safetyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, 'Compliance']}
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 lg:mt-0 lg:ml-6">
                  {safetyData.map((item, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-white">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Productivity Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
                <BarChart3Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Productivity Metrics</h3>
                <p className="text-primary-200 text-sm">Performance indicators over time</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="productivity"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    name="Productivity"
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="Efficiency"
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Quality"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Violation Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500">
                <AlertTriangleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Safety Violations</h3>
                <p className="text-primary-200 text-sm">Violations vs resolutions</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warning-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={violationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="violations" fill="#ef4444" name="Violations" />
                  <Bar dataKey="resolved" fill="#22c55e" name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
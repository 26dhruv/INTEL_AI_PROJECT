import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { ThreeBackground } from './components/ThreeBackground';

function AppRoutes() {
  const { state } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            state.isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
                {/* Professional Background Pattern */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-secondary-900/20 to-slate-900/40"></div>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/8 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
                  </div>
                  
                  {/* Subtle grid pattern for professional look */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>
                
                {/* Three.js Animated Background */}
                <ThreeBackground />
                
                {/* Navigation */}
                <Navigation />
                
                {/* Main Content */}
                <main className="relative z-10 pt-16 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                      <Routes>
                        <Route 
                          path="/" 
                          element={
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="py-6"
                            >
                              <Dashboard />
                            </motion.div>
                          } 
                        />
                        <Route 
                          path="/employees" 
                          element={
                            <ProtectedRoute requiredPermission="write">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="py-6"
                              >
                                <EmployeeManagement />
                              </motion.div>
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/monitoring" 
                          element={
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="py-6"
                            >
                              <LiveMonitoring />
                            </motion.div>
                          } 
                        />
                        <Route 
                          path="/analytics" 
                          element={
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="py-6"
                            >
                              <Analytics />
                            </motion.div>
                          } 
                        />
                        <Route 
                          path="/settings" 
                          element={
                            <ProtectedRoute requiredPermission="admin">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="py-6"
                              >
                                <Settings />
                              </motion.div>
                            </ProtectedRoute>
                          } 
                        />
                      </Routes>
                    </AnimatePresence>
                  </div>
                </main>
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

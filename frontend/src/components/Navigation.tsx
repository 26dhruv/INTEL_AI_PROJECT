import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  UsersIcon,
  VideoIcon,
  ChartBarIcon,
  CogIcon,
  MenuIcon,
  XIcon,
  ShieldCheckIcon,
  LogOutIcon,
  UserIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Employees', href: '/employees', icon: UsersIcon },
  { name: 'Live Monitoring', href: '/monitoring', icon: VideoIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { state, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">Veesure AI</h1>
              <p className="text-xs text-primary-200">Workforce Monitoring</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/20'
                      : 'text-primary-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-lg border border-primary-400/30"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Info and Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-200">System Online</span>
            </div>
            <div className="text-primary-100 text-sm">
              {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center space-x-2 text-sm text-primary-100">
              <UserIcon className="h-4 w-4" />
              <span>{state.user?.username || 'User'}</span>
              <span className="text-primary-300">({state.user?.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-primary-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-primary-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="md:hidden overflow-hidden bg-black/30 backdrop-blur-md border-t border-white/10"
      >
        <div className="px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-white/20'
                    : 'text-primary-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="border-t border-white/10 pt-4 mt-4">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-200">System Online</span>
              </div>
              <div className="text-primary-100 text-sm">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center space-x-2 text-sm text-primary-100">
                <UserIcon className="h-4 w-4" />
                <span>{state.user?.username}</span>
                <span className="text-primary-300">({state.user?.role})</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-primary-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                <LogOutIcon className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </nav>
  );
} 
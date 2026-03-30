import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { GraphView } from '@/pages/GraphView';
import { ActivityReport } from '@/pages/ActivityReport';
import { LiveFeed } from '@/pages/LiveFeed';

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-background text-foreground font-sans overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth custom-scrollbar">
          {/* Subtle noise/grid overlay can be added here if needed */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/graph" element={<PageTransition><GraphView /></PageTransition>} />
            <Route path="/activity-report" element={<PageTransition><ActivityReport /></PageTransition>} />
            <Route path="/live-feed" element={<PageTransition><LiveFeed /></PageTransition>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

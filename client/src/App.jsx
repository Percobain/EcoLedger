import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Web3Provider } from './contexts/Web3Context';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import NGODashboard from './pages/NGODashboard';
import AddProject from './pages/AddProject';
import Verification from './pages/Verification';
import CarbonMarketplace from './pages/CarbonMarketplace';
import Reporting from './pages/Reporting';
import DAO from './pages/DAO';
import ProjectDetails from './pages/ProjectDetails';
import './index.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/ngo" element={<NGODashboard />} />
            <Route path="/ngo/new" element={<AddProject />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/marketplace" element={<CarbonMarketplace />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/dao" element={<DAO />} />
            <Route path="/ngo/project/:id" element={<ProjectDetails />} />
          </Routes>
        </Layout>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#111111',
              border: '2px solid #111111',
              borderRadius: '1.25rem',
              boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: '500'
            },
            className: 'nb-toast',
            duration: 4000,
          }}
          theme="light"
        />
      </Router>
    </Web3Provider>
  );
}

export default App;

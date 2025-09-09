import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Web3Provider } from './contexts/Web3Context';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import NGODashboard from './pages/NGODashboard';
import AddProject from './pages/AddProject';
import Verification from './pages/Verification';
import CSRMarketplace from './pages/CSRMarketplace';
import Reporting from './pages/Reporting';
import DAO from './pages/DAO';
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
            <Route path="/csr" element={<CSRMarketplace />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/dao" element={<DAO />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </Web3Provider>
  );
}

export default App;

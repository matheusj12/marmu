import { Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import ProposalPage from './pages/ProposalPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/proposta/:uuid" element={<ProposalPage />} />
    </Routes>
  );
}

import { HashRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/custom/AppLayout';
import { RoomProvider } from '@/contexts/RoomContext';
import Index from './pages/Index';
import Stats from './pages/Stats';
import Alerts from './pages/Alerts';
import Me from './pages/Me';
import NotFound from './pages/NotFound';

const App = () => (
  <HashRouter>
    <RoomProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/me" element={<Me />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </RoomProvider>
  </HashRouter>
);

export default App;

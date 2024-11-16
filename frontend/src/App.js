import Header from './components/Header';
import { UserProvider } from './context/UserContext';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home";
import Account from "./Pages/Account";
import EditOlymp from './Pages/EditOlymp';
import Preview from './Pages/Preview';
import Footer from './components/Footer';
import Olymp from './Pages/OlympPage';
import Notification from './components/Notification';
import CheckPage from './Pages/CheckPage';
import InterRating from './Pages/InterRating';
import OlympPage from './Pages/OlympPage';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Router>
        <UserProvider>
          <Header />
          <Notification/>
          <div style={{ flex: '1' }}>
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route exact path="/account" element={<Account />} />
              <Route exact path="/edit-olymp/:id" element={<EditOlymp />} />
              <Route exact path="/preview" element={<Preview />} />
              <Route exact path="/olymp/:id" element={<OlympPage />} />
              <Route exact path="/check-olymp/:id" element={<CheckPage />} />
              <Route exact path="/inraiting/:id" element={<InterRating />} />
            </Routes>
          </div>
          <Footer />
        </UserProvider>
      </Router>
    </div>
  );
}

export default App;

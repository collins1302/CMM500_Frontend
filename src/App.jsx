import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from "./pages/AdminDashboard"
import Login from "./pages/Login"
import SecurityDashboard from "./pages/SecurityDashBoard"
import UserDashboard from './pages/UserDashoard';

function App() { 

  return (
    <Router>
       <Routes>   
         <Route exact path="/" element={<Login />} />
         <Route exact path="/login" element={<Login />} />
         <Route exact path="/admin" element={<AdminDashboard />} />
         <Route exact path="/security" element={<SecurityDashboard />} /> 
         <Route exact path="/user" element={<UserDashboard />} /> 
       </Routes>
    </Router>
  )
}

export default App

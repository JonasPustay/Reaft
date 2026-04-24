import React, { useState } from "react"; 
import { BrowserRouter as Router } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import AppRoutes from './routes/Routes';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Function for toggling between dark and light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <NavBar toggleDarkMode={toggleDarkMode} darkMode={darkMode}/>
      <AppRoutes darkMode={darkMode}/> 
      <Footer darkMode={darkMode}/>
    </Router>
  );
};

export default App;

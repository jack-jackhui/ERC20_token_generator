import React from 'react';
import './css/App.css';
import { Routes, Route } from 'react-router-dom';
import LandingPage from "./page/landingpage.jsx";
import TokenCreationPage from './page/TokenCreationPage'; // The page for token creation inputs

const App = () => {
    const numberOfOrbs = 10; // Number of orbs you have styled in your CSS
    const orbs = Array.from({ length: numberOfOrbs }, (_, index) => <i key={index} />);

    return (
        <div className="space-background">
            {orbs}
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create-token" element={<TokenCreationPage />} />
        </Routes>
        </div>
    );
};

export default App

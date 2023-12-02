import React, {useEffect} from 'react';
import { motion } from 'framer-motion';
import ethereumLogo from '../assets/eth-diamond-rainbow.svg';
import '../css/landingpage.css'; // Path to your stars image
//import { useState } from 'react';
//import Web3 from 'web3';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
const LandingPage = () => {
    //const [web3, setWeb3] = useState(null);
    const navigate = useNavigate();
    const { isConnected } = useAccount();

    useEffect(() => {
        if (isConnected) {
            navigate('/create-token');
        }
        else {
            // Redirect back to landing page (or any other page) if wallet is disconnected
            navigate('/');
        }
    }, [isConnected, navigate]);


    return (
            <div className="container">
                <motion.img
                    src={ethereumLogo}
                    alt="Ethereum Logo"
                    className="logo"
                    animate={{opacity: [1, 0.5, 1]}}
                    transition={{duration: 3, repeat: Infinity}}
                />
                <h1 className="white-text">Create your own ERC20 token with no code!</h1>
                <ConnectButton />
                {/*
                <button className="button" onClick={handleStartNow}>
                    Start Now!
                </button>
                */}
            </div>
    );
};

export default LandingPage;

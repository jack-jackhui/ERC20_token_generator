import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx'
import './css/index.css'

import '@rainbow-me/rainbowkit/styles.css';
import {
    connectorsForWallets,
    getDefaultWallets,
    RainbowKitProvider,
    midnightTheme,
} from '@rainbow-me/rainbowkit';

import {
    injectedWallet,
    metaMaskWallet,
    coinbaseWallet,
    walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
    goerli,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    avalanche,
} from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const projectId = import.meta.env.VITE_WALLET_CONNECT_ID;
//console.log("============", projectId)

const { chains, publicClient } = configureChains(
    [goerli, mainnet, polygon, optimism, arbitrum, base, avalanche],
    [
        alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_ID }),
        publicProvider()
    ]
);

/*
const { connectors } = getDefaultWallets({
    appName: 'ERC20 Token Generator',
    projectId: projectId,
    chains
});

 */

const connectors = connectorsForWallets([
    {
        groupName: 'Recommended',
        wallets: [
            injectedWallet({ chains }),
            metaMaskWallet({ projectId, chains }),
            coinbaseWallet({ chains, appName: 'ERC20 Token Generator' }),
            walletConnectWallet({ projectId, chains }),
        ],
    },
]);

const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router>
            <WagmiConfig config={wagmiConfig}>
                <RainbowKitProvider chains={chains} theme={midnightTheme()} coolMode>
                    <App/>
                </RainbowKitProvider>
            </WagmiConfig>
        </Router>
    </React.StrictMode>,
)

import styles from '../css/NavBar.module.css';
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
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

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
const NavBar = ({ updateWalletBalance, walletBalance }) => {
    return (
        <div className={styles.navbar}>
            <div className={styles.navbarContent}>
            <ConnectButton
                accountStatus="address"
                showBalance={false}
                onConnect={updateWalletBalance}
            />
            {walletBalance && <p>Balance: {walletBalance} ETH</p>}
            {/* Add a disconnect button if needed */}
            </div>
        </div>
    );
};

export default NavBar;

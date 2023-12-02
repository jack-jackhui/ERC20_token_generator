import React, {useState, useEffect, useRef} from 'react';
import NavBar from '../component/NavBar';
import { useForm, Controller } from "react-hook-form";
import {TextField, MenuItem, Button, FormControl, InputLabel, Select, Typography} from '@mui/material';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Stack from '@mui/material/Stack';
import {ethers} from 'ethers';
import TokenFactoryWithFeeABI from '../assets/TokenFactory.json';
import TokenFactoryNoFeeABI from '../assets/TokenFactoryNoFee.json';
import styles from '../css/TokenCreationPage.module.css';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';

//const contractAddress = "0x8AC5D6d1E1c2A90E64547d4574b4efD2dFE05933"; //contract with no fees
//const contractAddress = "0x0352e3Fb3C5f8a0856CCf59b0CE35C56714DD0a7" //contract charges a fee
const contractAddresses = {
    'Ethereum - Mainnet': '0x56Cc284191bdFEe6718dd1Df502640f65A38e723', // Address of the contract that charges a fee
    'Ethereum - Goerli': '0xb96f5A478204c9bbEC051e12Fc5160A1812601a8' // Address of the contract with no fees
};
export default function TokenCreationPage() {
    //console.log("TokenCreationPage render");
    //console.log("ABI:", TokenFactoryWithFeeABI);

    const { isConnected } = useAccount();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isConnected) {
            navigate('/');
        }
    }, [isConnected, navigate]);

    const [estimatedGasFee, setEstimatedGasFee] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isCreateButtonDisabled, setIsCreateButtonDisabled] = useState(true);
    const createButtonTimeout = useRef(null);
    const [countdown, setCountdown] = useState(0);
    const [isEstimating, setIsEstimating] = useState(false);
    const [walletBalance, setWalletBalance] = useState(null);
    const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);
    const [tokenAddress, setTokenAddress] = useState(null); // New state for token address
    const [selectedNetwork, setSelectedNetwork] = useState('Ethereum - Mainnet');
    const [creationFee, setCreationFee] = useState(null);

    // Function to handle network change
    const handleNetworkChange = (event) => {
        const newNetwork = event.target.value;
        setSelectedNetwork(newNetwork);

        // If the selected network is Mainnet, enable the button directly
        if (newNetwork === "Ethereum - Mainnet") {
            setIsCreateButtonDisabled(false);
            setSnackbarMessage('Note: Gas fee estimation is not available for Mainnet. A predefined gas limit will be used.');
            setOpenSnackbar(true);
        } else {
            // For other networks, reset the button state
            setIsCreateButtonDisabled(true);
        }
    };

    const getContract = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Extract the correct ABI based on the network selection
        const abi = selectedNetwork === "Ethereum - Mainnet"
            ? TokenFactoryWithFeeABI.abi
            : TokenFactoryNoFeeABI.abi;

        const address = contractAddresses[selectedNetwork];

        return new ethers.Contract(address, abi, signer);
    };

    // Function to fetch the fee
    const fetchCreationFee = async () => {
        try {
            // Only fetch fee for the contract that includes the creationFee function
            if (selectedNetwork === "Ethereum - Mainnet") {
                const tokenFactory = getContract();
                const fee = await tokenFactory.creationFee(); // Assuming 'creationFee' is a view function in your contract
                setCreationFee(ethers.utils.formatEther(fee));
            } else {
                // For other networks, set the fee to null or a default value
                setCreationFee(null);
            }
        } catch (error) {
            console.error('Error fetching fee:', error);
        }
    };

    useEffect(() => {
        fetchCreationFee();
    }, [selectedNetwork]); // Fetch fee when the component mounts or the network changes

    const updateWalletBalance = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const balance = await provider.getBalance(signer.getAddress());
            setWalletBalance(ethers.utils.formatEther(balance));
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
        }
    };


    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
        //console.log('Close snackbar');
    };

    useEffect(() => {
        return () => {
            if (createButtonTimeout.current) {
                clearInterval(createButtonTimeout.current);
            }
        };
    }, []);

    const calculateGasEstimate = async () => {
        // If the selected network is not Mainnet, proceed with gas estimation
        if (selectedNetwork !== "Ethereum - Mainnet") {
            setIsEstimating(true);
            //console.log('Estimating gas estimate');
            // Fetch current form values
            const tokenName = watch("tokenName");
            const tokenSymbol = watch("tokenSymbol");
            const tokenDecimals = watch("tokenDecimals");
            const initialSupply = watch("initialSupply");
            //console.log("Form Values:", { tokenName, tokenSymbol, tokenDecimals, initialSupply });

            // Check if all required inputs are provided
            if (!tokenName || !tokenSymbol || !tokenDecimals || !initialSupply) {
                setSnackbarMessage('Please fill out all required fields.');
                setOpenSnackbar(true);
                setIsEstimating(false); // Reset spinner
                return;
            }
            // Ensure initialSupply is a string and convert it to a BigNumber
            const initialSupplyString = initialSupply.toString();
            if (isNaN(initialSupplyString)) {
                setSnackbarMessage('Invalid initial supply value.');
                setOpenSnackbar(true);
                setIsEstimating(false); // Reset spinner
                return;
            }
            const initialSupplyBigNumber = ethers.utils.parseUnits(initialSupplyString || "0", tokenDecimals || 0);

            // Initialize ethers
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum); // Define provider
                const signer = provider.getSigner();
                const tokenFactory = getContract(); // Use the dynamic contract instance

                // Estimate gas fees and display to user
                const estimatedGas = await tokenFactory.estimateGas.createToken(
                    tokenName,
                    tokenSymbol,
                    parseInt(tokenDecimals),
                    initialSupplyBigNumber
                );
                const gasPrice = await provider.getGasPrice();
                const estimatedFee = estimatedGas.mul(gasPrice);
                setEstimatedGasFee(ethers.utils.formatEther(estimatedFee) + ' ETH');
                //console.log("Estimated Gas Fee:", estimatedGasFee);
                //console.log("Before opening Snackbar (calculateGasEstimate)");
                setSnackbarMessage('Estimated Gas Fee: ' + ethers.utils.formatEther(estimatedFee) + ' ETH');
                setOpenSnackbar(true);
                //console.log("After opening Snackbar (calculateGasEstimate)");

                setIsCreateButtonDisabled(false);
                //console.log("Create Token Button Enabled", isCreateButtonDisabled);
                setCountdown(20); // Start countdown from 20 seconds
                // Start the countdown
                createButtonTimeout.current = setInterval(() => {
                    setCountdown(prevCountdown => {
                        const newCountdown = prevCountdown - 1;
                        if (newCountdown <= 0) {
                            clearInterval(createButtonTimeout.current);
                            setIsCreateButtonDisabled(true); // Disable the button when countdown reaches 0
                            return 0;
                        }
                        return newCountdown;
                    });
                }, 1000); // Update countdown every second

            } catch (error) {
                console.error('Error estimating gas:', error);
                // Handle errors, e.g., show an error message to the user
                setSnackbarMessage('Error estimating gas. Please try again.');
                setOpenSnackbar(true);
                setIsEstimating(false); // Reset spinner
            }
            setIsEstimating(false);
        }
    };


    const { register, handleSubmit, watch, control, formState: { errors } } = useForm();
    const onSubmit = async (data) => {
        try {
            const { tokenType, network, tokenName, tokenSymbol, tokenDecimals, initialSupply } = data;
            const initialSupplyString = initialSupply.toString();
            const initialSupplyBigNumber = ethers.utils.parseUnits(initialSupplyString || "0", tokenDecimals || 0);
            setIsTransactionInProgress(true); // Activate the spinner

            const tokenFactory = getContract(); // Use the dynamic contract instance

            // Specify the transaction options, including the fee
            const transactionOptions = {};
            if (selectedNetwork === "Ethereum - Mainnet") {
                transactionOptions.value = ethers.utils.parseEther(creationFee || "0"); // Include the fee in the transaction
            }

            // Call the createToken function of the smart contract
            const tx = await tokenFactory.createToken(tokenName, tokenSymbol, parseInt(tokenDecimals), initialSupplyBigNumber, transactionOptions);
            const receipt = await tx.wait();

            // Find the TokenCreated event in the transaction receipt
            const tokenCreatedEvent = receipt.events?.find(event => event.event === "TokenCreated");
            if (!tokenCreatedEvent) throw new Error("TokenCreated event not found");

            const newTokenAddress = tokenCreatedEvent.args[0]; // Retrieve the token address from the event

            console.log('Token created successfully');

            setTokenAddress(newTokenAddress); // Update state with token address

            //console.log("Before opening Snackbar (onSubmit)");
            setIsTransactionInProgress(false); // Deactivate the spinner
            setSnackbarMessage('Token created successfully!');
            setOpenSnackbar(true);
            //console.log("After opening Snackbar (onSubmit)");

        } catch (error) {
            console.error('Error creating token:', error);
            // Handle errors, e.g., show an error message to the user
            //console.log("Before opening Snackbar on error (onSubmit)");
            setIsTransactionInProgress(false); // Deactivate the spinner even in case of error
            setSnackbarMessage('Error creating token. Please try again.');
            setOpenSnackbar(true);
            //console.log("After opening Snackbar on error (onSubmit)");
        }
    };


    const textFieldStyles = {
        border: '1px solid white',
        '&:hover fieldset': {
            border: '1px solid blue!important',
            borderRadius: 0,
        },
        input: { color: 'white' },
        label: { color: 'white' },
        helperText: { color: 'white' },
    };

    // Function to construct Etherscan URL based on network
    const getEtherscanUrl = (address) => {
        const baseUrl = selectedNetwork === "Ethereum - Mainnet"
            ? "https://etherscan.io/address/"
            : "https://goerli.etherscan.io/address/";

        return baseUrl + address;
    };

    return (
        <div className={styles.tokenCreationPage}>
            {/*console.log("Render: Create Token Button State", isCreateButtonDisabled)*/}

            <NavBar updateWalletBalance={updateWalletBalance} walletBalance={walletBalance}/>
            <Typography variant="h1" component="h2"
                        style={{
                            fontSize: '36px', // Change the size as needed
                            textAlign: 'center', // Align the text: 'left', 'right', or 'center'
                            color: '#69f24f' // Specify the color you want
                        }}>
                Generate Your Own Tokens Today
            </Typography>

            <div className={styles.centerContainer}>
                {
                    tokenAddress && (
                        <Alert severity="success">
                            <AlertTitle>Success</AlertTitle>
                            Token created successfully —
                            <a href={getEtherscanUrl(tokenAddress)} target="_blank" rel="noopener noreferrer">
                                <strong>{tokenAddress}</strong>
                            </a>
                        </Alert>
                    )}
                <div className={styles.cardContainer}>
                    {/* Card 1: Token Type and Network */}
                    <div className={styles.card}>
                        <div className={styles.formControlContainer}>
                            {/* Token Type */}
                            <FormControl className={styles.formControl}>
                                <InputLabel id="token-type-label" sx={{color: 'white'}}>Token Type</InputLabel>
                                <Select
                                    labelId="token-type-label"
                                    defaultValue="Standard ERC20"
                                    {...register("tokenType")}
                                    label="Token Type"
                                    sx={{
                                        color: 'white',
                                        '.MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'white'
                                        },
                                        '& .MuiSvgIcon-root': { // This targets the dropdown icon
                                            color: 'white'
                                        }
                                    }}
                                >
                                    <MenuItem value="Standard ERC20">Standard ERC20</MenuItem>
                                    {/* Add more token types here if needed */}
                                </Select>
                            </FormControl>

                            {/* Network */}
                            <FormControl className={styles.formControl}>
                                <InputLabel id="network-label" sx={{color: 'white'}}>Network</InputLabel>
                                <Controller
                                    name="network"
                                    control={control} // 'control' comes from useForm
                                    defaultValue="Ethereum - Mainnet" // Default value
                                    render={({field: { onChange, value }}) => (
                                        <Select
                                            value={value}
                                            onChange={(e) => {
                                                onChange(e); // This updates the form state
                                                handleNetworkChange(e); // This updates the selectedNetwork state
                                            }}
                                            labelId="network-label"
                                            label="Network"
                                            sx={{
                                                color: 'white',
                                                '.MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'white'
                                                },
                                                '& .MuiSvgIcon-root': {
                                                    color: 'white'
                                                }
                                            }}
                                        >
                                            <MenuItem value="Ethereum - Mainnet">Ethereum - Mainnet</MenuItem>
                                            <MenuItem value="Ethereum - Goerli">Ethereum - Goerli</MenuItem>
                                            {/* Add more networks here if needed */}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                            {creationFee && (
                                <p style={{color: 'white'}}>Token creation fee: {creationFee} ETH</p>
                            )}
                        </div>
                    </div>
                    {/* Card 2: Other Inputs and Submit Button */}
                    <div className={styles.card}>
                        <form onSubmit={handleSubmit(onSubmit)}
                              className={styles.formContainer}
                        >
                            {/* Token Name */}
                            <TextField
                                InputLabelProps={{
                                    style: { color: 'white' }
                                }}
                                InputProps={{
                                   sx: {
                                       ...textFieldStyles,
                                       marginBottom: '10px',
                                   },
                                }}
                                FormHelperTextProps={{
                                    style: { color: 'white' }
                                }}
                                label="Token Name"
                                {...register("tokenName", {required: true})}
                                error={!!errors.tokenName}
                                helperText={errors.tokenName ? "This field is required" : ""}
                            />

                            {/* Token Symbol */}
                            <TextField
                                InputLabelProps={{style: textFieldStyles.label}}
                                InputProps={{
                                    sx: {
                                        ...textFieldStyles,
                                        marginBottom: '10px',
                                    },
                                }}
                                FormHelperTextProps={{style: textFieldStyles.helperText}}
                                label="Token Symbol"
                                {...register("tokenSymbol", {required: true, maxLength: 5, pattern: /^[A-Za-z]+$/})}
                                error={!!errors.tokenSymbol}
                                helperText={errors.tokenSymbol ? "Max 5 letters, no numbers" : ""}
                            />

                            {/* Token Decimals */}
                            <TextField
                                InputLabelProps={{style: textFieldStyles.label}}
                                InputProps={{
                                    sx: {
                                        ...textFieldStyles,
                                        marginBottom: '10px',
                                    },
                                    inputProps: {min: 0}
                                }}
                                FormHelperTextProps={{style: textFieldStyles.helperText}}
                                label="Token Decimals"
                                type="number"
                                {...register("tokenDecimals", {required: true, valueAsNumber: true})}
                                error={!!errors.tokenDecimals}
                                helperText={errors.tokenDecimals ? "Enter an integer value" : ""}
                            />

                            {/* Initial Supply */}
                            <TextField
                                InputLabelProps={{style: textFieldStyles.label}}
                                InputProps={{
                                    sx: {
                                        ...textFieldStyles,
                                        marginBottom: '10px',
                                    },
                                    inputProps: {min: 0}
                                }}
                                FormHelperTextProps={{style: textFieldStyles.helperText}}
                                label="Initial Supply"
                                type="number"
                                {...register("initialSupply", {required: true, valueAsNumber: true})}
                                error={!!errors.initialSupply}
                                helperText={errors.initialSupply ? "Enter an integer value" : ""}
                            />

                            {/* Max Supply */}
                            <TextField
                                InputLabelProps={{style: textFieldStyles.label}}
                                InputProps={{
                                    sx: {
                                        ...textFieldStyles,
                                        marginBottom: '10px',
                                    },
                                    inputProps: {min: 0}
                                }}
                                FormHelperTextProps={{style: textFieldStyles.helperText}}
                                label="Max Supply"
                                type="number"
                                {...register("maxSupply", {required: true, valueAsNumber: true})}
                                error={!!errors.maxSupply}
                                helperText={errors.maxSupply ? "Enter an integer value" : ""}
                            />
                            <Button variant="outlined" onClick={calculateGasEstimate}
                                    disabled={isEstimating}
                                    sx={{color: 'white', backgroundColor: 'blue', borderRadius: '10px', marginBottom: '10px'}}
                            >
                                {isEstimating ? <CircularProgress size={24}/> : 'Calculate Gas Fee'}
                            </Button>
                            {estimatedGasFee && <p style={{color: 'white'}}>Estimated Gas Fee: {estimatedGasFee}</p>}

                            <Button type="submit" variant="contained"
                                    disabled={isCreateButtonDisabled}
                                    sx={{color: 'white', backgroundColor: 'blue', borderRadius: '10px'}}
                            >
                                Create Token
                            </Button>
                            {
                                countdown > 0 && (
                                    <p style={{color: 'white'}}>create token: {countdown} seconds</p>
                                )}

                        </form>
                    </div>

                </div>

            </div>
            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
                sx={{
                    '& .MuiSnackbarContent-root': {
                        backgroundColor: '#3f0d95', // Replace '#yourColor' with your desired color
                        fontSize: '18px',
                        fontWeight: 'bold',
                        fontFamily: 'sans-serif',
                    },
                }}
            />
            {/* Full-page spinner */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isTransactionInProgress}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </div>
    );
}

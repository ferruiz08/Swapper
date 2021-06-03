    // If you don't specify a //url//, Ethers connects to the default 
    // (i.e. ``http:/\/localhost:8545``)
   // const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/FmCjZNdLHvSEBsNYPXvsCJStTOU5Z8Vb");  
          
    //const signer = provider.getSigner()

    // You can also use an ENS name for the contract address
    const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

    // The ERC-20 Contract ABI, which is a common contract interface
    // for tokens (this is the Human-Readable ABI format)
    const usdcAbi = [
        // Some details about the token
        "function name() view returns (string)",
        "function symbol() view returns (string)",
  
        // Get the account balance
        "function balanceOf(address) view returns (uint)",
  
        // Send some of your tokens to someone else
        "function transfer(address to, uint amount)",

        "function transferFrom(address sender, address recipient, uint256 amount)",
  
        // An event triggered whenever anyone transfers to someone else
        "event Transfer(address indexed from, address indexed to, uint amount)"
      ];
  
      // The Contract object
      //const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);
  
     // exports.usdcContract = usdcContract;
      exports.usdcAbi = usdcAbi;
      exports.usdcAddress = usdcAddress;
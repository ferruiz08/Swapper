    // If you don't specify a //url//, Ethers connects to the default 
    // (i.e. ``http:/\/localhost:8545``)
    //const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/FmCjZNdLHvSEBsNYPXvsCJStTOU5Z8Vb");  
                                                                                                    
    //const signer = provider.getSigner()

    // You can also use an ENS name for the contract address
    const daiAddress = "dai.tokens.ethers.eth";

    // The ERC-20 Contract ABI, which is a common contract interface
    // for tokens (this is the Human-Readable ABI format)
    const daiAbi = [
      // Some details about the token
      "function name() view returns (string)",
      "function symbol() view returns (string)",

      // Get the account balance
      "function balanceOf(address) view returns (uint)",

      // Send some of your tokens to someone else
      "function transfer(address to, uint amount)",

      // An event triggered whenever anyone transfers to someone else
      "event Transfer(address indexed from, address indexed to, uint amount)"
    ];

    // The Contract object
    //const daiContract = new ethers.Contract(daiAddress, daiAbi, provider);

    //exports.daiContract = daiContract;
    exports.daiAbi = daiAbi;
    exports.daiAddress = daiAddress;
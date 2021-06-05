const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
                        
// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const wethAbi = [
    // Some details about the token
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function approve(address, uint amount)",
    // Get the account balance
    "function balanceOf(address) view returns (uint)",

    // Send some of your tokens to someone else
    "function transfer(address to, uint amount)",

    "function transferFrom(address sender, address recipient, uint256 amount)",

    // An event triggered whenever anyone transfers to someone else
    "event Transfer(address indexed from, address indexed to, uint amount)"
  ];


 // exports.usdcContract = usdcContract;
  exports.wethAbi = wethAbi;
  exports.wethAddress = wethAddress;

const { expect } = require("chai");
const { ethers } = require("ethers");
require("@nomiclabs/hardhat-ethers");

describe("Swapper", function() {

  

    it("Should fail if sender doesn't have enough tokens", async function() {
        
      // If you don't specify a //url//, Ethers connects to the default 
      // (i.e. ``http:/\/localhost:8545``)
      /*const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/FmCjZNdLHvSEBsNYPXvsCJStTOU5Z8Vb");  
      
      const signer = provider.getSigner()

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
      const daiContract = new ethers.Contract(daiAddress, daiAbi, provider);
*/
      await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503"]}
          )
        
          const signer = await ethers.provider.getSigner("0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503")
         

          

          // The provider also allows signing transactions to
          // send ether and pay to change state within the blockchain.
          // For this, we need the account signer...
          
          //const signer = provider.getSigner()

        console.log(
          "Deploying contracts with the account:",
         await signer.address
        );

        const usdc = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
        const dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
        
        const Swapper = await ethers.getContractFactory("Swapper");
        const swapper = await Swapper.deploy(usdc,dai);
      
        await swapper.deployed();
        //await expect (swapper.provide(1)).to.be.revertedWith("Not enough tokens");
        await swapper.provide(1);
  
      //await greeter.setGreeting("Hola, mundo!");
      //expect(await greeter.greet()).to.equal("Hola, mundo!");
    });
  });

const { Contract } = require("@ethersproject/contracts");
const { expect } = require("chai");
const { ethers } = require("hardhat");
//const { ethers } = require("ethers");
const { daiAddress, daiAbi } = require("../scripts/daiContract.js");
const { usdcAddress, usdcAbi } = require("../scripts/usdcContract.js");
//require("@nomiclabs/hardhat-ethers");

describe("Swapper", function() {


    it("Should fail if sender doesn't have enough tokens", async function() {


  await ethers.provider.send('hardhat_impersonateAccount', ['0x0548f59fee79f8832c299e01dca5c76f034f558e']);
      const usdcHolder = await ethers.provider.getSigner('0x0548f59fee79f8832c299e01dca5c76f034f558e');    
      const usdcC = new ethers.Contract(usdcAddress, usdcAbi, usdcHolder);    
      const [alice,bob] = await ethers.getSigners();
      
      let balance = await usdcC.balanceOf(usdcHolder.getAddress());
      let balanceAlice = await usdcC.balanceOf(alice.getAddress());

      console.log(
        "Balance of USDC Holder:",
        ethers.utils.formatUnits(balance, 6),
        "\nBalance of USDC ALICE:",
        ethers.utils.formatUnits(balanceAlice, 6)
      );
      const usdcP = ethers.utils.parseUnits("100.0", 6);
      console.log(
        "Alice address:",
        alice.address
      );
      const tx = await usdcC.transfer(alice.address,usdcP);

      balance = await usdcC.balanceOf(usdcHolder.getAddress());
      balanceAlice = await usdcC.balanceOf(alice.getAddress());
      console.log(
        "Balance of USDC Holder:",
        ethers.utils.formatUnits(balance, 6),
        "\nBalance of USDC ALICE:",
        ethers.utils.formatUnits(balanceAlice, 6)
      );

      const usdc = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
      const dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
        
      const Swapper = await ethers.getContractFactory("Swapper");
      const swapper = await Swapper.deploy(usdc,dai);
      
      await swapper.deployed();
      console.log(
        "Contract Address:",
        swapper.address
      )
      //await expect (swapper.provide(1)).to.be.revertedWith("Not enough tokens");
      await swapper.approval({'from': alice.address});
      await swapper.provide(ethers.utils.parseUnits("1.0", 6));

  
      //await greeter.setGreeting("Hola, mundo!");
      //expect(await greeter.greet()).to.equal("Hola, mundo!");
    });
  });
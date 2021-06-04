const { expect } = require("chai");
const { ethers } = require("hardhat");
const { daiAddress, daiAbi } = require("../scripts/daiContract.js");
const { usdcAddress, usdcAbi } = require("../scripts/usdcContract.js");

describe("Swapper Contract", function(){

  let usdcContract;
  let usdcHolder;
  let Swapper;
  let swapper;
  let alice;
  let bob;
  let usdc = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  let dai = "0x6b175474e89094c44da98b954eedeac495271d0f";



  beforeEach(async function (){

    await ethers.provider.send('hardhat_impersonateAccount', ['0x0548f59fee79f8832c299e01dca5c76f034f558e']);
    usdcHolder = await ethers.provider.getSigner('0x0548f59fee79f8832c299e01dca5c76f034f558e');    
    usdcContract = new ethers.Contract(usdcAddress, usdcAbi, usdcHolder); 
    
    [alice, bob] = await ethers.getSigners();
    
    const balance = await usdcContract.balanceOf(usdcHolder.getAddress());

    console.log(
      "Balance of USDC Holder:",
      ethers.utils.formatUnits(balance, 6)
    );
      
    Swapper = await ethers.getContractFactory("Swapper");
    swapper = await Swapper.deploy(usdc,usdc);
    
    await swapper.deployed();
    console.log(
      "Contract Address:",
      swapper.address
    )


  });


  describe("Provide Functions", function() {    

    it("Should fail if sender doesn't have enough tokens", async function() {

      await expect (swapper.connect(alice).provide(1)).to.be.revertedWith("Not enough tokens");

      //expect(await greeter.greet()).to.equal("Hola, mundo!");
    });

    it("Should fail if sender doesn't have enough allowance", async function(){
      
      await expect (swapper.connect(usdcHolder).provide(1)).to.be.revertedWith("Not enough allowance");

    });

    it("Should extract fromToken from user", async function(){
      
      const amount = 1000000;
      const balanceIn = ethers.utils.formatUnits(await usdcContract.balanceOf(usdcHolder.getAddress()), 6);
      await usdcContract.approve(swapper.address,100000000);
      await swapper.connect(usdcHolder).provide(amount);
      const balanceOut = ethers.utils.formatUnits(await usdcContract.balanceOf(usdcHolder.getAddress()), 6);
      expect(balanceOut-0).to.equal(balanceIn - amount/10**6);

    });

    it("Should deposit fromToken to swapper contract", async function(){
      
      const amount = 1000000;
      const balanceIn = ethers.utils.formatUnits(await usdcContract.balanceOf(swapper.address), 6);
      await usdcContract.approve(swapper.address,100000000);
      await swapper.connect(usdcHolder).provide(amount);
      const balanceOut = ethers.utils.formatUnits(await usdcContract.balanceOf(swapper.address), 6);
      expect(balanceIn-0).to.equal(balanceOut - amount/10**6);

    });

    it("Should get update balance of user in the swapper contract", async function(){
      
      const amount = 1000000;
      const balanceIn =  await swapper.connect(usdcHolder).balanceOf(usdc,usdcHolder.getAddress());
      await usdcContract.approve(swapper.address,100000000);
      await swapper.connect(usdcHolder).provide(amount);
      const balanceOut = await swapper.connect(usdcHolder).balanceOf(usdc,usdcHolder.getAddress());
      expect(balanceIn).to.equal(balanceOut - amount);

    });




  });
});
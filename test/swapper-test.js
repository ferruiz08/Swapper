const { expect } = require("chai");
const { ethers } = require("hardhat");
const { daiAddress, daiAbi } = require("../scripts/daiContract.js");
const { usdcAddress, usdcAbi } = require("../scripts/usdcContract.js");
const { wethAddress, wethAbi } = require("../scripts/wethContract.js");

describe("Swapper Contract", function(){

  let daiContract;
  let wethContract;

  let fromTokenContract;
  let toTokenContract;

  let Swapper;
  let swapper;
  let SwapperJob;
  let swapperJob;
  let alice;
  let bob;

  let dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
  let weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  let holderAddress = "0x0548f59fee79f8832c299e01dca5c76f034f558e";

  
    /*##############################################
    * Change this for diferent from and to Token tests
    * #############################################
    */

    let fromToken = weth;
    let toToken = dai;

    /*##############################################
    * Change this for diferent from and to Token tests
    * #############################################
    */

  before(async function (){

    await network.provider.request({
        method: "hardhat_reset",
        params: [{
          forking: {
            jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/FmCjZNdLHvSEBsNYPXvsCJStTOU5Z8Vb",
            blockNumber: 12570733
          }
        }]
      })  

  });    
  

  beforeEach(async function (){

    await ethers.provider.send('hardhat_impersonateAccount', [holderAddress]);
    holder = await ethers.provider.getSigner(holderAddress);    

    usdcContract = new ethers.Contract(usdcAddress, usdcAbi, holder); 
    daiContract = new ethers.Contract(daiAddress, daiAbi, holder);
    wethContract = new ethers.Contract(wethAddress, wethAbi, holder);


    if(fromToken == dai && toToken == weth){
      fromTokenContract = daiContract;
      toTokenContract = wethContract;
    }

    if(fromToken == weth && toToken == dai){
      fromTokenContract = wethContract;
      toTokenContract = daiContract;
    }

    [alice, bob] = await ethers.getSigners();


    console.log(
      "Balance of fromToken Holder:",
      ethers.utils.formatUnits(await fromTokenContract.balanceOf(holder.getAddress()), 18)
    );

     
    Swapper = await ethers.getContractFactory("Swapper");
    swapper = await Swapper.deploy(fromToken,toToken);
    await swapper.deployed();

    await toTokenContract.transfer(swapper.address,ethers.utils.parseEther("10.0"));

    console.log(
      "Swapper Contract Address:",
      swapper.address
    )
    
    console.log(
      "Balance of toToken Contract:",
      ethers.utils.formatUnits(await toTokenContract.balanceOf(swapper.address), 18)
    );

    SwapperJob = await ethers.getContractFactory("SwapperJob");
    swapperJob = await SwapperJob.deploy(swapper.address);
    await swapperJob.deployed();

    console.log(
      "SwapperJob Contract Address:",
      swapperJob.address
    );
      
  });


  describe("Provide Functions", function() {    

    it("Should fail if sender doesn't have enough tokens", async function() {

      const amount = ethers.utils.parseEther("1.0");
      await expect (swapper.connect(alice).provide(amount)).to.be.revertedWith("Not enough tokens");

    });

    it("Should fail if sender doesn't have enough allowance", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      await expect (swapper.connect(holder).provide(amount)).to.be.revertedWith("Not enough allowance");

    });

    it("Should extract fromToken from user", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      const balanceIn = ethers.utils.formatUnits(await fromTokenContract.balanceOf(holder.getAddress()), 18);

      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = ethers.utils.formatUnits(await fromTokenContract.balanceOf(holder.getAddress()), 18);
      
      expect(balanceOut - ethers.utils.formatUnits(0, 18)).to.equal(balanceIn - ethers.utils.formatUnits(amount, 18));

    });

    it("Should deposit fromToken to swapper contract", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      const balanceIn = ethers.utils.formatUnits(await fromTokenContract.balanceOf(swapper.address), 18);

      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = ethers.utils.formatUnits(await fromTokenContract.balanceOf(swapper.address), 18);

      expect(balanceIn - ethers.utils.formatUnits(0, 18)).to.equal(balanceOut - ethers.utils.formatUnits(amount, 18));

    });

    it("Should get update balance of user in the swapper contract", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      const balanceIn =  await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());

      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());

      expect(balanceIn).to.equal(balanceOut - amount);

    });

    it("Should get update balance of user in the swapper contract accumulating", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      const balanceIn =  await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
 
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());

      expect(balanceIn).to.equal(balanceOut - amount - amount);

    });

  });

  describe("Swap Functions", function(){
    
    it("Should fail if fromToken is empty", async function(){

      await expect (swapper.connect(holder).swap()).to.be.revertedWith("fromToken cannot be empty");

    });  
    
    it("Should swap the fromToken balance to toToken balance 1:1", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceInFromToken =  await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceInToToken =  await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      await swapper.connect(holder).swap();

      const balanceOutFromToken = await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceOutToToken = await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      expect(balanceOutFromToken).to.equal(0);
      expect(balanceInToToken).to.equal(balanceOutToToken - amount);

    });


    it("Should swap the fromToken balance to toToken balance 1:1 accumulating", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceInFromToken =  await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceInToToken =  await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      await swapper.connect(holder).swap();
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);
      await swapper.connect(holder).swap();

      const balanceOutFromToken = await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceOutToToken = await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      expect(balanceOutFromToken).to.equal(0);
      expect(balanceInToToken).to.equal(balanceOutToToken - amount - amount);

    });

  });
  

  describe("Withdraw Functions", function(){
  
    it("Should fail if toToken is empty", async function(){

      await expect (swapper.connect(holder).withdraw()).to.be.revertedWith("toToken cannot be empty");

    });

    it("Should withdraw the balance to toToken", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceIn =  ethers.utils.formatUnits(await toTokenContract.balanceOf(holder.getAddress()), 18);

      await swapper.connect(holder).swap();
      await swapper.connect(holder).withdraw();

      const balanceOut = ethers.utils.formatUnits(await toTokenContract.balanceOf(holder.getAddress()), 18);

      expect(balanceIn - ethers.utils.formatUnits(0, 18)).to.equal(balanceOut - ethers.utils.formatUnits(amount, 18));

    });

  });



});
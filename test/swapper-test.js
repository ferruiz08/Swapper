const { expect } = require("chai");
const { ethers } = require("hardhat");
const { daiAddress, daiAbi } = require("../scripts/daiContract.js");
const { usdcAddress, usdcAbi } = require("../scripts/usdcContract.js");
const { wethAddress, wethAbi } = require("../scripts/wethContract.js");
const { keep3Address, keep3Abi } = require("../scripts/keep3Contract.js");

describe("Swapper Contract", function(){

  let usdcContract;
  let daiContract;
  let wethContract;
  let keep3Contract;
  let holder;
  let keep3Governance
  let keeper;
  let Swapper;
  let swapper;
  let SwapperJob;
  let swapperJob;
  let alice;
  let bob;
  let usdc = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  let dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
  let weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  let holderAddress = "0x0548f59fee79f8832c299e01dca5c76f034f558e";
  let keep3GovernanceAddress = "0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83";
  let keeperAddress = "0xCC85DA708A4EE036F2E1CF4b75DCaDf49a3382cF";

  before(async function(){
    await ethers.provider.send('hardhat_impersonateAccount', [holderAddress]);
    holder = await ethers.provider.getSigner(holderAddress);    
    await ethers.provider.send('hardhat_impersonateAccount', [keep3GovernanceAddress]);
    keep3Governance = await ethers.provider.getSigner(keep3GovernanceAddress);  
    await ethers.provider.send('hardhat_impersonateAccount', [keeperAddress]);
    keeper = await ethers.provider.getSigner(keeperAddress); 

    usdcContract = new ethers.Contract(usdcAddress, usdcAbi, holder); 
    daiContract = new ethers.Contract(daiAddress, daiAbi, holder);
    wethContract = new ethers.Contract(wethAddress, wethAbi, holder);
    keep3Contract = new ethers.Contract(keep3Address, keep3Abi, keep3Governance);

    [alice, bob] = await ethers.getSigners();

    const signer = ethers.provider.getSigner()
    const tx = signer.sendTransaction({
      to: keep3GovernanceAddress,
      value: ethers.utils.parseEther("1.0")
  });


  });

  beforeEach(async function (){

    

    console.log(
      "Balance of WETH Holder:",
      ethers.utils.formatUnits(await wethContract.balanceOf(holder.getAddress()), 18)
    );
      
    Swapper = await ethers.getContractFactory("Swapper");
    swapper = await Swapper.deploy(weth,dai);
    await swapper.deployed();

    await daiContract.transfer(swapper.address,ethers.utils.parseEther("100.0"));

    console.log(
      "Swapper Contract Address:",
      swapper.address
    )
    
    console.log(
      "Balance of DAI Contract:",
      ethers.utils.formatUnits(await daiContract.balanceOf(swapper.address), 18)
    );

    SwapperJob = await ethers.getContractFactory("SwapperJob");
    swapperJob = await SwapperJob.deploy(swapper.address);
    await swapperJob.deployed();

    console.log(
      "SwapperJob Contract Address:",
      swapperJob.address
    );
    
    
    await keep3Contract.connect(keep3Governance).addJob(swapperJob.address);

      
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
      const balanceIn = ethers.utils.formatUnits(await wethContract.balanceOf(holder.getAddress()), 18);

      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = ethers.utils.formatUnits(await wethContract.balanceOf(holder.getAddress()), 18);
      
      expect(balanceOut - ethers.utils.formatUnits(0, 18)).to.equal(balanceIn - ethers.utils.formatUnits(amount, 18));

    });

    it("Should deposit fromToken to swapper contract", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      const balanceIn = ethers.utils.formatUnits(await wethContract.balanceOf(swapper.address), 18);

      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = ethers.utils.formatUnits(await wethContract.balanceOf(swapper.address), 18);

      expect(balanceIn - ethers.utils.formatUnits(0, 18)).to.equal(balanceOut - ethers.utils.formatUnits(amount, 18));

    });

    it("Should get update balance of user in the swapper contract", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      const balanceIn =  await swapper.connect(holder).balanceOf(weth,holder.getAddress());

      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = await swapper.connect(holder).balanceOf(weth,holder.getAddress());

      expect(balanceIn).to.equal(balanceOut - amount);

    });

    it("Should get update balance of user in the swapper contract accumulating", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      const balanceIn =  await swapper.connect(holder).balanceOf(weth,holder.getAddress());
 
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceOut = await swapper.connect(holder).balanceOf(weth,holder.getAddress());

      expect(balanceIn).to.equal(balanceOut - amount - amount);

    });

  });

  describe("Swap Functions", function(){
    
    it("Should fail if fromToken is empty", async function(){

      await expect (swapper.connect(holder).swap()).to.be.revertedWith("fromToken cannot be empty");

    });  
    
    it("Should swap the fromToken balance to toToken balance 1:1", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceInFromToken =  await swapper.connect(holder).balanceOf(weth,holder.getAddress());
      const balanceInToToken =  await swapper.connect(holder).balanceOf(dai,holder.getAddress());

      await swapper.connect(holder).swap();

      const balanceOutFromToken = await swapper.connect(holder).balanceOf(weth,holder.getAddress());
      const balanceOutToToken = await swapper.connect(holder).balanceOf(dai,holder.getAddress());

      expect(balanceOutFromToken).to.equal(0);
      expect(balanceInToToken).to.equal(balanceOutToToken - amount);

    });

    it("Should swap the fromToken balance to toToken balance 1:1 accumulating", async function(){
      
      const amount = ethers.utils.parseEther("1.0");
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceInFromToken =  await swapper.connect(holder).balanceOf(weth,holder.getAddress());
      const balanceInToToken =  await swapper.connect(holder).balanceOf(dai,holder.getAddress());

      await swapper.connect(holder).swap();
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);
      await swapper.connect(holder).swap();

      const balanceOutFromToken = await swapper.connect(holder).balanceOf(weth,holder.getAddress());
      const balanceOutToToken = await swapper.connect(holder).balanceOf(dai,holder.getAddress());

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
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceIn =  ethers.utils.formatUnits(await daiContract.balanceOf(holder.getAddress()), 18);

      await swapper.connect(holder).swap();
      await swapper.connect(holder).withdraw();

      const balanceOut = ethers.utils.formatUnits(await daiContract.balanceOf(holder.getAddress()), 18);

      expect(balanceIn - ethers.utils.formatUnits(0, 18)).to.equal(balanceOut - ethers.utils.formatUnits(amount, 18));

    });

  });

  describe("Keep3 Jobs", function(){

    it("should fail if is not a valid keeper", async function(){

      await expect (swapperJob.connect(holder).work(holder.getAddress())).to.be.revertedWith("Not a valid keeper");

    });

    it("should fail if is not enough credits", async function(){

      const amount = ethers.utils.parseEther("1.0");
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      await expect (swapperJob.connect(keeper).work(holder.getAddress())).to.be.reverted;

    });

    it("Should swap the fromToken balance to toToken balance 1:1 from keeper job", async function(){
      
      await wethContract.approve(keep3Address,ethers.utils.parseEther("10.0"));
      await keep3Contract.connect(holder).addCredit(wethAddress,swapperJob.address,ethers.utils.parseEther("10.0"));


      const amount = ethers.utils.parseEther("1.0");
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceInFromToken =  await swapper.connect(holder).balanceOf(weth,holder.getAddress());
      const balanceInToToken =  await swapper.connect(holder).balanceOf(dai,holder.getAddress());

      await swapperJob.connect(keeper).work(holder.getAddress());

      const balanceOutFromToken = await swapper.connect(holder).balanceOf(weth,holder.getAddress());
      const balanceOutToToken = await swapper.connect(holder).balanceOf(dai,holder.getAddress());

      expect(balanceOutFromToken).to.equal(0);
      expect(balanceInToToken).to.equal(balanceOutToToken - amount);

    });

    it("should fail if time not elapsed", async function(){
     
      await wethContract.approve(keep3Address,ethers.utils.parseEther("10.0"));
      await keep3Contract.connect(holder).addCredit(wethAddress,swapperJob.address,ethers.utils.parseEther("10.0"));
      
      const amount = ethers.utils.parseEther("1.0");
      await wethContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);
      
      await swapperJob.connect(keeper).work(holder.getAddress());

      await expect (swapperJob.connect(keeper).work(holder.getAddress())).to.be.revertedWith("Time not elapsed");

    });



  });

});
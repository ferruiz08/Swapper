const { expect } = require("chai");
const { ethers } = require("hardhat");
const { daiAddress, daiAbi } = require("../scripts/daiContract.js");
const { usdcAddress, usdcAbi } = require("../scripts/usdcContract.js");
const { wethAddress, wethAbi } = require("../scripts/wethContract.js");
const { keep3Address, keep3Abi } = require("../scripts/keep3Contract.js");

describe("SwapperJob Contract", function(){

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
  let dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
  let weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  let holderAddress = "0x0548f59fee79f8832c299e01dca5c76f034f558e";
  let keep3GovernanceAddress = "0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83";
  let keeperAddress = "0xCC85DA708A4EE036F2E1CF4b75DCaDf49a3382cF";

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
    await ethers.provider.send('hardhat_impersonateAccount', [keep3GovernanceAddress]);
    keep3Governance = await ethers.provider.getSigner(keep3GovernanceAddress);  
    await ethers.provider.send('hardhat_impersonateAccount', [keeperAddress]);
    keeper = await ethers.provider.getSigner(keeperAddress); 

    usdcContract = new ethers.Contract(usdcAddress, usdcAbi, holder); 
    daiContract = new ethers.Contract(daiAddress, daiAbi, holder);
    wethContract = new ethers.Contract(wethAddress, wethAbi, holder);
    keep3Contract = new ethers.Contract(keep3Address, keep3Abi, keep3Governance);

    if(fromToken == dai && toToken == weth){
      fromTokenContract = daiContract;
      toTokenContract = wethContract;
    }

    if(fromToken == weth && toToken == dai){
      fromTokenContract = wethContract;
      toTokenContract = daiContract;
    }

    const signer = ethers.provider.getSigner()
    const tx = signer.sendTransaction({
      to: keep3GovernanceAddress,
      value: ethers.utils.parseEther("1.0")
  });

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
    
    
    await keep3Contract.connect(keep3Governance).addJob(swapperJob.address);

      
  });

  describe("Keep3 Jobs", function(){

    it("should fail if is not a valid keeper", async function(){

      await expect (swapperJob.connect(holder).work(holder.getAddress())).to.be.revertedWith("Not a valid keeper");

    });

    it("should fail if is not enough credits", async function(){

      const amount = ethers.utils.parseEther("1.0");
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      await expect (swapperJob.connect(keeper).work(holder.getAddress())).to.be.reverted;

    });

    it("Should swap the fromToken balance to toToken balance 1:1 from keeper job", async function(){
      
      await wethContract.approve(keep3Address,ethers.utils.parseEther("10.0"));
      await keep3Contract.connect(holder).addCredit(wethAddress,swapperJob.address,ethers.utils.parseEther("10.0"));


      const amount = ethers.utils.parseEther("1.0");
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);

      const balanceInFromToken =  await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceInToToken =  await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      await swapperJob.connect(keeper).work(holder.getAddress());

      const balanceOutFromToken = await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceOutToToken = await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      expect(balanceOutFromToken).to.equal(0);
      expect(balanceInToToken).to.equal(balanceOutToToken - amount);

    });

    it("Should swap the fromToken balance to toToken balance across Uniswap from keeper job", async function(){
      
      await wethContract.approve(keep3Address,ethers.utils.parseEther("10.0"));
      await keep3Contract.connect(holder).addCredit(wethAddress,swapperJob.address,ethers.utils.parseEther("10.0"));

      const amount = ethers.utils.parseEther("0.001");
      const amountWeth_Dai = 2712296446649462846;
      const amountDai_Weth = 366482410350;
      let amountConv;
      fromToken == weth ? amountConv = amountWeth_Dai : amountConv = amountDai_Weth;

      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);
      
      const balanceInFromToken =  await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceInToToken =  await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      await swapperJob.connect(keeper).workV2(holder.getAddress());

      const balanceOutFromToken = await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
      const balanceOutToToken = await swapper.connect(holder).balanceOf(toToken,holder.getAddress());

      expect(balanceOutFromToken).to.equal(0);
      expect(balanceInToToken).to.equal(balanceOutToToken - amountConv);      

    });

    it("should fail if time not elapsed", async function(){
     
      await wethContract.approve(keep3Address,ethers.utils.parseEther("10.0"));
      await keep3Contract.connect(holder).addCredit(weth,swapperJob.address,ethers.utils.parseEther("10.0"));
      
      const amount = ethers.utils.parseEther("1.0");
      await fromTokenContract.approve(swapper.address,amount);
      await swapper.connect(holder).provide(amount);
      
      await swapperJob.connect(keeper).work(holder.getAddress());

      await expect (swapperJob.connect(keeper).work(holder.getAddress())).to.be.revertedWith("Time not elapsed");

    });

  });
});
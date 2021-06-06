const { expect } = require("chai");
const { ethers } = require("hardhat");
const { daiAddress, daiAbi } = require("../scripts/daiContract.js");
const { usdcAddress, usdcAbi } = require("../scripts/usdcContract.js");
const { wethAddress, wethAbi } = require("../scripts/wethContract.js");

describe("Swapper Contract across Uniswap", function(){

  let daiContract;
  let wethContract;

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
 
  beforeEach(async function (){

    await network.provider.request({
        method: "hardhat_reset",
        params: [{
          forking: {
            jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/FmCjZNdLHvSEBsNYPXvsCJStTOU5Z8Vb",
            blockNumber: 12570733
          }
        }]
      })
    
    await ethers.provider.send('hardhat_impersonateAccount', [holderAddress]);
    holder = await ethers.provider.getSigner(holderAddress);    

    usdcContract = new ethers.Contract(usdcAddress, usdcAbi, holder); 
    daiContract = new ethers.Contract(daiAddress, daiAbi, holder);
    wethContract = new ethers.Contract(wethAddress, wethAbi, holder);

    [alice, bob] = await ethers.getSigners();

    if(fromToken == dai && toToken == weth){
        fromTokenContract = daiContract;
        toTokenContract = wethContract;
      }
  
      if(fromToken == weth && toToken == dai){
        fromTokenContract = wethContract;
        toTokenContract = daiContract;
      }

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

    describe("Swap Functions across Uniswap", function(){
        it("Should swap the fromToken balance to toToken balance accross Uniswap", async function(){
            
            const amount = ethers.utils.parseEther("0.001");
            const amountWeth_Dai = 2712296446649462846;
            const amountDai_Weth = 366482410350;
            let amountConv;
            fromToken == weth ? amountConv = amountWeth_Dai : amountConv = amountDai_Weth;

            await fromTokenContract.approve(swapper.address,amount);
            await swapper.connect(holder).provide(amount);
            
            const balanceInFromToken =  await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
            const balanceInToToken =  await swapper.connect(holder).balanceOf(toToken,holder.getAddress());
      
            await swapper.connect(holder).swapV2();
            const balanceOutFromToken = await swapper.connect(holder).balanceOf(fromToken,holder.getAddress());
            const balanceOutToToken = await swapper.connect(holder).balanceOf(toToken,holder.getAddress());
      
            expect(balanceOutFromToken).to.equal(0);
            expect(balanceInToToken).to.equal(balanceOutToToken - amountConv);
      
          });
    });

    describe("Withdraw Functions across Uniswap", function(){
        
        it("Should fail if toToken is empty", async function(){

            await expect (swapper.connect(holder).withdraw()).to.be.revertedWith("toToken cannot be empty");
  
        });

    });

    it("Should withdraw the balance to toToken", async function(){
      
        const amount = ethers.utils.parseEther("0.001");
        const amountWeth_Dai = 2712296446649462846;
        const amountDai_Weth = 366482410350;
        let amountConv;
        fromToken == weth ? amountConv = amountWeth_Dai : amountConv = amountDai_Weth;

        await fromTokenContract.approve(swapper.address,amount);
        await swapper.connect(holder).provide(amount);
  
        const balanceIn =  ethers.utils.formatUnits(await toTokenContract.balanceOf(holder.getAddress()), 18);
    
        await swapper.connect(holder).swapV2();
        await swapper.connect(holder).withdraw();
  
        const balanceOut = ethers.utils.formatUnits(await toTokenContract.balanceOf(holder.getAddress()), 18);

        expect(balanceIn - ethers.utils.formatUnits(0, 18)).to.equal(balanceOut - amountConv/10**18);
  
      });

});
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./Swapper.sol";
import "../interfaces/IKeep3rV1.sol";
import "@nomiclabs/buidler/console.sol";

contract SwapperJob{

    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    IKeep3rV1 private constant KP3R = IKeep3rV1(0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44);
    IERC20 private immutable weth; 
    address internal constant wethAddress = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); 

    address private immutable swapperContract;
    uint256 private timeLimit;

    constructor (address _swapperContract){

        swapperContract = _swapperContract;
        weth = IERC20(wethAddress);
        timeLimit = block.timestamp - 60000;

    }

    modifier upkeep() {
    require(KP3R.isKeeper(msg.sender), "Not a valid keeper");
    _;
    KP3R.receipt(wethAddress,msg.sender,1 ether);

}

    function work(address _from) public upkeep {
        require(workable(),"Time not elapsed");
        Swapper(swapperContract).swapFrom(_from);
        timeLimit = block.timestamp;

    }

    function workV2(address _from) public upkeep {
        require(workable(),"Time not elapsed");
        Swapper(swapperContract).swapFromV2(_from);
        timeLimit = block.timestamp;

    }

    function workable() internal view returns (bool){
        if(block.timestamp - timeLimit >= 60000)
            return true;
        else 
            return false;
    }

}
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
//import "@nomiclabs/buidler/console.sol";

contract Swapper{

    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    /*Events*/
    event logProvide(address indexed from, uint256 amount);
    event logSwap(address indexed from);
    event logWithdraw(address indexed from, uint256 amount);

    IERC20 private immutable fromToken;
    IERC20 private immutable toToken;

    mapping(IERC20 => mapping(address => uint256)) public balanceOf;

    constructor (IERC20 _fromToken, IERC20 _toToken){
        require(_fromToken != _toToken,"fromToken and toToken are same");
        fromToken = IERC20(_fromToken);
        toToken = IERC20(_toToken);
    }
    
    function provide(uint256 amount) external {
        require(amount > 0, "Amount cannot be empty");
        require(fromToken.balanceOf(msg.sender) >= amount, "Not enough tokens");
        require(fromToken.allowance(msg.sender,address(this)) >= amount, "Not enough allowance");
        
        fromToken.safeTransferFrom(msg.sender,address(this), amount);
        balanceOf[fromToken][msg.sender] = balanceOf[fromToken][msg.sender].add(amount);

        emit logProvide(msg.sender, amount);

    }

    function swap() external {
        require(balanceOf[fromToken][msg.sender] > 0, "fromToken cannot be empty");
        require(toToken.balanceOf(address(this)) >= balanceOf[fromToken][msg.sender], "Not enough toToken balance in the contract");

        balanceOf[toToken][msg.sender] = balanceOf[toToken][msg.sender].add(balanceOf[fromToken][msg.sender]);
        balanceOf[fromToken][msg.sender] = 0;
        
        emit logSwap(msg.sender);
    }

    function swapFrom(address _from) external {
        require(balanceOf[fromToken][_from] > 0, "fromToken cannot be empty");
        require(toToken.balanceOf(address(this)) >= balanceOf[fromToken][_from], "Not enough toToken balance in the contract");

        balanceOf[toToken][_from] = balanceOf[toToken][_from].add(balanceOf[fromToken][_from]);
        balanceOf[fromToken][_from] = 0;
        
        emit logSwap(_from);
    }

    function withdraw() external {
        require(balanceOf[toToken][msg.sender] > 0, "toToken cannot be empty");
        
        uint256 amount = balanceOf[toToken][msg.sender];
        toToken.safeTransfer(msg.sender, amount);
        balanceOf[toToken][msg.sender] = 0;

        emit logWithdraw(msg.sender, amount);
    }

    
}


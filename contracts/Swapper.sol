//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract Swapper{

    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    IERC20 private immutable fromToken;
    IERC20 private immutable toToken;

    mapping(IERC20 => mapping(address => uint256)) public balanceOf;

    constructor (IERC20 _fromToken, IERC20 _toToken){
        //require(_fromToken != address(0), "fromToken cannot be empty");
        //require(_toToken != address(0), "toToken cannot be empty");
        fromToken = _fromToken;
        toToken = _toToken;

    }
    
    function provide(uint256 amount) external {

    }
}
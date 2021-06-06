//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "@nomiclabs/buidler/console.sol";


contract Swapper {

    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    /*Events*/
    event logProvide(address indexed from, uint256 amount);
    event logSwap(address indexed from);
    event logWithdraw(address indexed from, uint256 amount);

    address private immutable fromToken;
    address private immutable toToken;

    address internal constant _uniswapRouter =
        address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    mapping(address => mapping(address => uint256)) public balanceOf;

    constructor (address _fromToken, address _toToken){
        require(_fromToken != _toToken,"fromToken and toToken are same");
        fromToken = _fromToken;
        toToken = _toToken;
    }
    
    function provide(uint256 amount) external {
        require(amount > 0, "Amount cannot be empty");
        require(IERC20(fromToken).balanceOf(msg.sender) >= amount, "Not enough tokens");
        require(IERC20(fromToken).allowance(msg.sender,address(this)) >= amount, "Not enough allowance");
        
        IERC20(fromToken).safeTransferFrom(msg.sender,address(this), amount);
        balanceOf[fromToken][msg.sender] = balanceOf[fromToken][msg.sender].add(amount);

        emit logProvide(msg.sender, amount);

    }

    function swap() external {
        require(balanceOf[fromToken][msg.sender] > 0, "fromToken cannot be empty");
        require(IERC20(toToken).balanceOf(address(this)) >= balanceOf[fromToken][msg.sender], "Not enough toToken balance in the contract");

        balanceOf[toToken][msg.sender] = balanceOf[toToken][msg.sender].add(balanceOf[fromToken][msg.sender]);
        balanceOf[fromToken][msg.sender] = 0;
        
        emit logSwap(msg.sender);
    }

    function swapFrom(address _from) external {
        require(balanceOf[fromToken][_from] > 0, "fromToken cannot be empty");
        require(IERC20(toToken).balanceOf(address(this)) >= balanceOf[fromToken][_from], "Not enough toToken balance in the contract");

        balanceOf[toToken][_from] = balanceOf[toToken][_from].add(balanceOf[fromToken][_from]);
        balanceOf[fromToken][_from] = 0;
        
        emit logSwap(_from);
    }

    function swapV2() external {
         
        require(balanceOf[fromToken][msg.sender] > 0, "fromToken cannot be empty");
        uint256 balanceIn = IERC20(toToken).balanceOf(address(this));

        uint256 amount = balanceOf[fromToken][msg.sender];
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        address[] memory path = new address[](2);
        path[0] = fromToken;
        path[1] = toToken;
        IERC20(fromToken).safeApprove(_uniswapRouter, amount);
        uniswapRouter.swapExactTokensForTokens(
                amount,
                0,
                path,
                address(this),
                block.timestamp + 30
        );
        uint256 balanceOut = IERC20(toToken).balanceOf(address(this));

        uint256 amountTransfered = balanceOut-balanceIn;
        balanceOf[toToken][msg.sender] = balanceOf[toToken][msg.sender].add(amountTransfered);
        balanceOf[fromToken][msg.sender] = 0;

        emit logSwap(msg.sender);

    }

    function swapFromV2(address _from) external {
         
        require(balanceOf[fromToken][_from] > 0, "fromToken cannot be empty");
        uint256 balanceIn = IERC20(toToken).balanceOf(address(this));

        uint256 amount = balanceOf[fromToken][_from];
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        address[] memory path = new address[](2);
        path[0] = fromToken;
        path[1] = toToken;
        IERC20(fromToken).safeApprove(_uniswapRouter, amount);
        uniswapRouter.swapExactTokensForTokens(
                amount,
                0,
                path,
                address(this),
                block.timestamp + 30
        );
        uint256 balanceOut = IERC20(toToken).balanceOf(address(this));

        uint256 amountTransfered = balanceOut-balanceIn;
        balanceOf[toToken][_from] = balanceOf[toToken][_from].add(amountTransfered);
        balanceOf[fromToken][_from] = 0;

        emit logSwap(_from);

    }

    function withdraw() external {
        require(balanceOf[toToken][msg.sender] > 0, "toToken cannot be empty");
        
        uint256 amount = balanceOf[toToken][msg.sender];
        IERC20(toToken).safeTransfer(msg.sender, amount);
        balanceOf[toToken][msg.sender] = 0;

        emit logWithdraw(msg.sender, amount);
    }

    
}


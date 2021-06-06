//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

interface IKeep3rV1 {
    function isKeeper(address) external returns (bool);
    function worked(address keeper) external;
    function receipt(address credit, address keeper, uint amount) external;
}
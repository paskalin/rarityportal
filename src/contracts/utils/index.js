import { ethers } from "ethers";

const getContract = (connection, address, abi) => {
  const { account, library } = connection;
  const signer = account ? library?.getSigner(account) : library;
  return new ethers.Contract(address, abi, signer);
};

const wait = (seconds = 1) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const utils = {
  getContract,
  wait,
};

export default utils;

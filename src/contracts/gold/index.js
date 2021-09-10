import { ethers } from "ethers";
import abi from "./abi.json";

import utils from "../utils";
import rarity from "../rarity";
import names from "../names";

const GOLD_ADDRESS = "0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2";

const getContract = (connection) =>
  utils.getContract(connection, GOLD_ADDRESS, abi);

const claimGold = async (connection, summoner, print) => {
  const contract = getContract(connection);
  const claimable = await contract.claimable(summoner.id);
  const name = names.formatName(summoner);
  if (!claimable.isZero()) {
    print(`${name} is claiming ${ethers.utils.formatEther(claimable)} gold`);
    const tx = await contract.adventure(summoner.id);
    await tx.wait();
    print(`${name} claimed ${ethers.utils.formatEther(claimable)} gold`);
  } else {
    print(`${name} has no gold to claim`);
  }
};

const claimGoldAll = async (connection, print) => {
  const summoners = await rarity.getSummoners(connection);
  for (let i = 0; i < summoners.length; i++) {
    await claimGold(connection, summoners[i], print);
  }
};

const gold = {
  claimGoldAll,
};

export default gold;

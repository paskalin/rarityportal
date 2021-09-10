import abi from "./abi.json";

import utils from "../utils";

const NAMES_ADDRESS = "0x4c40CE3fb33A6781c903Bc830804DE4195Cc966f";

const getContract = (connection) =>
  utils.getContract(connection, NAMES_ADDRESS, abi);

const setName = async (connection, summoner, name, print) => {
  print(`changing summoner ${summoner}'s name to ${name}...`);
  const contract = getContract(connection);
  const tx = await contract.set_name(summoner, name);
  await tx.wait();
  let newName;
  while (newName !== name) {
    newName = await contract.summoner_name(summoner);
    await utils.wait();
  }
  print(`summoner ${summoner}'s name was changed to ${name}`);
};

const getName = async (connection, summoner) => {
  const contract = getContract(connection);
  const name = await contract.summoner_name(summoner);
  return name;
};

const formatName = (summoner) =>
  summoner.name ? `${summoner.name}` : `summoner ${summoner.id}`;

const names = {
  setName,
  getName,
  formatName,
};

export default names;

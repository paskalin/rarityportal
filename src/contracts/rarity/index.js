import { BigNumber } from "ethers";
import formatDistanceStrict from "date-fns/formatDistanceStrict";
import isAfter from "date-fns/isAfter";

import utils from "../utils";
import names from "../names";

import abi from "./abi.json";

const RARITY_ADDRESS = "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb";
const SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/eabz/rarity";
const classes = [
  "none",
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "wizard",
];

const getContract = (connection) =>
  utils.getContract(connection, RARITY_ADDRESS, abi);

const getClasses = () => classes.filter((c) => c !== "none");

const summon = async (connection, print, choice) => {
  print(`summoning ${choice}...`);
  const id = classes.indexOf(choice);
  const contract = getContract(connection);
  const tx = await contract.summon(id);
  await tx.wait();
  print(`${choice} has been summoned`);
};

const nextAdventure = (log) => {
  const timestamp = new Date(log.toNumber() * 1000);
  const now = new Date();

  if (isAfter(now, timestamp)) {
    return "now";
  }

  return formatDistanceStrict(now, timestamp);
};

const getSummoners = async (connection, print) => {
  if (print) {
    print("listing all summoners...");
  }
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query GetSummoners($owner: Bytes!) {
          summoners(where: { owner: $owner }) {
            id
            owner
            _class
            _level
          }
        }
      `,
      variables: {
        owner: connection.account,
      },
    }),
  });
  const json = await response.json();
  const contract = getContract(connection);
  if (json.data.summoners && json.data.summoners.length) {
    const summoners = await Promise.all(
      json.data.summoners.map(async ({ owner, id, _class, _level }) => {
        const xp = await contract.xp(id);
        const xpRequired = await contract.xp_required(_level);
        const log = await contract.adventurers_log(id);

        const summoner = {
          id: BigNumber.from(id).toString(),
          owner,
          class: classes[_class],
          level: _level,
          xp,
          xpRequired,
          log,
        };
        const name = await names.getName(connection, id);

        const levelup = (summoner) => {
          const progress = Number(
            (
              (Number(summoner.xp.toString()) /
                Number(summoner.xpRequired.toString())) *
              100
            ).toFixed(0)
          );
          let p = "";
          for (let i = 0; i < 11; i++) {
            const num = i * 10;
            if (progress >= num) {
              p += "\u2588";
            } else {
              p += "\u2591";
            }
          }
          return `${p} ${progress}%`;
        };

        if (print) {
          print(
            `id: ${summoner.id}\n${name ? `name: ${name}\n` : ""}class: ${
              summoner.class
            }\nnext adventure: ${nextAdventure(summoner.log)}\nlevel: ${
              summoner.level
            }\nlevel progress: ${levelup(summoner)}\n\n`
          );
        }
        if (name) {
          return { ...summoner, name };
        }
        return summoner;
      })
    );
    return summoners;
  }
};

const list = async (connection, print) => getSummoners(connection, print);

const adventure = async (connection, summoner, print) => {
  const contract = getContract(connection);
  const log = await contract.adventurers_log(summoner.id);
  const timestamp = log.toNumber() * 1000;
  const now = new Date().getTime();
  const name = names.formatName(summoner);
  if (now > timestamp) {
    print(`${name} is going on an adventure...`);
    const tx = await contract.adventure(summoner.id);
    await tx.wait();
    print(`${name} completed their adventure`);
  } else {
    print(`${name} can go on an adventure in ${nextAdventure(log)}`);
  }
};

const adventureAll = async (connection, print) => {
  const summoners = await getSummoners(connection);
  for (let i = 0; i < summoners.length; i++) {
    await adventure(connection, summoners[i], print);
  }
};

const rarity = {
  getSummoners,
  adventureAll,
  classes,
  list,
  summon,
  getClasses,
};

export default rarity;

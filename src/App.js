import { useEffect, useRef } from "react";
import Terminal from "terminal-in-react";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";

import "./App.css";

import rarity from "./contracts/rarity";
import names from "./contracts/names";
import gold from "./contracts/gold";

const injected = new InjectedConnector({ supportedChainIds: [250] });

const network = new NetworkConnector({
  defaultChainId: 250,
  urls: {
    250: "https://rpc.ftm.tools/",
  },
});

function getLibrary(provider) {
  return new ethers.providers.Web3Provider(provider);
}

const wait = (seconds = 1) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

function App() {
  const web3 = useWeb3React();

  const { account, activate, deactivate, active, error } = web3;

  const connection = useRef(web3);

  useEffect(() => {
    connection.current = web3;
    if (!account && !active) {
      const knownConnector = localStorage.getItem("connector");
      if (!error && knownConnector === "injected") {
        activate(injected);
      } else {
        activate(network);
      }
    }

    if (error) {
      localStorage.setItem("connector", "");
    }
    // eslint-disable-next-line
  }, [web3]);

  useEffect(() => {
    connection.current = web3;
  }, [web3]);

  const getConnection = () => connection.current;

  const login = async (print) => {
    print("connecting...");
    try {
      await activate(injected, null, true);
      localStorage.setItem("connector", "injected");
      await wait();
      const { account } = getConnection();
      print(`connected to ${account}`);
    } catch (e) {
      print(`${e.message}`);
    }
  };

  const disconnect = (args, print, runCommand) => {
    const { account } = getConnection();
    if (account) {
      deactivate(injected);
      localStorage.setItem("connector", "");
    }
    return `account disconnected`;
  };

  const connect = (args, print, runCommand) => {
    const { account } = getConnection();
    if (account) {
      return `connected to ${account}`;
    } else {
      login(print);
    }
  };

  const check = (print) => {
    const connection = getConnection();
    if (!connection.account) {
      return print(
        "Your account is not connected, please type help for further instuctions"
      );
    }
    return true;
  };

  const summon = (args, print, runCommand) => {
    if (check(print)) {
      const choice = args[1];
      if (!choice || !rarity.classes.includes(choice.toLowerCase())) {
        return print(
          `You must enter one of these classes: ${rarity
            .getClasses()
            .join(", ")}`
        );
      }
      const connection = getConnection();
      rarity.summon(connection, print, choice);
    }
  };

  const summoners = (args, print, runCommand) => {
    if (check(print)) {
      const cmd = args[1];

      const connection = getConnection();

      switch (cmd) {
        case "list":
          rarity.list(connection, print);
          break;
        case "ls":
          rarity.list(connection, print);
          break;
        case "adventure":
          rarity.adventureAll(connection, print);
          break;
        case "gold":
          gold.claimGoldAll(connection, print);
          break;
        default:
          print("You did not enter the correct info");
      }
    }
  };

  const summoner = (args, print, runCommand) => {
    if (check(print)) {
      const id = args[1];

      if (!id) {
        return print("Please specify a summoner id");
      }

      const cmd = args[2];
      if (!cmd) {
        return print("Please specify a command");
      }

      const connection = getConnection();

      switch (cmd) {
        case "name":
          const name = args[3];
          if (!name) {
            return print("Please specify a name for your summoner");
          }
          names.setName(connection, id, name, print);
          break;
        default:
          print("You did not enter the correct info");
      }
    }
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <Terminal
        hideTopBar
        allowTabs={false}
        color="rgb(156, 163, 175)"
        backgroundColor="#101827"
        barColor="black"
        startState="maximised"
        canScroll={false}
        style={{
          fontWeight: "bold",
          fontSize: "1em",
          width: "100%",
        }}
        commands={{
          connect,
          disconnect,
          summon,
          summoners,
          summoner,
        }}
        descriptions={{
          connect: "connect your FTM wallet",
          disconnect: "disconnect your FTM wallet",
          summon: `Usage: summon [class]\n\n    [class] - ${rarity
            .getClasses()
            .join(", ")}`,
          summoners:
            "Usage: summoners [options]\n\n    list - list all owned summoners\n\n    adventure - send all eligible summoners on an adventure\n\n    gold - claim gold for eligible summoners",
          summoner:
            "Usage: summoner [id] [options] e.g. summoner 12412 name Galdur\n\n    name [name] - name a summoner",
          show: false,
        }}
        msg="Welcome to Rarity Portal. Type help below for actions."
      />
    </div>
  );
}

const Wrapper = () => (
  <Web3ReactProvider getLibrary={getLibrary}>
    <App />
  </Web3ReactProvider>
);

export default Wrapper;

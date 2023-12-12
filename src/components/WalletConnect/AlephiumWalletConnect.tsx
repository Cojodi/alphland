import power from "../../assets/icons/power.svg";
import powerLight from "../../assets/icons/powerLight.svg";
import powerorange from "../../assets/icons/powerOrange.svg";
import { useDarkMode } from "../../hooks/useDarkMode";
import { AlephiumConnectButton } from "@alephium/web3-react";
import Image from "next/image";
import React from "react";

const AlephiumWalletConnectButton = () => {
  const { currentTheme } = useDarkMode();

  return (
    <AlephiumConnectButton.Custom>
      {({ isConnected, disconnect, show, account }) => {
        return (
          <button
            onClick={isConnected ? disconnect : show}
            className="group relative flex items-center justify-between border-solid border border-black dark:border-white bg-none rounded-3xl hover:border-orange dark:hover:border-orange px-4 py-[12.5px] lg:py-[10.5px] text-black dark:text-white hover:text-orange dark:hover:text-orange w-full lg:w-auto"
          >
            <div className="font-semibold mr-[20px] flex justify-center lg:justify-start items-center lg:items-start w-full lg:w-auto">
              {isConnected ? "Disconnect" : "Connect"}
            </div>
            <div className="absolute w-[1px] h-full bg-black dark:bg-white right-10 group-hover:bg-orange" />
            <div>
              <div className="flex group-hover:hidden">
                <Image
                  src={currentTheme === "dark" ? powerLight : power}
                  alt="power-icon"
                  className="text-orange"
                  color="orange"
                />
              </div>
              <div className="hidden group-hover:flex">
                <Image
                  src={powerorange}
                  alt="power-icon"
                  className="text-orange"
                  color="orange"
                />
              </div>
            </div>
          </button>
        );
      }}
    </AlephiumConnectButton.Custom>
  );
};
export default AlephiumWalletConnectButton;

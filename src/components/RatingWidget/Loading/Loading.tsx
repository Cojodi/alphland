import loadingAnimation from "../../../assets/dappland-icon-only.json";
import dynamic from "next/dynamic";
import { ReactElement } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function Loading(): ReactElement {
  return <Lottie animationData={loadingAnimation} />;
}

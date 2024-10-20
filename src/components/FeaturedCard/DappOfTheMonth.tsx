import Button from "../Button/Button";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import styled from "styled-components";

interface FeaturedCardProps {
  image: StaticImageData;
  name: string;
  url: string;
  className?: string;
  isHome?: boolean;
}

const StyledCard = styled.div<{ image: StaticImageData }>`
  @media (min-width: 1024px) {
    background-image: ${({ image }) => `url(${image?.src})`};
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
`;

const FeaturedCard = ({
  image,
  name,
  url,
  className,
  isHome,
}: FeaturedCardProps) => {
  return (
    <Link href={url}>
      <StyledCard
        className={[
          "relative mb-16 rounded-xl overflow-hidden cursor-pointer",
          className ? className : "",
          isHome ? "hidden" : "",
        ].join(" ")}
        image={image}
      >
        <div className="flex flex-col lg:flex-col-reverse lg:absolute lg:top-8 lg:left-8 lg:z-[1]">
          <h2 className="font-semibold text-xl leading-none mb-2 lg:bg-black lg:py-2 lg:px-4 lg:font-bold lg:text-[28px] lg:text-white lg:max-w-max">
            Featured Project: {name}
          </h2>
        </div>

        <div className="w-full rounded-xl">
          <Image src={image} alt={name} layout="responsive" />
        </div>
      </StyledCard>
    </Link>
  );
};

export default FeaturedCard;

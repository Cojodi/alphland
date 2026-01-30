import SearchBar from "../SearchBar/SearchBar";

type HeroProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dappCount: number;
};

const Hero = ({ searchQuery, onSearchChange, dappCount }: HeroProps) => {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#2d3548] rounded-2xl p-8 md:p-12 mb-8 md:mb-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          Explore the <span className="text-orange">Alephium</span> Ecosystem.
        </h1>
        <p className="text-white text-lg md:text-xl mb-8 opacity-80">
          Discover {dappCount}+ dApps, tools and services across Alephium.
        </p>
        <div className="max-w-md opacity-90">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search App"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;

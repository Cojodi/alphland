import Link from "next/link";
import Image from "next/image";
import githubLogo from "../../assets/github-icon.svg";
const Footer = () => {
  return (
    <section>
      <footer className="w-full py-6 px-4 border-t border-border-grey dark:border-white/10 flex flex-col md:flex-row justify-between">
        <div className="flex items-center mx-4 mb-4 md:mb-0">
          <Image src={githubLogo} width={50} className="" />
          <p className="text-center font-medium text-base leading-[16px] mx-4 mb-4 md:mb-0">
            Maintained by <Link href="https://github.com/fugashu">Fugashu</Link>{" "}
            & <Link href="https://github.com/msMatix">msMatix</Link>
          </p>
        </div>

        <p className="text-center font-medium text-base leading-[16px] mb-4 md:mb-0">
          <Link href="/disclosure-statement">
            <a className="inline-block mx-2">Disclosure statement</a>
          </Link>
          <Link href="/terms" className="inline-block my-4 mx-4">
            <a className="inline-block mx-2">Terms of use</a>
          </Link>
          <Link href="/privacy" className="inline-block my-4 mx-4">
            <a className="inline-block mx-2">Privacy policy</a>
          </Link>
        </p>
      </footer>
    </section>
  );
};

export default Footer;

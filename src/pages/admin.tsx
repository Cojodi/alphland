// Redirect /admin → /admin/sponsors
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { destination: "/admin/sponsors", permanent: false } };
};

export default function AdminRedirect() {
  return null;
}

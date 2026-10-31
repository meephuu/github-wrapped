import Landing from "@/components/Landing";
import { authConfigured, getSession } from "@/lib/session";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const s = await getSession();
  return (
    <Landing
      error={sp.error}
      detail={sp.detail}
      prefill={sp.u}
      authEnabled={authConfigured()}
      me={s ? { login: s.login, avatarUrl: s.avatarUrl, privateRepos: s.privateRepos } : null}
    />
  );
}

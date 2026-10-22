import type { Metadata } from "next";
import { PageTitle } from "@/components/page-title";
import { PeopleSearch } from "@/components/staff/people-search";
import { getPerson, searchPeople, requireStaffPage } from "@/lib/data";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string; id?: string }> }) {
  await requireStaffPage();
  const { q = "", id } = await searchParams;
  const [results, selected] = await Promise.all([q.trim() ? searchPeople(q) : [], id ? getPerson(id) : null]);
  return (
    <div className="max-w-5xl">
      <PageTitle title="People" description="Search every account across all events." />
      <PeopleSearch query={q} results={results} selected={selected} />
    </div>
  );
}

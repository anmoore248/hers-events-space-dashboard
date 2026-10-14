import type { Metadata } from "next";
import { PageTitle } from "@/components/page-title";
import { PeopleSearch } from "@/components/staff/people-search";
import { people } from "@/lib/mock-data";

export const metadata: Metadata = { title: "People" };

export default function PeoplePage() {
  return (
    <div className="max-w-5xl">
      <PageTitle title="People" description="Search every account across all events." />
      <PeopleSearch people={people} />
    </div>
  );
}

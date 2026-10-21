interface WeekPageProps {
  params: Promise<{ n: string }>;
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { n } = await params;

  return (
    <main>
      <h1>Week {n}</h1>
      <p>Week view placeholder</p>
    </main>
  );
}

interface DayPageProps {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  return (
    <main>
      <h1>Log for {date}</h1>
      <p>Day page editor placeholder</p>
    </main>
  );
}

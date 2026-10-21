interface CoordinatorStudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function CoordinatorStudentPage({
  params,
}: CoordinatorStudentPageProps) {
  const { id } = await params;

  return (
    <main>
      <h1>Student Profile ({id})</h1>
      <p>Student detail placeholder</p>
    </main>
  );
}

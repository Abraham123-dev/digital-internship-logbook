interface CoordinatorReviewPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function CoordinatorReviewPage({
  params,
}: CoordinatorReviewPageProps) {
  const { weekId } = await params;

  return (
    <main>
      <h1>Review Week ({weekId})</h1>
      <p>Week review placeholder</p>
    </main>
  );
}

interface SupervisorReviewPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function SupervisorReviewPage({
  searchParams,
}: SupervisorReviewPageProps) {
  const { token } = await searchParams;

  return (
    <main>
      <h1>Supervisor Review Portal</h1>
      <p>{token ? "Reviewing student submission" : "No validation token provided"}</p>
    </main>
  );
}

// Force dynamic rendering for pages that use Supabase at runtime
export const dynamic = 'force-dynamic';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

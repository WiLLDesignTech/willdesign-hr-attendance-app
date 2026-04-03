import { Card, PageLayout, SectionTitle, TextMuted } from "../../theme/primitives";

export function TeamPage() {
  return (
    <PageLayout>
      <Card>
        <SectionTitle>Team Overview</SectionTitle>
        <TextMuted>No team members loaded</TextMuted>
      </Card>

      <Card>
        <SectionTitle>Flags</SectionTitle>
        <TextMuted>No pending flags</TextMuted>
      </Card>

      <Card>
        <SectionTitle>Surplus Banking</SectionTitle>
        <TextMuted>No surplus requests</TextMuted>
      </Card>

      <Card>
        <SectionTitle>Missing Reports</SectionTitle>
        <TextMuted>All reports submitted</TextMuted>
      </Card>
    </PageLayout>
  );
}

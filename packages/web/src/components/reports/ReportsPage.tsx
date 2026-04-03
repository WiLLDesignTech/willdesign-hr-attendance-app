import { useState } from "react";
import { Card, PageLayout, SectionTitle, TextMuted, FormField, FormLayout, ButtonAccent } from "../../theme/primitives";

export function ReportsPage() {
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");

  return (
    <PageLayout>
      <Card>
        <SectionTitle>Daily Report</SectionTitle>
        <FormLayout>
          <FormField>
            <label htmlFor="report-yesterday">Yesterday</label>
            <textarea
              id="report-yesterday"
              rows={3}
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              placeholder="What did you accomplish yesterday?"
            />
          </FormField>
          <FormField>
            <label htmlFor="report-today">Today</label>
            <textarea
              id="report-today"
              rows={3}
              value={today}
              onChange={(e) => setToday(e.target.value)}
              placeholder="What will you work on today?"
            />
          </FormField>
          <FormField>
            <label htmlFor="report-blockers">Blockers</label>
            <textarea
              id="report-blockers"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any blockers?"
            />
          </FormField>
          <ButtonAccent type="submit">Submit Report</ButtonAccent>
        </FormLayout>
      </Card>

      <Card>
        <SectionTitle>Report History</SectionTitle>
        <TextMuted>No reports submitted</TextMuted>
      </Card>
    </PageLayout>
  );
}

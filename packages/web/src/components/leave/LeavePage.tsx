import { useState } from "react";
import { LeaveTypes } from "@willdesign-hr/types";
import { Card, PageLayout, SectionTitle, TextMuted, FormField, FormLayout, ButtonAccent } from "../../theme/primitives";

export function LeavePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState(LeaveTypes.PAID);

  return (
    <PageLayout>
      <Card>
        <SectionTitle>New Request</SectionTitle>
        <FormLayout>
          <FormField>
            <label htmlFor="leave-type">Leave Type</label>
            <select id="leave-type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <option value={LeaveTypes.PAID}>Paid Leave</option>
              <option value={LeaveTypes.UNPAID}>Unpaid Leave</option>
              <option value={LeaveTypes.SHIFT_PERMISSION}>Shift Permission</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="start-date">Start Date</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField>
            <label htmlFor="end-date">End Date</label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
          <ButtonAccent type="submit">Submit Request</ButtonAccent>
        </FormLayout>
      </Card>

      <Card>
        <SectionTitle>My Requests</SectionTitle>
        <TextMuted>No leave requests</TextMuted>
      </Card>
    </PageLayout>
  );
}

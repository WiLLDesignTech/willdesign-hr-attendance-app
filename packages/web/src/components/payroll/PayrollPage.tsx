import { useState } from "react";
import styled from "styled-components";
import { Card, PageLayout, SectionTitle, FormField } from "../../theme/primitives";

const PayrollTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  td {
    padding: ${({ theme }) => theme.space.sm};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const AmountCell = styled.td`
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const TotalRow = styled.tr`
  td {
    font-weight: 700;
    border-top: 2px solid ${({ theme }) => theme.colors.text};
  }
`;

export function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  return (
    <PageLayout>
      <Card>
        <SectionTitle>Payroll Breakdown</SectionTitle>
        <FormField>
          <label htmlFor="payroll-month">Month</label>
          <input
            type="month"
            id="payroll-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </FormField>
      </Card>

      <Card>
        <PayrollTable>
          <tbody>
            <tr>
              <td>Base Salary</td>
              <AmountCell>—</AmountCell>
            </tr>
            <tr>
              <td>Overtime</td>
              <AmountCell>—</AmountCell>
            </tr>
            <tr>
              <td>Allowances</td>
              <AmountCell>—</AmountCell>
            </tr>
            <tr>
              <td>Deductions</td>
              <AmountCell>—</AmountCell>
            </tr>
            <TotalRow>
              <td>Net Amount</td>
              <AmountCell>—</AmountCell>
            </TotalRow>
          </tbody>
        </PayrollTable>
      </Card>
    </PageLayout>
  );
}

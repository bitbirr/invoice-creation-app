import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  heading: { fontSize: 20, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tableHeader: { flexDirection: "row", borderBottom: 1, paddingBottom: 4, marginTop: 16 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottom: 0.5, borderColor: "#ddd" },
  colDesc: { width: "46%" },
  colQty: { width: "14%", textAlign: "right" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: "46%" },
});

export type InvoicePdfProps = {
  number: string;
  status: string;
  issueDate: string;
  customerName: string;
  customerEmail: string | null;
  billingAddress: string | null;
  currency: string;
  lines: Array<{ description: string; quantity: string; unitPrice: string; lineTotal: string }>;
  subtotal: string;
  tax: string;
  total: string;
  taxRateBps: number;
  notes: string | null;
};

export function InvoicePdf(props: InvoicePdfProps): ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Invoice {props.number}</Text>
        <View style={styles.row}>
          <Text>Status: {props.status}</Text>
          <Text>Issue date: {props.issueDate}</Text>
        </View>
        <Text>Bill to: {props.customerName}</Text>
        {props.customerEmail ? <Text>{props.customerEmail}</Text> : null}
        {props.billingAddress ? <Text>{props.billingAddress}</Text> : null}

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit ({props.currency})</Text>
          <Text style={styles.colTotal}>Line</Text>
        </View>
        {props.lines.map((line) => (
          <View key={`${line.description}-${line.lineTotal}`} style={styles.tableRow}>
            <Text style={styles.colDesc}>{line.description}</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colPrice}>{line.unitPrice}</Text>
            <Text style={styles.colTotal}>{line.lineTotal}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>{props.subtotal}</Text>
          </View>
          <View style={styles.row}>
            <Text>Tax ({(props.taxRateBps / 100).toFixed(2)}%)</Text>
            <Text>{props.tax}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total</Text>
            <Text>{props.total}</Text>
          </View>
        </View>
        {props.notes ? <Text style={{ marginTop: 24 }}>Notes: {props.notes}</Text> : null}
      </Page>
    </Document>
  );
}

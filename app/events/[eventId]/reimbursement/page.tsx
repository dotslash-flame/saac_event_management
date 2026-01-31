"use client";

import { useState } from "react";

type Item = {
  name: string;
  amount: number;
};

type Reimbursee = {
  name: string;
  studentId: string;
};

export default function ReimbursementPage() {
  const [items, setItems] = useState<Item[]>([{ name: "", amount: 0 }]);

  const [reimbursees, setReimbursees] = useState<Reimbursee[]>([
    { name: "", studentId: "" },
  ]);

  const [billFiles, setBillFiles] = useState<File[]>([]);
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Reimbursement</h1>

      {/* Total */}
      <div style={{ marginTop: 20 }}>
        <strong>Total Amount:</strong> ₹{totalAmount}
      </div>

      {/* Items */}
      <div style={{ marginTop: 30 }}>
        <h3>Items</h3>

        {items.map((item, index) => (
          <div
            key={index}
            style={{ marginBottom: 15 }}
          >
            <input
              placeholder="Item name"
              value={item.name}
              onChange={(e) => {
                const copy = [...items];
                copy[index].name = e.target.value;
                setItems(copy);
              }}
            />

            <br />

            <input
              type="number"
              placeholder="Amount"
              value={item.amount}
              onChange={(e) => {
                const copy = [...items];
                copy[index].amount = Number(e.target.value);
                setItems(copy);
              }}
            />
          </div>
        ))}

        <button onClick={() => setItems([...items, { name: "", amount: 0 }])}>
          Add Item
        </button>
      </div>

      {/* Reimbursees */}
      <div style={{ marginTop: 30 }}>
        <h3>Reimbursees</h3>

        {reimbursees.map((r, index) => (
          <div
            key={index}
            style={{ marginBottom: 15 }}
          >
            <input
              placeholder="Name"
              value={r.name}
              onChange={(e) => {
                const copy = [...reimbursees];
                copy[index].name = e.target.value;
                setReimbursees(copy);
              }}
            />

            <br />

            <input
              placeholder="Student ID"
              value={r.studentId}
              onChange={(e) => {
                const copy = [...reimbursees];
                copy[index].studentId = e.target.value;
                setReimbursees(copy);
              }}
            />
          </div>
        ))}

        <button
          onClick={() =>
            setReimbursees([...reimbursees, { name: "", studentId: "" }])
          }
        >
          Add Reimbursee
        </button>
      </div>

      {/* File uploads */}
      <div style={{ marginTop: 30 }}>
        <h3>Bills</h3>
        <input
          type="file"
          multiple
          onChange={(e) => setBillFiles(Array.from(e.target.files || []))}
        />
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Payment Screenshots</h3>
        <input
          type="file"
          multiple
          onChange={(e) => setPaymentFiles(Array.from(e.target.files || []))}
        />
      </div>

      {/* Submit */}
      <div style={{ marginTop: 40 }}>
        <button
          onClick={() =>
            console.log({
              items,
              reimbursees,
              totalAmount,
              billFiles,
              paymentFiles,
            })
          }
        >
          Create Reimbursement
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { addReimbursementForEvent, addReimbursees } from "@/lib/queries";
import { useRouter } from "next/navigation";

type Item = {
  name: string;
  amount: number;
};

type Reimbursee = {
  name: string;
  studentId: string;
};

export default function ReimbursementPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const [items, setItems] = useState<Item[]>([{ name: "", amount: 0 }]);
  const [reimbursees, setReimbursees] = useState<Reimbursee[]>([
    { name: "", studentId: "" },
  ]);
  const [billFiles, setBillFiles] = useState<File[]>([]);
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  // Helper to upload files to public/images/[eventId]/
  async function uploadFiles(files: File[], type: "bills" | "payments") {
    if (!eventId) return [];
    const folder = `/images/${eventId}/${type}/`;
    // This is a placeholder. Actual upload should use an API route or direct storage (Supabase, etc.)
    // For now, just return file names for demo
    return files.map((file) => folder + file.name);
  }

  async function handleSubmit() {
    if (!eventId) {
      toast.error("Event ID missing");
      return;
    }
    startTransition(async () => {
      // 1. Create reimbursement record
      const treasurerId = "TODO_TREASURER_ID"; // Replace with actual treasurer ID
      const reimbursementRes = await addReimbursementForEvent({
        eventId,
        treasurerId,
      });
      if (!reimbursementRes.success) {
        toast.error(
          "Failed to create reimbursement: " + reimbursementRes.error,
        );
        return;
      }

      // 2. Add reimbursees
      const students = reimbursees
        .filter((r) => r.name && r.studentId)
        .map((r) => ({ studentId: r.studentId, studentName: r.name }));
      if (students.length > 0) {
        const res = await addReimbursees({
          reimbursementId: eventId,
          students,
        });
        if (!res.success) {
          toast.error("Failed to add reimbursees: " + res.error);
          return;
        }
      }

      // 3. Upload files (simulate)
      const billImagePaths = await uploadFiles(billFiles, "bills");
      const paymentImagePaths = await uploadFiles(paymentFiles, "payments");

      // TODO: Save items, images, and amounts to DB if needed

      toast.success("Reimbursement created!");
      router.push("/events");
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Reimbursement</h1>
      <Card className="p-6 space-y-6">
        <div>
          <Label className="font-semibold">Total Amount</Label>
          <div className="text-lg mt-1">₹{totalAmount}</div>
        </div>
        <Separator />
        <div>
          <h3 className="text-xl font-semibold mb-2">Items</h3>
          {items.map((item, index) => (
            <div
              key={index}
              className="flex gap-4 mb-3 items-end"
            >
              <Input
                placeholder="Item name"
                value={item.name}
                onChange={(e) => {
                  const copy = [...items];
                  copy[index].name = e.target.value;
                  setItems(copy);
                }}
                className="w-1/2"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={item.amount}
                onChange={(e) => {
                  const copy = [...items];
                  copy[index].amount = Number(e.target.value);
                  setItems(copy);
                }}
                className="w-1/3"
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => setItems([...items, { name: "", amount: 0 }])}
          >
            Add Item
          </Button>
        </div>
        <Separator />
        <div>
          <h3 className="text-xl font-semibold mb-2">Reimbursees</h3>
          {reimbursees.map((r, index) => (
            <div
              key={index}
              className="flex gap-4 mb-3 items-end"
            >
              <Input
                placeholder="Name"
                value={r.name}
                onChange={(e) => {
                  const copy = [...reimbursees];
                  copy[index].name = e.target.value;
                  setReimbursees(copy);
                }}
                className="w-1/2"
              />
              <Input
                placeholder="Student ID"
                value={r.studentId}
                onChange={(e) => {
                  const copy = [...reimbursees];
                  copy[index].studentId = e.target.value;
                  setReimbursees(copy);
                }}
                className="w-1/3"
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setReimbursees([...reimbursees, { name: "", studentId: "" }])
            }
          >
            Add Reimbursee
          </Button>
        </div>
        <Separator />
        <div>
          <h3 className="text-xl font-semibold mb-2">Bills</h3>
          <Input
            type="file"
            multiple
            onChange={(e) => setBillFiles(Array.from(e.target.files || []))}
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Payment Screenshots</h3>
          <Input
            type="file"
            multiple
            onChange={(e) => setPaymentFiles(Array.from(e.target.files || []))}
          />
        </div>
        <Separator />
        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Submitting..." : "Create Reimbursement"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { getAllWithdrawals } from "@/lib/actions"; // create this action
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AllWithdrawalsTab() {

  const withdrawals = await getAllWithdrawals()


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Purpose</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {withdrawals.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No withdrawals found
            </TableCell>
          </TableRow>
        ) : (
          withdrawals.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.purpose}</TableCell>
              <TableCell>৳ {item.amount}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    item.status === "approved"
                      ? "success"
                      : item.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>{item.requestedBy}</TableCell>
              <TableCell>{item.createdAt?.toString().slice(0, 10)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

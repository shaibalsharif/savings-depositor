import Image from "next/image";
import { format } from "date-fns";

export function MoneyReceipt({
  deposit,
  user,
  totalDeposit,
  managerName,
  company = {
    name: "Company Name Here",
    address: "123-A, 16. Adarsh Nagar, New Delhi-789456",
    phone: "8897537730",
    email: "abcd@gmail.com",
    logo: "/logo.png", // dummy logo path
  }
}: {
  deposit: any,
  user: any,
  totalDeposit: number,
  managerName: string,
  company?: {
    name: string,
    address: string,
    phone: string,
    email: string,
    logo: string,
  }
}) {
  const createdAt = deposit.createdAt ? new Date(deposit.createdAt) : null;
  const verifiedAt = deposit.updatedAt ? new Date(deposit.updatedAt) : null;

  return (
    <div className="w-[650px] mx-auto bg-white shadow border rounded font-sans text-[15px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b-4 border-orange-500">
        <div className="flex flex-col items-center">
          <Image src={company.logo} alt="Logo" width={70} height={70} />
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold tracking-wide text-[#1976d2]">MONEY RECEIPT</div>
          <div className="flex items-center justify-center gap-2 text-gray-600 text-[13px] mt-1">
            <span>📞 {company.phone}</span>
            <span>✉️ {company.email}</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-700">
          <div className="font-semibold">{company.name}</div>
          <div>{company.address}</div>
          <div>
            Date: <span className="font-medium">{createdAt ? format(createdAt, "dd/MM/yyyy") : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <div className="flex justify-between mb-2">
          <span>SL No: <span className="font-semibold">{deposit.id || "N/A"}</span></span>
        </div>
        <div className="mb-2">
          Received with thanks from <span className="font-semibold">{user?.name || "N/A"}</span>
        </div>
        <div className="mb-2">
          Amount: <span className="font-semibold">৳ {Number(deposit.amount).toLocaleString()}</span>
        </div>
        <div className="mb-2">
          In word: <span className="italic">{/* You can convert number to words if needed */}</span>
        </div>
        <div className="mb-2">
          For: <span className="font-semibold">{format(new Date(deposit.month + "-01"), "MMMM yyyy")}</span>
          <span className="ml-4">Branch: _____________</span>
        </div>
        <div className="mb-2">
          ACCT. <span className="font-semibold">{user?.userId || "N/A"}</span>
          <span className="ml-4">Paid: ৳ {Number(totalDeposit).toLocaleString()}</span>
          <span className="ml-4">Due: _____________</span>
        </div>
        <div className="mb-2">
          Transaction ID: <span className="font-semibold">{deposit.transactionId || "N/A"}</span>
        </div>
        <div className="mb-2">
          Deposit Date: <span className="font-semibold">{createdAt ? format(createdAt, "dd/MM/yyyy HH:mm") : "N/A"}</span>
        </div>
        <div className="mb-2">
          Verification Date: <span className="font-semibold">{verifiedAt ? format(verifiedAt, "dd/MM/yyyy HH:mm") : "N/A"}</span>
        </div>
        <div className="mb-2">
          Verified By (Manager): <span className="font-semibold">{managerName || "N/A"}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end px-6 pb-6 pt-8">
        <div>
          <div className="text-xs">Received by</div>
          <div className="mt-6 border-t border-gray-400 w-32"></div>
        </div>
        <div className="flex flex-col items-center">
          {/* Dummy signature image */}
          <Image src="/signature_manager.png" alt="Signature" width={100} height={40} />
          <div className="text-xs mt-1">Authorised Signature</div>
        </div>
      </div>
    </div>
  );
}

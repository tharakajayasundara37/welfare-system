import { Loader2 } from "lucide-react";

export default function NotificationsLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-[#2b241f]">
      <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#9b6f45]" />
      Loading notifications...
    </div>
  );
}
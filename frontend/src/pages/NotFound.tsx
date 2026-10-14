import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-24 px-4">
      <EmptyState
        icon={Compass}
        title="Sahifa topilmadi"
        description="Havola eskirgan yoki noto'g'ri yozilgan bo'lishi mumkin."
        action={
          <Link to="/" className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Bosh sahifaga qaytish
          </Link>
        }
      />
    </div>
  );
}

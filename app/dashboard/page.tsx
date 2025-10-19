"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  PlusCircle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import profile from "./../images/profile.png";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
// Firebase Library Import
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";


useEffect;
interface FoodLog {
  id: string;
  date: string; // yyyy-mm-dd
  imageUrl: string;
  name: string;
  meal: "Breakfast" | "Lunch" | "Dinner" | "Snack";
}
export default function Page() {
  // const [foods, setFoods] = useState<FoodLog[]>(mockFoodData);
  // const [searchQuery, setSearchQuery] = useState("");
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 10;
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const [foods, setFoods] = useState<FoodLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const isExternalUrl = (u?: string | null) => !!u && /^https?:\/\//i.test(u);
  // ===== Load user once =====
  useEffect(() => {
    const uid = localStorage.getItem("user_id");
    const uname = localStorage.getItem("fullname");
    const uimg = localStorage.getItem("userImage");
    if (!uid) {
      router.push("/login");
      return;
    }
    setUserId(uid);
    setUserName(uname);
    setUserAvatar(uimg);
  }, [router]);

  // ===== Fetch foods when user/page/search/pageSize changes =====
  useEffect(() => {
    const fetchFoods = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const q = query(collection(db, "food_tb"), where("user_id", "==", userId));
        const querySnapshot = await getDocs(q);

        const items: FoodLog[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<FoodLog, "id">),
        }));

        // Pagination (client-side)
        setTotal(items.length);
        const start = (page - 1) * pageSize;
        const paginated = items.slice(start, start + pageSize);

        setFoods(paginated);
      } catch (error) {
        console.error("Error fetching foods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [userId, page, pageSize]);
  
//delete food
  const handleDelete = async (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) return;
    try {
      await deleteDoc(doc(db, "food_tb", id));
      alert("ลบข้อมูลสำเร็จ ✅");
      setFoods((prev) => prev.filter((f) => f.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error("Error deleting:", err);
      alert("ไม่สามารถลบข้อมูลได้ ❌");
    }
  };
//logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("user_id");
    localStorage.removeItem("fullname");
    localStorage.removeItem("user_image_url");
    router.push("/login");
  };

  const avatarNode =
    isExternalUrl(userAvatar) && userAvatar ? (
      <Image
        src={userAvatar}
        alt="User profile picture"
        width={40}
        height={40}
        className="rounded-full object-cover w-10 h-10 ring-1 ring-gray-600"
        unoptimized
      />
    ) : (
      <Image
        src={profile}
        alt="User profile picture"
        width={40}
        height={40}
        className="rounded-full object-cover w-10 h-10 ring-1 ring-gray-600"
      />
    );
  

   return (
    <main className="min-h-screen p-4 sm:p-8 bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors"
        >
          <Home size={20} />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
          My Food Diary
        </h1>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-semibold">{userName}</span>
          <Image
            src={userAvatar || profile}
            alt="User"
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10 ring-1 ring-gray-600"
          />
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto bg-gray-300 rounded-3xl shadow-lg p-6 text-black">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/addfood"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Food
            <PlusCircle size={20} />
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-900/40 text-white">
              <tr>
                <th className="border p-3 font-semibold">Date</th>
                <th className="border p-3 font-semibold">Food</th>
                <th className="border p-3 font-semibold">Meal</th>
                <th className="border p-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : foods.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-600">
                    No food logs found.
                  </td>
                </tr>
              ) : (
                foods.map((food) => (
                  <tr key={food.id} className="hover:bg-gray-200">
                    <td className="border p-3">{food.date}</td>
                    <td className="border p-3">
                      <div className="flex items-center gap-3">
                        {food.imageUrl ? (
                          <Image
                            src={food.imageUrl}
                            alt={food.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-md object-cover ring-1 ring-gray-600"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-700 rounded-md" />
                        )}
                        <span className="font-medium">{food.name}</span>
                      </div>
                    </td>
                    <td className="border p-3">{food.meal}</td>
                    <td className="border p-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/updatefood/${food.id}`}
                          className="p-1 text-green-700 hover:text-green-500"
                        >
                          <Edit size={26} />
                        </Link>
                        <button
                          onClick={() => handleDelete(food.id)}
                          className="p-1 text-red-500 hover:text-red-400"
                        >
                          <Trash2 size={26} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 text-gray-900">
          <div className="text-sm">
            Showing {foods.length ? (page - 1) * pageSize + 1 : 0}–
            {(page - 1) * pageSize + foods.length} of {total}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-gray-500 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

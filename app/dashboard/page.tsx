"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
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

interface FoodLog {
  id: string;
  foodname: string;
  meal: string;
  fooddate: string;
  food_image_url: string;
}

export default function Page() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const [foods, setFoods] = useState<FoodLog[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // ✅ โหลด user จาก localStorage
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

  // ✅ ดึงข้อมูลอาหารจาก Firestore
  useEffect(() => {
    const fetchFoods = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const q = query(collection(db, "food_cl"), where("user_id", "==", userId));
        const querySnapshot = await getDocs(q);

        const items: FoodLog[] = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();

            // 🔧 แปลงวันที่ให้แน่นอน ไม่ว่าจะเป็น string หรือ Timestamp
            let formattedDate = "";
            if (data.fooddate) {
              if (data.fooddate.toDate) {
                // Firestore Timestamp
                formattedDate = data.fooddate.toDate().toISOString().split("T")[0];
              } else if (typeof data.fooddate === "string") {
                // ISO string หรือ text
                formattedDate = data.fooddate.split("T")[0];
              }
            }

            return {
              id: doc.id,
              foodname: data.foodname || "Unknown",
              meal: data.meal || "-",
              fooddate: formattedDate,
              food_image_url: data.food_image_url || "",
            };
          })
          .sort((a, b) => (a.fooddate < b.fooddate ? 1 : -1));

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

  // ✅ ลบข้อมูลอาหาร
  const handleDelete = async (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) return;
    try {
      await deleteDoc(doc(db, "food_cl", id));
      alert("ลบข้อมูลสำเร็จ ✅");
      setFoods((prev) => prev.filter((f) => f.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error("Error deleting:", err);
      alert("ไม่สามารถลบข้อมูลได้ ❌");
    }
  };

  // ✅ ออกจากระบบ
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("user_id");
    localStorage.removeItem("fullname");
    localStorage.removeItem("userImage");
    router.push("/login");
  };

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
          <Link
          href="/profile"
          className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors"
        >{userName}</Link>
          
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
                <th className="border p-3 text-right font-semibold">Actions</th>
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
                    <td className="border p-3">{food.fooddate || "-"}</td>
                    <td className="border p-3">
                      <div className="flex items-center gap-3">
                        {food.food_image_url ? (
                          <Image
                            src={food.food_image_url}
                            alt={food.foodname}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-md object-cover ring-1 ring-gray-600"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-700 rounded-md" />
                        )}
                        <span className="font-medium">{food.foodname}</span>
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

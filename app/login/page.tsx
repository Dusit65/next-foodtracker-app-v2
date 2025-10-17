"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Firebase Library Import
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  // Function Login (Check email and password)
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ดึงข้อมูลผู้ใช้จาก Firestore
      const q = query(
        collection(db, "user_cl"),
        where("email", "==", email),
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง ❌");
        setLoading(false);
        return;
      }

      // ได้ข้อมูลผู้ใช้ 1 คน
      const userData = querySnapshot.docs[0].data();
      const userId = querySnapshot.docs[0].id;

      //บันทึกข้อมูลไว้ใน localStorage
      localStorage.setItem("user_id", userId);
      localStorage.setItem("fullname", userData.fullname);
      localStorage.setItem("userImage", userData.user_image_url);

      alert("ล็อกอินสำเร็จ ✅");
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans text-center text-white">
      <div className="relative flex w-full max-w-lg flex-col items-center justify-center rounded-2xl bg-white/30 p-8 shadow-xl backdrop-blur-md">
        {/* Back to Home Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 text-gray-300 hover:text-white transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Login
        </h1>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-white placeholder-white/80 transition duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-white placeholder-white/80 transition duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full transform rounded-full bg-sky-600 px-8 py-3 font-semibold text-white shadow-md transition duration-300 ease-in-out hover:scale-105 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="text-red-400">{error}</p>}
        </form>

        <p className="mt-4 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-sky-300 hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}

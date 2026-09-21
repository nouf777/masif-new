import { useEffect, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import type { User } from "firebase/auth";

import { db, auth } from "./firebase";

import {
  CheckCircle2,
  Star,
  Trash2,
  MessageSquare,
  Users,
  LogOut,
  Lock,
  Mail,
} from "lucide-react";

import "./AdminDashboard.css";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt?: {
    seconds: number;
  } | null;
};

function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // تسجيل الدخول
  const handleLogin = async () => {
    setLoginError("");

    if (!email.trim() || !password) {
      setLoginError(
        "أدخلي البريد الإلكتروني وكلمة المرور."
      );
      return;
    }

    setLoginLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // جلب التقييمات بعد تسجيل الدخول فقط
  useEffect(() => {
    if (!user) {
      return;
    }

    

    const reviewsQuery = query(
      collection(db, "reviews"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const data: Review[] = snapshot.docs.map(
          (item) => {
            const reviewData = item.data();

            return {
              id: item.id,
              name: reviewData.name || "زائر",
              rating: reviewData.rating || 0,
              comment: reviewData.comment || "",
              createdAt:
                reviewData.createdAt || null,
            };
          }
        );

        setReviews(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Dashboard error:",
          error
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // حذف تقييم
  const deleteReview = async (id: string) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا التقييم؟"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "reviews", id)
      );
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      alert(
        "تعذر حذف التقييم. تأكدي من صلاحيات Firebase."
      );
    }
  };

  // متوسط التقييم
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) =>
              total + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  // تحويل التاريخ
  const getDate = (
    createdAt?: {
      seconds: number;
    } | null
  ) => {
    if (!createdAt) {
      return "لم يتم تحديد التاريخ";
    }

    return new Date(
      createdAt.seconds * 1000
    ).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // أثناء التحقق من Firebase
  if (authLoading) {
    return (
      <div
        className="admin-dashboard"
        dir="rtl"
      >
        <div className="dashboard-message">
          جاري التحقق من صلاحية الدخول...
        </div>
      </div>
    );
  }

  // صفحة تسجيل الدخول
  if (!user) {
    return (
      <div
        className="admin-dashboard"
        dir="rtl"
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "430px",
              background: "#ffffff",
              borderRadius: "18px",
              padding: "35px",
              border: "1px solid #e7e3d8",
              boxShadow:
                "0 2px 12px rgba(35, 40, 30, 0.06)",
            }}
          >
            {/* أيقونة القفل */}
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                background: "#eef2ea",
                color: "#3d5336",
              }}
            >
              <Lock size={30} />
            </div>

            {/* العنوان */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "28px",
              }}
            >
              <span className="admin-label">
                ADMIN ACCESS
              </span>

              <h1
                style={{
                  margin: "8px 0",
                }}
              >
                دخول الإدارة
              </h1>

              <p>
                هذه الصفحة خاصة بإدارة
                تقييمات مزرعة المصيف.
              </p>
            </div>

            {/* الحقول */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              {/* الإيميل */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                  }}
                >
                  البريد الإلكتروني
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <Mail
                    size={18}
                    style={{
                      position:
                        "absolute",
                      right: "14px",
                      top: "50%",
                      transform:
                        "translateY(-50%)",
                    }}
                  />

                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter"
                      ) {
                        handleLogin();
                      }
                    }}
                    style={{
                      width: "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "14px 45px 14px 14px",
                      borderRadius: "10px",
                      border:
                        "1px solid #e7e3d8",
                      background: "#faf9f6",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>

              {/* كلمة المرور */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                  }}
                >
                  كلمة المرور
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <Lock
                    size={18}
                    style={{
                      position:
                        "absolute",
                      right: "14px",
                      top: "50%",
                      transform:
                        "translateY(-50%)",
                    }}
                  />

                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter"
                      ) {
                        handleLogin();
                      }
                    }}
                    style={{
                      width: "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "14px 45px 14px 14px",
                      borderRadius: "10px",
                      border:
                        "1px solid #e7e3d8",
                      background: "#faf9f6",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>

              {/* رسالة الخطأ */}
              {loginError && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background:
                      "#fff1f1",
                    color: "#c62828",
                    fontSize: "14px",
                  }}
                >
                  {loginError}
                </div>
              )}

              {/* زر الدخول */}
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleLogin}
                disabled={loginLoading}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "10px",
                  padding: "15px",
                  cursor: loginLoading
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "16px",
                  fontWeight: 700,
                  background: "#3d5336",
                  color: "#ffffff",
                  transition:
                    "background 0.2s ease",
                }}
              >
                {loginLoading
                  ? "جاري تسجيل الدخول..."
                  : "دخول لوحة الإدارة"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // لوحة الإدارة
  return (
    <div
      className="admin-dashboard"
      dir="rtl"
    >
      {/* Header */}
      <header className="admin-header">
        <div>
          <span className="admin-label">
            ADMIN DASHBOARD
          </span>

          <h1>
            لوحة إدارة التقييمات
          </h1>

          <p>
            هنا تظهر جميع الآراء
            والتقييمات التي يرسلها
            عملاء مزرعة المصيف.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div className="admin-status">
            <CheckCircle2 size={18} />
            النظام يعمل
          </div>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
            title="تسجيل الخروج"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 15px",
              borderRadius: "10px",
              border: "1px solid #e7e3d8",
              background: "#ffffff",
              color: "#3f4437",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LogOut size={17} />
            خروج
          </button>
        </div>
      </header>

      {/* الإحصائيات */}
      <section className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <MessageSquare size={22} />
          </div>

          <div>
            <span>
              إجمالي التقييمات
            </span>

            <strong>
              {reviews.length}
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Star size={22} />
          </div>

          <div>
            <span>
              متوسط التقييم
            </span>

            <strong>
              {averageRating} / 5
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>
              عدد العملاء
            </span>

            <strong>
              {reviews.length}
            </strong>
          </div>
        </div>
      </section>

      {/* التقييمات */}
      <section className="reviews-panel">
        <div className="reviews-panel-header">
          <div>
            <h2>
              آراء العملاء
            </h2>

            <p>
              التقييمات محفوظة مباشرة
              في Firebase
            </p>
          </div>

          <div className="review-count">
            {reviews.length} تقييم
          </div>
        </div>

        {loading ? (
          <div className="dashboard-message">
            جاري تحميل التقييمات...
          </div>
        ) : reviews.length === 0 ? (
          <div className="dashboard-message empty">
            <MessageSquare
              size={35}
            />

            <strong>
              لا توجد تقييمات حتى الآن
            </strong>

            <span>
              عندما يرسل أحد العملاء
              تقييمًا سيظهر هنا مباشرة.
            </span>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <article
                className="review-card"
                key={review.id}
              >
                <div className="review-card-top">
                  <div className="customer-info">
                    <div className="customer-avatar">
                      {review.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {review.name}
                      </strong>

                      <span>
                        {getDate(
                          review.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="delete-review"
                    onClick={() =>
                      deleteReview(
                        review.id
                      )
                    }
                    aria-label="حذف التقييم"
                    title="حذف التقييم"
                  >
                    <Trash2
                      size={18}
                    />
                  </button>
                </div>

                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={
                          star <=
                          review.rating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    )
                  )}

                  <span>
                    {review.rating} / 5
                  </span>
                </div>

                <div className="review-comment">
                  <MessageSquare
                    size={17}
                  />

                  <p>
                    {review.comment}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="admin-footer">
        مزرعة المصيف © 2026
      </footer>
    </div>
  );
}

export default AdminDashboard;
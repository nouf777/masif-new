import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Gift,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import "./App.css";

import AdminDashboard from "./AdminDashboard";

type DayType = "national" | "weekend" | "weekday";

const ADMIN_WHATSAPP = "966506910089";

const prices: Record<DayType, number> = {
  national: 900,
  weekend: 850,
  weekday: 650,
};

const originalPrices: Record<DayType, number> = {
  national: 1200,
  weekend: 850,
  weekday: 650,
};

const dayNames: Record<DayType, string> = {
  national: "عرض اليوم الوطني 96",
  weekend: "أيام الويكند",
  weekday: "أيام الأسبوع",
};

function App() {
  const [days, setDays] = useState(1);

  const [guests, setGuests] = useState(15);

  const [checkIn, setCheckIn] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [reviewName, setReviewName] =
    useState("");

  const [reviewText, setReviewText] =
    useState("");

  const [reviewSent, setReviewSent] =
    useState(false);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  /*
   * تحديد سعر الباقة تلقائيًا حسب تاريخ الدخول
   */
  const getDayType = (
    dateString: string
  ): DayType => {
    if (!dateString) {
      return "national";
    }

    const [year, month, day] =
      dateString.split("-").map(Number);

    const selectedDate = new Date(
      year,
      month - 1,
      day
    );

    /*
     * عرض اليوم الوطني:
     * من 20 سبتمبر إلى 26 سبتمبر 2026
     */
    const nationalStart = new Date(
      2026,
      8,
      20
    );

    const nationalEnd = new Date(
      2026,
      8,
      26
    );

    if (
      selectedDate >= nationalStart &&
      selectedDate <= nationalEnd
    ) {
      return "national";
    }

    /*
     * الخميس = 4
     * الجمعة = 5
     *
     * الويكند = الخميس والجمعة
     */
    const dayOfWeek =
      selectedDate.getDay();

    if (
      dayOfWeek === 4 ||
      dayOfWeek === 5
    ) {
      return "weekend";
    }

    /*
     * السبت إلى الأربعاء
     */
    return "weekday";
  };

  const dayType = getDayType(checkIn);

  /*
   * العد التنازلي للعرض
   */
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();

      const target = new Date(
        2026,
        8,
        26,
        23,
        59,
        59
      );

      if (
        now.getTime() >=
        target.getTime()
      ) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        return;
      }

      const difference =
        target.getTime() - now.getTime();

      setTimeLeft({
        days: Math.floor(
          difference /
            (1000 * 60 * 60 * 24)
        ),

        hours: Math.floor(
          (difference /
            (1000 * 60 * 60)) %
            24
        ),

        minutes: Math.floor(
          (difference /
            (1000 * 60)) %
            60
        ),

        seconds: Math.floor(
          (difference / 1000) % 60
        ),
      });
    };

    calculateTime();

    const timer =
      window.setInterval(
        calculateTime,
        1000
      );

    return () =>
      window.clearInterval(timer);
  }, []);

  /*
   * لوحة الإدارة
   */
  if (
    window.location.pathname ===
    "/admin"
  ) {
    return <AdminDashboard />;
  }

  const currentPrice =
    prices[dayType];

  const originalPrice =
    originalPrices[dayType];

  const subtotal =
    currentPrice * days;

  const originalTotal =
    originalPrice * days;

  const savings =
    originalTotal - subtotal;

  const insurance = 200;

  const formatNumber = (
    number: number
  ) =>
    new Intl.NumberFormat(
      "ar-SA"
    ).format(number);

  /*
   * فتح الواتساب
   */
  const openWhatsApp = (
    message: string
  ) => {
    const url =
      `https://wa.me/${ADMIN_WHATSAPP}?text=` +
      encodeURIComponent(message);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /*
   * إرسال تفاصيل الحجز للواتساب
   */
  const handleBooking = () => {
    const message = `السلام عليكم ورحمة الله وبركاته 🌿

أرغب بحجز "مزرعة وشاليه المصيف".

👤 الاسم: ${
      customerName || "ضيف مميز"
    }

📱 رقم الجوال: ${
      phone || "غير محدد"
    }

📅 تاريخ الدخول: ${checkIn}

⏳ عدد الأيام: ${days}

👥 عدد الضيوف: ${guests}

🏡 الباقة: ${
      dayNames[dayType]
    }

💰 السعر: ${
      formatNumber(subtotal)
    } ر.س

🔐 التأمين المسترد: ${
      formatNumber(insurance)
    } ر.س

💵 الإجمالي: ${
      formatNumber(subtotal)
    } ر.س

${
  savings > 0
    ? `🎁 التوفير: ${formatNumber(
        savings
      )} ر.س`
    : ""
}

أرغب بالتأكد من توفر الموعد وتفاصيل الحجز والدفع.

شكرًا لكم 🌿`;

    openWhatsApp(message);
  };

  /*
   * إرسال التقييم إلى Firebase
   */
  const handleReview = async () => {
    if (
      !selectedRating ||
      !reviewText.trim()
    ) {
      return;
    }

    setReviewLoading(true);
    setReviewSent(false);

    const name =
      reviewName.trim() ||
      "زائر";

    const comment =
      reviewText.trim();

    try {
      await addDoc(
        collection(db, "reviews"),
        {
          name,
          rating: selectedRating,
          comment,
          createdAt:
            serverTimestamp(),
        }
      );

      setReviewSent(true);

      setSelectedRating(0);
      setReviewName("");
      setReviewText("");

      window.setTimeout(() => {
        setReviewSent(false);
      }, 6000);
    } catch (error) {
      console.error(
        "Firebase review error:",
        error
      );

      alert(
        "تعذر حفظ التقييم. تأكدي من اتصال Firebase وFirestore وقواعد Rules."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div
      className="app"
      dir="rtl"
    >
      {/* Header */}
      <header className="header">
        <a
          href="#"
          className="logo"
        >
          <div>
            <strong>
              مزرعة المصيف
            </strong>

            <span>
              للراحة واللحظات الجميلة 
            </span>
          </div>
        </a>

        <nav>
          <a href="#overview">
            نظرة عامة
          </a>

          <a href="#booking">
            الحجز
          </a>

          <a href="#review">
            التقييم
          </a>

          <a href="#contact">
            تواصل معنا
          </a>
        </nav>

        <a
          href="#booking"
          className="header-button"
        >
          احجز الآن
        </a>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />

        <div className="hero-inner">
          <h1>
            لحظات أجمل تبدأ
            <br />

            <span>
              من هنا 
            </span>
          </h1>

          <p>
            مساحة هادئة للراحة، التجمعات
            والمناسبات، بتجربة بسيطة
            ومريحة تناسبك وتناسب ضيوفك.
          </p>

          <div className="hero-actions">
            <a
              href="#booking"
              className="main-button"
            >
              احجز إقامتك
            </a>

            <a
              href="#review"
              className="outline-button"
            >
              <Star size={18} />
              قيّم تجربتك
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>
                40
              </strong>

              <span>
                <Users size={14} />
                سعة الضيوف
              </span>
            </div>

            <div>
              <strong>
                24/7
              </strong>

              <span>
                <MessageCircle size={14} />
                تواصل
              </span>
            </div>

            <div>
              <strong>
                200
              </strong>

              <span>
                <ShieldCheck size={14} />
                تأمين مسترد
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* National Day Offer */}
      <section className="national-section">
        <div className="national-card">
          <div className="national-content">
            <div className="offer-icon">
              <Gift size={28} />
            </div>

            <div>
              <div className="offer-label">
                🇸🇦 عرض اليوم الوطني 96
              </div>

              <h2>
                احتفل باليوم الوطني
                <span>
                  {" "}في المصيف
                </span>
              </h2>

              <p>
                العرض ساري من 20 سبتمبر
                إلى 26 سبتمبر.
              </p>
            </div>
          </div>

          <div className="countdown">
            <div className="countdown-title">
              <Clock3 size={15} />
              ينتهي عرض اليوم الوطني خلال:
            </div>

            <div className="time-boxes">
              <div>
                <strong>
                  {timeLeft.days}
                </strong>

                <span>
                  يوم
                </span>
              </div>

              <div>
                <strong>
                  {timeLeft.hours}
                </strong>

                <span>
                  ساعة
                </span>
              </div>

              <div>
                <strong>
                  {timeLeft.minutes}
                </strong>

                <span>
                  دقيقة
                </span>
              </div>

              <div>
                <strong>
                  {timeLeft.seconds}
                </strong>

                <span>
                  ثانية
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section
        id="overview"
        className="section overview"
      >
        <div className="section-heading">
          <span>
            OVERVIEW
          </span>

          <h2>
            نظرة سريعة على المصيف
          </h2>

          <p>
            كل اللي تحتاجه لتأخذ قرارك
            وأنت مرتاح.
          </p>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <CalendarDays />

            <strong>
              حجز مرن
            </strong>

            <span>
              حدد تاريخ إقامتك بسهولة.
            </span>
          </div>

          <div className="info-card">
            <Users />

            <strong>
              حتى 40 شخص
            </strong>

            <span>
              مناسبة للتجمعات والعوائل.
            </span>
          </div>

          <div className="info-card">
            <ShieldCheck />

            <strong>
              تأمين مسترد
            </strong>

            <span>
              200 ر.س مستردة عند الخروج.
            </span>
          </div>

          <div className="info-card">
            <MessageCircle />

            <strong>
              تواصل مباشر
            </strong>

            <span>
              تأكيد الحجز عبر الواتساب.
            </span>
          </div>
        </div>
      </section>

      {/* Booking Calculator */}
      <section
        id="booking"
        className="section booking-section"
      >
        <div className="section-heading">
          <span>
            BOOKING
          </span>

          <h2>
            احسب تكلفة إقامتك
          </h2>

          <p>
            اختر الباقة وعدد الأيام
            والضيوف وشوف السعر مباشرة.
          </p>
        </div>

        <div className="booking-card">
          <div className="booking-form">
            <label>
              اختر نوع الفترة
            </label>

            <div className="periods">
              <button
                type="button"
                className={
                  dayType === "national"
                    ? "active"
                    : ""
                }
                disabled={
                  dayType !== "national"
                }
              >
                <strong>
                  🇸🇦 اليوم الوطني
                </strong>

                <span>
                  900 ر.س
                </span>

                <small>
                  بدل 1200 ر.س
                </small>
              </button>

              <button
                type="button"
                className={
                  dayType === "weekend"
                    ? "active"
                    : ""
                }
                disabled={
                  dayType !== "weekend"
                }
              >
                <strong>
                  🎉 الويكند
                </strong>

                <span>
                  850 ر.س
                </span>

                <small>
                  الخميس والجمعة
                </small>
              </button>

              <button
                type="button"
                className={
                  dayType === "weekday"
                    ? "active"
                    : ""
                }
                disabled={
                  dayType !== "weekday"
                }
              >
                <strong>
                  🌿 أيام الأسبوع
                </strong>

                <span>
                  650 ر.س
                </span>

                <small>
                  السبت إلى الأربعاء
                </small>
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>
                  تاريخ الدخول
                </label>

                <div className="input-icon">
                  <CalendarDays size={17} />

                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) =>
                      setCheckIn(
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label>
                  عدد الأيام
                </label>

                <div className="counter">
                  <button
                    type="button"
                    onClick={() =>
                      setDays(
                        (value) =>
                          Math.max(
                            1,
                            value - 1
                          )
                      )
                    }
                  >
                    <Minus size={16} />
                  </button>

                  <strong>
                    {days}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      setDays(
                        (value) =>
                          Math.min(
                            7,
                            value + 1
                          )
                      )
                    }
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="field guests-field">
              <div className="field-label-row">
                <label>
                  <Users size={16} />
                  عدد الضيوف
                </label>

                <strong>
                  {guests} شخص
                </strong>
              </div>

              <input
                type="range"
                min="2"
                max="40"
                value={guests}
                onChange={(e) =>
                  setGuests(
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label>
                  الاسم
                </label>

                <input
                  type="text"
                  placeholder="مثال: نوف"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  رقم الجوال
                </label>

                <input
                  type="tel"
                  placeholder="05XXXXXXXX"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>

          <aside className="price-summary">
            <div className="summary-top">
              <span>
                ملخص الحجز
              </span>

              <div className="summary-badge">
                {dayNames[dayType]}
              </div>
            </div>

            <div className="summary-lines">
              <div>
                <span>
                  سعر اليوم
                </span>

                <strong>
                  {formatNumber(
                    currentPrice
                  )}{" "}
                  ر.س
                </strong>
              </div>

              <div>
                <span>
                  عدد الأيام
                </span>

                <strong>
                  {days}
                </strong>
              </div>

              <div>
                <span>
                  عدد الضيوف
                </span>

                <strong>
                  {guests}
                </strong>
              </div>

              {savings > 0 && (
                <div className="saving">
                  <span>
                    التوفير
                  </span>

                  <strong>
                    -{" "}
                    {formatNumber(
                      savings
                    )}{" "}
                    ر.س
                  </strong>
                </div>
              )}

              <div>
                <span>
                  التأمين المسترد
                </span>

                <strong>
                  {formatNumber(
                    insurance
                  )}{" "}
                  ر.س
                </strong>
              </div>
            </div>

            <div className="total">
              <span>
                إجمالي الإقامة
              </span>

              <strong>
                {formatNumber(
                  subtotal
                )}

                <small>
                  {" "}ر.س
                </small>
              </strong>

              {savings > 0 && (
                <del>
                  {formatNumber(
                    originalTotal
                  )}{" "}
                  ر.س
                </del>
              )}
            </div>

            <button
              type="button"
              className="booking-submit"
              onClick={handleBooking}
            >
              <MessageCircle size={20} />
              إرسال تفاصيل الحجز
            </button>

            <div className="secure-line">
              <ShieldCheck size={15} />
              تأكيد التوفر يتم مباشرة
              مع الإدارة
            </div>
          </aside>
        </div>
      </section>

      {/* Private Reviews */}
      <section
        id="review"
        className="section review-section"
      >
        <div className="review-container">
          <div className="section-heading">
            <span>
              YOUR REVIEW
            </span>

            <h2>
              شاركنا تجربتك
            </h2>

            <p>
              رأيك يوصل لإدارة المصيف
              مباشرة ويساعدنا نحسن تجربتك.
            </p>
          </div>

          <div className="review-form">
            <div className="private-banner">
              <ShieldCheck size={20} />

              <div>
                <strong>
                  تقييم خاص للإدارة
                </strong>

                <span>
                  التقييم والتعليق الذي
                  تكتبه هنا لا يظهر للزوار.
                </span>
              </div>
            </div>

            <div className="star-picker">
              <span>
                قيّم تجربتك
              </span>

              <div>
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setSelectedRating(
                          star
                        )
                      }
                      aria-label={`تقييم ${star} نجوم`}
                    >
                      <Star
                        size={34}
                        fill={
                          star <=
                          selectedRating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  )
                )}
              </div>

              <small>
                {selectedRating
                  ? `${selectedRating} من 5`
                  : "اختر عدد النجوم"}
              </small>
            </div>

            <div className="review-fields">
              <input
                type="text"
                placeholder="اسمك (اختياري)"
                value={reviewName}
                onChange={(e) =>
                  setReviewName(
                    e.target.value
                  )
                }
              />

              <textarea
                rows={5}
                placeholder="اكتب تعليقك عن تجربتك..."
                value={reviewText}
                onChange={(e) =>
                  setReviewText(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              type="button"
              className="send-review"
              disabled={
                !selectedRating ||
                !reviewText.trim() ||
                reviewLoading
              }
              onClick={handleReview}
            >
              <Send size={18} />

              {reviewLoading
                ? "جاري حفظ تقييمك..."
                : "إرسال التقييم للإدارة"}
            </button>

            {reviewSent && (
              <div className="success-message">
                <CheckCircle2 size={22} />

                <div>
                  <strong>
                    شكرًا لمشاركتنا تجربتك 🤍
                  </strong>

                  <span>
                    تم حفظ تقييمك بنجاح ووصل
                    لإدارة مزرعة المصيف.
                    نقدّر وقتك ورأيك الجميل 🌿
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="contact-section"
      >
        <div className="section-heading">
          <span>
            CONTACT
          </span>

          <h2>
            خلك قريب من المصيف
          </h2>

          <p>
            احجز، اسأل، أو تابعنا على حساباتنا.
          </p>
        </div>

        <div className="contact-grid">
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />

            <strong>
              واتساب
            </strong>

            <span>
              تواصل وحجز مباشر
            </span>
          </a>

          <a
            href="https://www.tiktok.com/@masef85?_r=1&_t=ZS-99BfSgwV0wX"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="social-symbol">
              ♪
            </span>

            <strong>
              TikTok
            </strong>

            <span>
              شوف آخر المقاطع
            </span>
          </a>

          <a
            href="https://snapchat.com/t/LLfCLrLw"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="social-symbol">
              S
            </span>

            <strong>
              Snapchat
            </strong>

            <span>
              تابع يوميات المصيف
            </span>
          </a>

          <a
            href="https://maps.app.goo.gl/PzazXkt8QSmksL3HA?g_st=ic"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin />

            <strong>
              موقعنا
            </strong>

            <span>
              افتح الخريطة
            </span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-brand">
          <div>
            <strong>
              مزرعة المصيف
            </strong>

            <span>
              للراحة واللحظات الجميلة 🌿
            </span>
          </div>
        </div>

        <div className="footer-links">
          <a href="#overview">
            نظرة عامة
          </a>

          <a href="#booking">
            الحجز
          </a>

          <a href="#review">
            أضف تقييمك
          </a>

          <a href="#contact">
            التواصل
          </a>
        </div>

        <p>
          © 2026 مزرعة المصيف — جميع الحقوق محفوظة
        </p>
      </footer>

      {/* Floating WhatsApp */}
      <a
        className="floating-whatsapp"
        href={`https://wa.me/${ADMIN_WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="واتساب"
      >
        <MessageCircle size={24} />
      </a>

      <div className="scroll-indicator">
        <ChevronDown size={18} />
      </div>
    </div>
  );
}

export default App;
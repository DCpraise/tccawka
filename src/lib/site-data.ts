import {
  Facebook, Instagram, Youtube, Compass, Sparkles, Rocket,
  HeartHandshake, ShieldCheck, BookOpen, Users,
} from "lucide-react";

export const SERVICE_TIMES = [
  { day: "Sunday", name: "First Service", time: "7:00 AM – 9:00 AM" },
  { day: "Sunday", name: "Second Service", time: "9:30 AM – 12:00 PM" },
  { day: "Wednesday", name: "Bible Study", time: "5:00 PM – 7:00 PM" },
];

export const CHURCH_CONTACT = {
  address: "Orchid Hotel, Orchid Road, Lekki",
  phone: "0808 176 6433",
  phoneHref: "tel:+2348081766433",
  email: "support@thecrownedchurch.org",
  whatsappUrl: "https://wa.me/2348081766433",
};

export const SOCIAL_LINKS = [
  { Icon: Facebook, url: "https://www.facebook.com/BMIGlobal", label: "Facebook" },
  { Icon: Instagram, url: "https://www.instagram.com/tcc_global_?igsh=MWlwNzZqN2xvMnQ5Mg==", label: "Instagram" },
  { Icon: Youtube, url: "https://youtube.com/@thecrownedchurch?si=cpdePriJ9QnvDLgn", label: "YouTube" },
];

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Beautiful Today", href: "/beautiful-today" },
  { label: "Sermons", href: "/sermons" },
  { label: "Events", href: "/events" },
  { label: "Evolve", href: "/evolve" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" },
];

export type BeautifulTodayIssue = {
  month: string;
  tag: string;
  img: string;
  quote: string;
  desc: string;
  featured: boolean;
};

export const BEAUTIFUL_TODAY: BeautifulTodayIssue[] = [
  {
    month: "July 2026",
    tag: "The New Creation Series",
    img: "/images/beautiful-today/july-2026-new-creation.jpg",
    quote: "You are a new creation — old things have passed away, all things have become new.",
    desc: "A month exploring the reality of who you've become in Christ, and what it means to live from that new identity every day.",
    featured: true,
  },
  {
    month: "April 2026",
    tag: "The Revelation of Jesus Christ",
    img: "/images/beautiful-today/april-2026-revelation.jpg",
    quote: "“Jesus of Nazareth, a man approved of God among you by miracles and wonders and signs.” — Acts 2:22",
    desc: "A month spent beholding who Jesus really is — His works, His words, and His nearness to ordinary, everyday life.",
    featured: false,
  },
  {
    month: "March 2026",
    tag: "Wealth Building Series",
    img: "/images/beautiful-today/march-2026-wealth-building.jpg",
    quote: "Building wealth with wisdom, purpose, and faith.",
    desc: "A practical, faith-rooted look at stewardship, work, and the wisdom that turns everyday diligence into lasting wealth.",
    featured: false,
  },
  {
    month: "February 2026",
    tag: "A Love Therapy",
    img: "/images/beautiful-today/february-2026-love-therapy.jpg",
    quote: "Love did not rise from the earth seeking heaven — it descended from heaven looking for you.",
    desc: "Thirty-one days unpacking the love of God, and how it heals, restores, and reshapes the way we love others.",
    featured: false,
  },
];

export const SERMONS = [
  { title: "5 Revelations That Inspire Strong Faith", speaker: "Pastor's Message", date: "This Sunday", img: "/images/sermons/sermon-1.jpg", url: "https://youtu.be/SGwiipmaFIY" },
  { title: "Rooted in Faith", speaker: "Pastor's Message", date: "Last Sunday", img: "/images/sermons/sermon-2.jpg", url: "https://youtu.be/UsfYs3B-JVc" },
  { title: "3 Things An Experience With Jesus Does To You", speaker: "Pastor's Message", date: "2 weeks ago", img: "/images/sermons/sermon-3.jpg", url: "https://youtu.be/8h7ujEJdG2w" },
];

export const EVENTS = [
  { title: "Sunday Worship Service", date: "Every Sunday", time: "7:00 AM & 9:30 AM", tag: "Weekly", desc: "Our main gathering for worship, the Word, and fellowship — two services every Sunday." },
  { title: "Mid-week Bible Study", date: "Every Wednesday", time: "5:00 PM", tag: "Weekly", desc: "A focused, practical look at Scripture to help you grow deeper in your walk with God." },
  { title: "Annual Thanksgiving Service", date: "December", time: "All day", tag: "Special", desc: "A special day set aside each year to celebrate God's faithfulness as a church family." },
];

export const PURPOSE_PILLARS = [
  { icon: Compass, title: "Discover", desc: "Uncover the God-given gifts and calling already placed inside you." },
  { icon: Sparkles, title: "Develop", desc: "Grow those abilities in a community that trains, mentors, and refines you." },
  { icon: Rocket, title: "Deploy", desc: "Release your gifts for kingdom advancement and social transformation." },
];

export const CORE_VALUES = [
  { icon: HeartHandshake, title: "Genuine Community", desc: "Small fellowship groups where everyone is known and cared for." },
  { icon: ShieldCheck, title: "Sound Teaching", desc: "Bible-based messages that are practical for everyday living." },
  { icon: BookOpen, title: "Lifelong Growth", desc: "Discipleship and devotional resources like Beautiful Today to help you grow daily." },
  { icon: Users, title: "Every Member Matters", desc: "A place to belong, serve, and use your gifts — not just attend." },
];

export const PASTOR = {
  name: "Pastor Isaac Etukudoh",
  title: "Lead Pastor, TCC Global",
  img: "/images/hero-pastor.jpg",
  bio: "Pastor Isaac Etukudoh leads TCC Global with a passion for helping people discover, develop, and deploy their God-given abilities. He is also the author of Beautiful Today, the church's monthly devotional series written to help believers meet God fresh, right where they are.",
};

export const HISTORY_MILESTONES = [
  { year: "20+ Years", title: "Years of Ministry", desc: "Two decades of preaching the gospel and building a church family together." },
  { year: "1,200+", title: "Church Family", desc: "A growing community of believers who call TCC Global home." },
  { year: "12+", title: "Fellowships", desc: "Small groups spread across the community where members grow together." },
];

export const GIVING_CATEGORIES = [
  { title: "Tithes & Offering", desc: "Support the ongoing life and ministry of TCC Global with your regular giving." },
  { title: "Missions & Outreach", desc: "Help take the gospel and practical support beyond our walls, locally and globally." },
  { title: "Building Project", desc: "Partner toward a permanent home for the TCC Global family." },
  { title: "Beautiful Today", desc: "Help fund the monthly printing and distribution of the devotional series." },
];

export { EVOLVE } from "./evolve-config";

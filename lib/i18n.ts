import type { PersonaId } from "./types";

export type Lang = "en" | "th";

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  th: ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
};
const DAYS = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  th: ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"],
};
const DAYS_SHORT = {
  en: ["S", "M", "T", "W", "T", "F", "S"],
  th: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"],
};

const PERSONAS: Record<Lang, Record<PersonaId, [string, string]>> = {
  en: {
    "night-owl": ["The Night Owl", "Your best ideas show up after 10pm. The rest of the world is asleep and your editor is wide awake."],
    "early-bird": ["The Early Bird", "You ship before most people finish breakfast."],
    "weekend-warrior": ["The Weekend Warrior", "Weekdays are for class. Saturdays are for side projects."],
    "streak-machine": ["The Streak Machine", "Small commits, every single day. Consistency is your superpower."],
    polyglot: ["The Polyglot", "You switch languages the way other people switch tabs."],
    reviewer: ["The Reviewer", "You read more code than you write, and your team is better for it."],
    "open-sourcer": ["The Open Sourcer", "People star your work. Strangers use your code."],
    sprinter: ["The Sprinter", "Quiet for a while, then a huge burst. Hackathon energy."],
    builder: ["The Builder", "You keep making things. That is the whole job."],
  },
  th: {
    "night-owl": ["นกฮูกยามดึก", "ไอเดียดีๆ มาหลังสี่ทุ่มเสมอ คนอื่นหลับกันหมดแล้ว แต่ editor ของคุณยังสว่างอยู่"],
    "early-bird": ["นกตื่นเช้า", "คุณ push โค้ดเสร็จก่อนคนอื่นกินข้าวเช้าเสร็จอีก"],
    "weekend-warrior": ["นักรบวันหยุด", "วันธรรมดาไว้เรียน วันเสาร์ไว้ทำ side project"],
    "streak-machine": ["เครื่องจักรสตรีค", "commit ทีละนิด แต่ทุกวัน ความสม่ำเสมอคือพลังพิเศษของคุณ"],
    polyglot: ["ผู้รู้หลายภาษา", "คุณสลับภาษาโปรแกรมเหมือนคนอื่นสลับแท็บ"],
    reviewer: ["สายรีวิว", "คุณอ่านโค้ดมากกว่าเขียน และทีมของคุณดีขึ้นเพราะเรื่องนี้"],
    "open-sourcer": ["สายโอเพนซอร์ส", "คนกดดาวให้งานของคุณ คนแปลกหน้าใช้โค้ดของคุณ"],
    sprinter: ["นักวิ่งระยะสั้น", "เงียบไปพักนึง แล้วก็ระเบิดพลังทีเดียว พลังแฮกกาธอนชัดๆ"],
    builder: ["นักสร้าง", "คุณสร้างของใหม่ไปเรื่อยๆ และนั่นคืองานทั้งหมด"],
  },
};

export function t(lang: Lang) {
  const en = lang === "en";
  const n = (x: number) => x.toLocaleString(en ? "en-US" : "th-TH");
  return {
    lang,
    months: MONTHS[lang],
    days: DAYS[lang],
    daysShort: DAYS_SHORT[lang],
    persona: (id: PersonaId) => PERSONAS[lang][id],
    n,
    sampleTag: en ? "Sample data" : "ข้อมูลตัวอย่าง",
    // landing
    eyebrow: (y: number) => (en ? `Year in review · ${y}` : `สรุปทั้งปี · ${y}`),
    lead: en
      ? "Your languages, your late nights, your longest streak. Told as a story."
      : "ภาษาที่คุณใช้ คืนที่นอนดึก สตรีคที่ยาวที่สุด เล่าเป็นสตอรี่",
    usernameLabel: en ? "GitHub username" : "ชื่อผู้ใช้ GitHub",
    wrapIt: en ? "Wrap it" : "ไปเลย",
    seeSample: en ? "See a sample story" : "ดูสตอรี่ตัวอย่าง",
    yearLabel: en ? "Year" : "ปี",
    invalidUser: en ? "Enter a GitHub username, like octocat." : "ใส่ชื่อผู้ใช้ GitHub เช่น octocat",
    loading: en ? "Fetching your year…" : "กำลังดึงข้อมูลทั้งปี…",
    errNotFound: (u: string) => (en ? `No GitHub user called @${u}. Check the spelling.` : `ไม่พบผู้ใช้ @${u} ลองเช็กตัวสะกดอีกครั้ง`),
    errRate: en
      ? "GitHub is rate limiting this site right now. Try again in a bit, or see the sample."
      : "GitHub จำกัดจำนวนคำขอชั่วคราว ลองใหม่อีกสักพัก หรือดูตัวอย่างไปก่อน",
    errNetwork: en ? "Couldn't reach GitHub. Check your connection and try again." : "เชื่อมต่อ GitHub ไม่ได้ ลองเช็กอินเทอร์เน็ตแล้วลองใหม่",
    // slides
    hey: (name: string) => (en ? `Hey ${name}.` : `หวัดดี ${name}`),
    introLead: (y: number, joined: number) =>
      en ? `You've been on GitHub since ${joined}. Here's what ${y} looked like.` : `คุณอยู่บน GitHub มาตั้งแต่ปี ${joined} มาดูกันว่าปี ${y} เป็นยังไง`,
    daysSince: en ? "days since you made your account" : "วันนับจากที่สมัครบัญชี",
    contributions: en ? "Contributions" : "การมีส่วนร่วม",
    contribLead: (y: number, partial: boolean) =>
      partial
        ? en ? "public contributions in the last 90 days" : "การมีส่วนร่วมสาธารณะใน 90 วันที่ผ่านมา"
        : en ? `contributions in ${y}` : `การมีส่วนร่วมในปี ${y}`,
    commits: en ? "Commits" : "Commits",
    prs: en ? "Pull requests" : "Pull requests",
    reviews: en ? "Reviews" : "รีวิว",
    issues: en ? "Issues" : "Issues",
    privateNote: (x: number) => (en ? `Includes ${n(x)} private contributions.` : `รวมการมีส่วนร่วมแบบส่วนตัว ${n(x)} ครั้ง`),
    yourYear: en ? "Your year, day by day" : "ทั้งปีของคุณ วันต่อวัน",
    activeDaysLine: (a: number, total: number) =>
      en ? `You showed up on ${n(a)} of ${n(total)} days.` : `คุณเข้ามาทำงาน ${n(a)} จาก ${n(total)} วัน`,
    less: en ? "Less" : "น้อย",
    more: en ? "More" : "มาก",
    streakEyebrow: en ? "Longest streak" : "สตรีคที่ยาวที่สุด",
    streakDays: (d: number) => (en ? (d === 1 ? "day in a row" : "days in a row") : "วันติดต่อกัน"),
    streakRange: (s: string, e: string) => (en ? `From ${s} to ${e}. No days off.` : `ตั้งแต่ ${s} ถึง ${e} ไม่มีวันหยุดเลย`),
    streakNone: en ? "Every streak starts with one commit." : "ทุกสตรีคเริ่มจาก commit แรก",
    peakEyebrow: en ? "Your peak" : "ช่วงพีคของคุณ",
    peakMonth: (m: string) => (en ? `${m} was your month.` : `${m} คือเดือนของคุณ`),
    peakDay: (d: string, c: number) =>
      en ? `Your biggest single day was ${d}, with ${n(c)} contributions.` : `วันที่ทำเยอะที่สุดคือ ${d} ทั้งหมด ${n(c)} ครั้ง`,
    rhythmEyebrow: en ? "Your rhythm" : "จังหวะการทำงาน",
    busiestHour: en ? "Busiest hour" : "ชั่วโมงที่ยุ่งที่สุด",
    favDay: en ? "Favourite day" : "วันโปรด",
    hourVibe: (h: number) =>
      h >= 22 || h < 5
        ? en ? "Peak hacking hours." : "ชั่วโมงแฮกระดับพีค"
        : h < 10
          ? en ? "Fresh coffee, fresh commits." : "กาแฟแก้วแรก commit แรก"
          : h < 18
            ? en ? "Right in the middle of the day." : "กลางวันแสกๆ"
            : en ? "After-class grind." : "ลุยต่อหลังเลิกเรียน",
    hoursNote: en ? "Push times from the last 90 days, in your time zone." : "เวลาที่ push ใน 90 วันล่าสุด ตามเขตเวลาของคุณ",
    langEyebrow: en ? "Top language" : "ภาษาอันดับหนึ่ง",
    langLead: (pct: number, basis: "bytes" | "repos") =>
      basis === "bytes"
        ? en ? `${pct}% of the code in your repos. You clearly have a type.` : `${pct}% ของโค้ดในรีโปทั้งหมด เห็นชัดว่าชอบภาษานี้`
        : en ? `The main language in ${pct}% of your repos.` : `ภาษาหลักใน ${pct}% ของรีโปทั้งหมด`,
    langBasis: (basis: "bytes" | "repos") =>
      basis === "bytes" ? (en ? "Share of code by size" : "สัดส่วนตามขนาดโค้ด") : en ? "Share of repos" : "สัดส่วนตามจำนวนรีโป",
    reposEyebrow: en ? "Repositories" : "รีโพสิทอรี",
    reposLead: (stars: number, withPrivate = false) =>
      en
        ? `${withPrivate ? "repos, public and private," : "public repos,"} with ${n(stars)} star${stars === 1 ? "" : "s"} between them.`
        : `${withPrivate ? "รีโปทั้งสาธารณะและส่วนตัว" : "รีโปสาธารณะ"} ได้ดาวรวม ${n(stars)} ดวง`,
    fanFav: en ? "Fan favourite" : "ขวัญใจมหาชน",
    whereYouCommitted: en ? "Where your commits went" : "commit ของคุณไปอยู่ที่ไหน",
    commitsN: (c: number) => (en ? `${n(c)} commits` : `${n(c)} commits`),
    personaEyebrow: en ? "Your dev personality" : "บุคลิกนักพัฒนาของคุณ",
    runnerUp: (p: string) => (en ? `Runner-up: ${p}.` : `อันดับสอง: ${p}`),
    wrapped: en ? "Wrapped" : "สรุป",
    topLanguage: en ? "Top language" : "ภาษาหลัก",
    personality: en ? "Personality" : "บุคลิก",
    bestStreak: en ? "Best streak" : "สตรีคสูงสุด",
    totalLabel: en ? "Contributions" : "การมีส่วนร่วม",
    stars: en ? "Stars" : "ดาว",
    peakMonthLabel: en ? "Peak month" : "เดือนพีค",
    savePng: en ? "Save image" : "บันทึกรูป",
    saving: en ? "Saving…" : "กำลังบันทึก…",
    copyLink: en ? "Copy link" : "คัดลอกลิงก์",
    copied: en ? "Copied. Paste it anywhere." : "คัดลอกแล้ว",
    replay: en ? "Replay" : "เล่นใหม่",
    another: en ? "Try another" : "ลองคนอื่น",
    pause: en ? "Pause" : "หยุด",
    play: en ? "Play" : "เล่น",
    close: en ? "Close" : "ปิด",
    quiet: en ? "Quiet year." : "ปีที่เงียบสงบ",
    quietLead: en
      ? "No public activity showed up for this period. Push something and come back for a fuller story."
      : "ไม่พบกิจกรรมสาธารณะในช่วงนี้ ลอง push อะไรสักอย่างแล้วกลับมาดูใหม่",
    tapHint: en ? "Tap the sides to move · hold to pause" : "แตะซ้าย/ขวาเพื่อเลื่อน · กดค้างเพื่อหยุด",
    signIn: en ? "Sign in with GitHub" : "เข้าสู่ระบบด้วย GitHub",
    signInWhy: en
      ? "Sign in to count your private contributions too. Only you can see them."
      : "เข้าสู่ระบบเพื่อนับการมีส่วนร่วมแบบส่วนตัวด้วย คนอื่นมองไม่เห็น",
    includePrivateRepos: en ? "Also include private repo names and languages" : "รวมชื่อและภาษาของรีโปส่วนตัวด้วย",
    includePrivateNote: en
      ? "GitHub will ask for access to your private repos. The app only reads them."
      : "GitHub จะขอสิทธิ์เข้าถึงรีโปส่วนตัว แอปนี้แค่อ่านข้อมูลเท่านั้น",
    signedInAs: (u: string) => (en ? `Signed in as @${u}` : `เข้าสู่ระบบเป็น @${u}`),
    seeMine: en ? "See my Wrapped" : "ดูสรุปของฉัน",
    signOut: en ? "Sign out" : "ออกจากระบบ",
    or: en ? "or look up anyone" : "หรือค้นหาคนอื่น",
    withPrivate: en ? "Includes private activity" : "รวมกิจกรรมส่วนตัว",
    privateRepo: en ? "Private" : "ส่วนตัว",
    errAuth: en
      ? "GitHub rejected the access token. Check GITHUB_TOKEN in .env.local, or sign in again."
      : "GitHub ปฏิเสธโทเคน ลองเช็ก GITHUB_TOKEN ใน .env.local หรือเข้าสู่ระบบใหม่",
    errSignin: en ? "Sign-in didn't finish. Please try again." : "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง",
    errAuthSetup: en
      ? "Sign-in isn't set up yet. Add GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET and AUTH_SECRET to .env.local."
      : "ยังไม่ได้ตั้งค่าการเข้าสู่ระบบ ใส่ GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET และ AUTH_SECRET ใน .env.local",
    publicLinkNote: en
      ? "The copied link shows your public story. Private details stay with you."
      : "ลิงก์ที่คัดลอกจะแสดงเฉพาะข้อมูลสาธารณะ ข้อมูลส่วนตัวจะไม่ถูกแชร์",
    partialNote: en
      ? "Add a GITHUB_TOKEN on the server to see the full year."
      : "ใส่ GITHUB_TOKEN ที่เซิร์ฟเวอร์เพื่อดูข้อมูลทั้งปี",
  };
}

export type Dict = ReturnType<typeof t>;

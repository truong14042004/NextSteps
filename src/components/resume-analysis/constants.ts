export const INDUSTRIES = [
  { value: "it", label: "Công nghệ thông tin (IT)" },
  { value: "business", label: "Kinh doanh / Marketing" },
  { value: "finance", label: "Tài chính / Ngân hàng" },
  { value: "hr", label: "Quản trị nhân sự" },
  { value: "design", label: "Thiết kế / UI-UX" },
  { value: "other", label: "Khác" },
] as const;

export const LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
  { value: "ja", label: "Tiếng Nhật" },
  { value: "zh", label: "Tiếng Trung" },
] as const;

export const QUICK_EXAMPLES = [
  {
    label: "Frontend Developer",
    candidateName: "Nguyễn Văn A",
    jobTitle: "Frontend Developer (React/Next.js)",
    experienceLevel: "fresh" as const,
    industry: "it",
    jobDescription:
      "Yêu cầu tuyển dụng:\n- Tối thiểu 1 năm kinh nghiệm làm việc với React.js, Next.js và TypeScript.\n- Thành thạo HTML5, CSS3, Tailwind CSS để xây dựng giao diện responsive.\n- Hiểu biết về RESTful API, tối ưu hóa tốc độ tải trang (PageSpeed Performance) và SEO cơ bản.\n- Có kinh nghiệm sử dụng Git, làm việc trong môi trường Agile/Scrum.",
  },
  {
    label: "Marketing Specialist",
    candidateName: "Trần Thị B",
    jobTitle: "Digital Marketing Specialist",
    experienceLevel: "junior" as const,
    industry: "business",
    jobDescription:
      "Yêu cầu tuyển dụng:\n- Trên 2 năm kinh nghiệm thực chiến lập kế hoạch & tối ưu quảng cáo Facebook Ads, Google Ads.\n- Sử dụng thành thạo Google Analytics, Google Search Console và các công cụ SEO.\n- Có óc thẩm mỹ và khả năng sáng tạo nội dung, lên kịch bản video marketing.\n- Kỹ năng phân tích số liệu, đánh giá ROI và lập báo cáo tuần/tháng.",
  },
  {
    label: "Data Analyst",
    candidateName: "Lê Minh C",
    jobTitle: "Data Analyst",
    experienceLevel: "fresh" as const,
    industry: "finance",
    jobDescription:
      "Yêu cầu tuyển dụng:\n- Thành thạo truy vấn dữ liệu SQL (Subquery, Join, Window Functions).\n- Có kinh nghiệm thiết kế Dashboard trực quan hóa dữ liệu trên Power BI hoặc Tableau.\n- Khả năng lập trình Python cơ bản (Pandas, NumPy) là một lợi thế lớn.\n- Tư duy logic sắc bén, kỹ năng trình bày số liệu phức tạp một cách trực quan.",
  },
  {
    label: "Business Analyst",
    candidateName: "Phạm Hoàng D",
    jobTitle: "Business Analyst",
    experienceLevel: "junior" as const,
    industry: "business",
    jobDescription:
      "Yêu cầu tuyển dụng:\n- Tối thiểu 1-2 năm kinh nghiệm ở vị trí Business Analyst hoặc Product Owner.\n- Có khả năng lấy yêu cầu (Requirement Gathering), viết tài liệu PRD, SRS và vẽ Use Case Diagram.\n- Thành thạo công cụ Jira, Confluence và vẽ mockup/wireframe bằng Balsamiq hoặc Figma.\n- Kỹ năng giao tiếp và truyền đạt tốt giữa bộ phận nghiệp vụ và đội ngũ kỹ thuật.",
  },
] as const;

export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  it: [
    "React.js",
    "Next.js",
    "TypeScript",
    "Node.js",
    "SQL",
    "Git",
    "RESTful API",
    "Tailwind CSS",
    "Agile",
    "System Design",
  ],
  business: [
    "Facebook Ads",
    "Google Ads",
    "SEO",
    "Google Analytics",
    "Content Strategy",
    "Copywriting",
    "A/B Testing",
    "ROI",
  ],
  finance: [
    "SQL",
    "Power BI",
    "Tableau",
    "Financial Modeling",
    "Excel",
    "Data Analysis",
    "Risk Management",
    "Reporting",
  ],
  hr: [
    "Recruiting",
    "KPIs",
    "Talent Acquisition",
    "Onboarding",
    "Conflict Resolution",
    "Vietnamese Labor Law",
  ],
  design: ["Figma", "UI/UX Design", "Wireframing", "Prototyping", "Design System", "Adobe Photoshop", "Illustrator"],
  other: ["Project Management", "Communication", "Problem Solving", "Collaboration", "Critical Thinking"],
};

export const PROGRESS_STEPS = [
  { id: 0, title: "Đọc dữ liệu CV", desc: "Trích xuất thông tin học văn & kinh nghiệm" },
  { id: 1, title: "Phân tích JD", desc: "Thấu hiểu các yêu cầu tuyển dụng cốt lõi" },
  { id: 2, title: "So khớp kỹ năng", desc: "Đối chiếu chuyên môn và dự án liên quan" },
  { id: 3, title: "Tính toán điểm ATS", desc: "Đánh giá mức độ vượt qua bộ lọc tự động" },
  { id: 4, title: "Tạo đề xuất tối ưu", desc: "Tạo các gợi ý sửa đổi trực quan cho CV" },
] as const;
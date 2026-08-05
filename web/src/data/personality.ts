export interface PersonalityQuestion {
  id: string
  text: string
  options: {
    text: string
    scores: { category: string; score: number }[]
  }[]
}

export const personalityQuestions: PersonalityQuestion[] = [
  {
    id: 'q1',
    text: 'Bạn thường giải quyết vấn đề bằng cách nào?',
    options: [
      { text: 'Phân tích dữ liệu và tìm quy luật', scores: [{ category: 'research', score: 2 }, { category: 'tech', score: 1 }] },
      { text: 'Thảo luận với mọi người và tìm giải pháp chung', scores: [{ category: 'social', score: 2 }, { category: 'creative', score: 1 }] },
      { text: 'Dựa vào trực giác và cảm xúc', scores: [{ category: 'creative', score: 2 }, { category: 'social', score: 1 }] },
      { text: 'Tìm cách giải quyết nhanh nhất', scores: [{ category: 'practical', score: 2 }] },
    ],
  },
  {
    id: 'q2',
    text: 'Môn học nào bạn yêu thích nhất ở trường?',
    options: [
      { text: 'Toán và các môn tự nhiên', scores: [{ category: 'tech', score: 2 }, { category: 'research', score: 1 }] },
      { text: 'Ngữ văn và Sử', scores: [{ category: 'creative', score: 2 }, { category: 'social', score: 1 }] },
      { text: 'Ngoại ngữ', scores: [{ category: 'social', score: 2 }, { category: 'business', score: 1 }] },
      { text: 'Mỹ thuật, Âm nhạc', scores: [{ category: 'creative', score: 2 }] },
    ],
  },
  {
    id: 'q3',
    text: 'Bạn muốn làm việc trong môi trường nào?',
    options: [
      { text: 'Văn phòng, doanh nghiệp', scores: [{ category: 'business', score: 2 }, { category: 'social', score: 1 }] },
      { text: 'Phòng thí nghiệm, nghiên cứu', scores: [{ category: 'research', score: 2 }] },
      { text: 'Công nghệ, tech startup', scores: [{ category: 'tech', score: 2 }] },
      { text: 'Y tế, bệnh viện', scores: [{ category: 'health', score: 2 }] },
    ],
  },
  {
    id: 'q4',
    text: 'Khi có dự án nhóm, bạn thường đảm nhận vai trò nào?',
    options: [
      { text: 'Người lập kế hoạch và điều phối', scores: [{ category: 'business', score: 2 }, { category: 'social', score: 1 }] },
      { text: 'Người tìm hiểu và nghiên cứu thông tin', scores: [{ category: 'research', score: 2 }] },
      { text: 'Người code hoặc thiết kế sản phẩm', scores: [{ category: 'tech', score: 2 }] },
      { text: 'Người trình bày và thuyết trình', scores: [{ category: 'social', score: 2 }, { category: 'creative', score: 1 }] },
    ],
  },
  {
    id: 'q5',
    text: 'Bạn cảm thấy hào hứng nhất khi?',
    options: [
      { text: 'Tạo ra sản phẩm mới, sáng tạo', scores: [{ category: 'creative', score: 2 }] },
      { text: 'Giúp đỡ người khác giải quyết vấn đề', scores: [{ category: 'social', score: 2 }] },
      { text: 'Phân tích và giải quyết các bài toán khó', scores: [{ category: 'research', score: 2 }, { category: 'tech', score: 1 }] },
      { text: 'Đạt được mục tiêu kinh doanh, doanh thu', scores: [{ category: 'business', score: 2 }] },
    ],
  },
  {
    id: 'q6',
    text: 'Nếu có 1 triệu đồng, bạn sẽ làm gì?',
    options: [
      { text: 'Đầu tư vào bản thân (mua sách, khóa học)', scores: [{ category: 'research', score: 2 }] },
      { text: 'Tiết kiệm cho tương lai', scores: [{ category: 'business', score: 2 }] },
      { text: 'Mua thiết bị công nghệ', scores: [{ category: 'tech', score: 2 }] },
      { text: 'Chia sẻ cho người thân hoặc từ thiện', scores: [{ category: 'social', score: 2 }] },
    ],
  },
]

export interface MajorSuggestion {
  category: string
  label: string
  description: string
  examples: { name: string; minScore: number }[]
}

export const majorSuggestions: MajorSuggestion[] = [
  {
    category: 'tech',
    label: 'Công nghệ & IT',
    description: 'Phù hợp nếu bạn thích phân tích, giải quyết vấn đề logic và làm việc với công nghệ.',
    examples: [
      { name: 'Khoa học máy tính', minScore: 34 },
      { name: 'Công nghệ thông tin', minScore: 33 },
      { name: 'An toàn thông tin', minScore: 32 },
      { name: 'Kỹ thuật phần mềm', minScore: 33 },
    ],
  },
  {
    category: 'business',
    label: 'Kinh tế & Quản trị',
    description: 'Phù hợp nếu bạn thích giao tiếp, lập kế hoạch và hướng tới môi trường kinh doanh.',
    examples: [
      { name: 'Quản trị kinh doanh', minScore: 26 },
      { name: 'Marketing', minScore: 26 },
      { name: 'Kinh doanh quốc tế', minScore: 28 },
      { name: 'Tài chính - Ngân hàng', minScore: 27 },
    ],
  },
  {
    category: 'social',
    label: 'Xã hội & Giáo dục',
    description: 'Phù hợp nếu bạn thích giúp đỡ người khác, giao tiếp và truyền đạt kiến thức.',
    examples: [
      { name: 'Sư phạm Ngữ văn', minScore: 24 },
      { name: 'Sư phạm Toán', minScore: 26 },
      { name: 'Tâm lý học', minScore: 24 },
      { name: 'Công tác xã hội', minScore: 20 },
    ],
  },
  {
    category: 'health',
    label: 'Y tế & Sức khỏe',
    description: 'Phù hợp nếu bạn quan tâm đến sức khỏe con người và muốn trong môi trường y tế.',
    examples: [
      { name: 'Y khoa', minScore: 27 },
      { name: 'Dược học', minScore: 26 },
      { name: 'Điều dưỡng', minScore: 21 },
      { name: 'Răng - Hàm - Mặt', minScore: 26 },
    ],
  },
  {
    category: 'creative',
    label: 'Sáng tạo & Nghệ thuật',
    description: 'Phù hợp nếu bạn thích sáng tạo, thẩm mỹ và biểu đạt ý tưởng.',
    examples: [
      { name: 'Thiết kế đồ họa', minScore: 26 },
      { name: 'Kiến trúc', minScore: 25 },
      { name: 'Nghệ thuật đa phương tiện', minScore: 24 },
      { name: 'Quan hệ công chúng', minScore: 25 },
    ],
  },
  {
    category: 'research',
    label: 'Khoa học & Nghiên cứu',
    description: 'Phù hợp nếu bạn thích nghiên cứu, khám phá và tìm hiểu quy luật tự nhiên.',
    examples: [
      { name: 'Khoa học vật liệu', minScore: 24 },
      { name: 'Hóa học', minScore: 25 },
      { name: 'Sinh học', minScore: 25 },
      { name: 'Vật lý học', minScore: 25 },
    ],
  },
]